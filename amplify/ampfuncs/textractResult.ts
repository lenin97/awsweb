// src/textractResult.ts (or your existing filename)
// Migrated to ConverseCommand (typed, lint-friendly, no `any`)

import { SQSEvent } from "aws-lambda";
import { TextractClient, GetDocumentTextDetectionCommand } from "@aws-sdk/client-textract";
import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConversationRole,
  type ConverseCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";
import { generateClient } from "aws-amplify/data";
import type { Schema } from '../data/resource';
import type { Handler } from 'aws-lambda';
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { Amplify } from 'aws-amplify';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand
} from '@aws-sdk/lib-dynamodb';

// Amplify data client config (top-level await as in your original)

const textract = new TextractClient({});
const client = generateClient<Schema>();
const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const sns = new SNSClient({});
const NEXT_STEP_TOPIC_ARN = process.env.NEXT_STEP_TOPIC_ARN || "";
const MODEL_AI_TABLE = process.env.MODEL_TABLE || "";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

// helpers
function sanitizePrompt(template: string): string {
  return template.replace(/[\x00-\x1F\x7F]/g, "");
}

function sanitizeStopSequences(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const out: string[] = [];

  for (const item of raw) {
    if (item === null || item === undefined) continue;
    const s = String(item)
      .replace(/[\x00-\x1F\x7F]/g, "") // remove control chars
      .replace(/\r?\n+/g, " ")         // collapse newlines
      .replace(/\s{2,}/g, " ")         // collapse multiple spaces
      .trim()
      .slice(0, 64);                   // limit length

    if (!s) continue;
    // require at least one alphanumeric character and length >= 4 (practical rule)
    if (!/[A-Za-z0-9]/.test(s) || s.length < 4) continue;
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
      if (out.length >= 4) break; // protocol: keep at most 4 items
    }
  }

  return out;
}

// modelLimits lookup (you can extend by model id)
const modelLimits: Record<string, { contextMax: number; outputMax: number; }> = {
  'nova-pro': { contextMax: 300_000, outputMax: 5_000 }
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

type InferenceConfig = {
  maxTokens: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
};

export const handler: Handler = async (event: SQSEvent) => {
  console.log("Received SQS event:", JSON.stringify(event, null, 2));
  let errorCount = 0;

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      const message = JSON.parse(body.Message);
      const jobId = message.JobId;
      const status = message.Status;

      console.log(`Job ${jobId} completed with status: ${status}`);
      if (status !== "SUCCEEDED") {
        console.warn(`Textract job ${jobId} did not succeed.`);
        continue;
      }

      const progressId = message.JobTag;
      if (!progressId) {
        console.warn("Invalid JobTag format:", message.JobTag);
        continue;
      }

      console.log('[textractResult] Step: Matching with job spec');
      await client.models.JobProgress.update({
        id: progressId,
        step: 'Matching with job spec',
      });

      const resultjp = await client.models.JobProgress.get({ id: progressId });
      const jobIdCustom = resultjp.data?.jobId;

      if (!jobIdCustom) {
        console.warn(`[textractResult] Missing jobIdCustom for JobProgress: ${progressId}`);
        continue;
      }

      // Textract pagination and line extraction
      const lines: string[] = [];
      const seenBlocks = new Set<string>();
      let nextToken: string | undefined = undefined;

      do {
        const cmd: GetDocumentTextDetectionCommand = new GetDocumentTextDetectionCommand({ JobId: jobId, NextToken: nextToken });
        const page = await textract.send(cmd);
        nextToken = page.NextToken;

        for (const block of page.Blocks ?? []) {
          if (block.BlockType === "LINE" && block.Text && block.Id && !seenBlocks.has(block.Id)) {
            seenBlocks.add(block.Id);
            lines.push(block.Text);
          }
        }
      } while (nextToken);

      const textOutput = lines.join("\n").trim();
      console.log(`[textractResult] Extracted ${lines.length} lines of text for job ${jobId}`);

      const result = await client.models.CVreg.get({ id: jobIdCustom });
      const jobDesc = result.data?.jobDesc;

      if (!jobDesc) {
        console.warn(`[textractResult] Missing jobDesc for jobIdCustom: ${jobIdCustom}`);
        continue;
      }

      // 1) Fetch model parameters from DynamoDB
      const data = await ddb.send(new GetCommand({
        TableName: MODEL_AI_TABLE,
        Key: { pk: '0' },
        ProjectionExpression: "model_id, prompt, charsPerToken, maxTokenCount, temperature, topP, stopSequences, pageMultiplier"
      }));

      if (!data.Item) {
        console.error("[CV-Tailor] DynamoDB returned no Item for pk=0");
        return { statusCode: 500, body: "Model parameters not found" };
      }

      const {
        model_id,
        prompt: promptTemplateRaw,
        charsPerToken,
        maxTokenCount: maxTokenCountRaw,
        temperature: temperatureRaw,
        topP: topPRaw,
        stopSequences,
        pageMultiplier: pageMultiplierRaw
      } = data.Item as Record<string, unknown>;

      const maxTokenCount = Number(maxTokenCountRaw || 0);
      const temperature = Number(temperatureRaw ?? 0.7);
      const topP = Number(topPRaw ?? 0.9);
      const pageMultiplier = Number(pageMultiplierRaw ?? 1.5);

      // Clean the template
      const promptTemplate = sanitizePrompt(String(promptTemplateRaw ?? ""));

      // Interpolate into your template
      const prompt = promptTemplate
        .replace(/{{\s*CV\s*}}/g, textOutput)
        .replace(/{{\s*JOB_DESCRIPTION\s*}}/g, jobDesc);

      console.log("[CV-Tailor] using model:", model_id);
      console.log("[CV-Tailor] prompt preview:", prompt.slice(0, 200), "…");

      // estimate tokens (heuristic)
      const estimateTokenCount = (text: string) => Math.ceil(text.length / Number(charsPerToken || 4.7));
      const inputTokensEstimate = estimateTokenCount(textOutput + jobDesc);

      // cap tokens: allow pageMultiplier but clamp at both DB max and model hard max
      const rawCap = Math.ceil(inputTokensEstimate * Math.max(1, Number(pageMultiplier || 1)));
      const modelOutputMax = modelLimits['nova-pro'].outputMax;
      const cappedTokens = Math.max(1, Math.min(rawCap, maxTokenCount, modelOutputMax));

      console.log(
        `[CV-Tailor] estimated tokens: ${inputTokensEstimate}, capping at: ${cappedTokens}`
      );

      // sanitize stopSequences
      const safeStopSequences = sanitizeStopSequences(stopSequences);

      // Build typed inferenceConfig and messages
      const inferenceConfig: InferenceConfig = {
        maxTokens: cappedTokens,
        temperature,
        //topP,//// Note: Use either temperature OR topP, but not both
      };

      if (safeStopSequences.length > 0) {
        inferenceConfig.stopSequences = safeStopSequences;
      } else {
        console.warn("[CV-Tailor] no valid stopSequences after sanitization; invoking without stopSequences");
      }

      const message2model = 
        {
          role: ConversationRole.USER,
          content: [{ text: prompt }]
        }
      ;

      console.log("[CV-Tailor] Converse payload preview:", {
        model_id,
        inferenceConfig,
        sampleMessage: message2model
      });

      // Call Bedrock ConverseCommand
      let convResp: ConverseCommandOutput;
      try {
        convResp = await bedrockClient.send(new ConverseCommand({
          modelId: String(model_id),
          messages: [message2model],
          inferenceConfig
        }));
      } catch (err) {
        console.error("[textractResult] Converse invocation failed:", err);
        // let outer catch handle incrementing errorCount / moving on
        throw err;
      }

      // Safely extract text from Converse response
      let tailoredCV: string | null = null;

      if (isRecord(convResp.output) && isRecord(convResp.output.message)) {
        const msg = convResp.output.message;
        const content = msg.content;

        if (Array.isArray(content) && content.length > 0 && isRecord(content[0])) {
          const first = content[0] as Record<string, unknown>;
          const maybeText = first.text;
          if (typeof maybeText === "string") {
            tailoredCV = maybeText;
          } else {
            tailoredCV = null;
          }
        }
      }

      console.log("[textractResult] Converse partial metadata:", {
        requestId: convResp.$metadata?.requestId,
        statusCode: convResp.$metadata?.httpStatusCode
      });
      console.log(`[textractResult] Tailored CV: ${tailoredCV}`);

      // Publish to SNS (unchanged)
      await sns.send(new PublishCommand({
        TopicArn: NEXT_STEP_TOPIC_ARN,
        Message: JSON.stringify({
          tailoredCV,
          progressId,
          jobIdCustom
        }),
      }));

      console.log(`[textractResult] Tailored CV published for job ${jobId}`);
    } catch (error) {
      errorCount++;
      console.error("[textractResult] ❌ Error processing record:", error);
    }
  }

  return {
    statusCode: errorCount === 0 ? 200 : 207,
    body: `Processed ${event.Records.length} job(s), ${errorCount} failed.`,
  };
};
