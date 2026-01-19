// src/textractResult.ts
// Production-ready, fully typed, dual-source Lambda

import type {
  Handler,
  SQSEvent,
  DynamoDBStreamEvent,
  DynamoDBRecord,
} from "aws-lambda";

import { TextractClient, GetDocumentTextDetectionCommand } from "@aws-sdk/client-textract";
import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConversationRole,
  type ConverseCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import { Readable } from "stream";

import type { Schema } from "../data/resource";
import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { env } from "$amplify/env/textractResult";

/* ------------------------------------------------------------------ */
/* Amplify / AWS clients                                               */
/* ------------------------------------------------------------------ */

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);

Amplify.configure(resourceConfig, libraryOptions);

const textract = new TextractClient({});
const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const sns = new SNSClient({});
const s3 = new S3Client({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const client = generateClient<Schema>();

/* ------------------------------------------------------------------ */
/* Env                                                                 */
/* ------------------------------------------------------------------ */

const NEXT_STEP_TOPIC_ARN = process.env.NEXT_STEP_TOPIC_ARN!;
const MODEL_AI_TABLE = process.env.MODEL_TABLE!;
const OUTPUT_BUCKET = process.env.BUCKET_NAME;

console.log("[textractResult:init]", {
  region: process.env.AWS_REGION,
  hasNextTopic: !!NEXT_STEP_TOPIC_ARN,
  hasModelTable: !!MODEL_AI_TABLE,
  hasBucket: !!OUTPUT_BUCKET,
});

/* ------------------------------------------------------------------ */
/* Type guards                                                         */
/* ------------------------------------------------------------------ */

function isDynamoDBStreamEvent(
  event: SQSEvent | DynamoDBStreamEvent
): event is DynamoDBStreamEvent {
  return (
    Array.isArray(event.Records) &&
    event.Records.length > 0 &&
    "eventSource" in event.Records[0] &&
    event.Records[0].eventSource === "aws:dynamodb"
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

type InferenceConfig = {
  maxTokens: number;
  temperature?: number;
  stopSequences?: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const modelLimits: Record<string, { contextMax: number; outputMax: number; }> = {
  'nova-pro': { contextMax: 300_000, outputMax: 5_000 }
};

function sanitizePrompt(template: string): string {
  return template.replace(/[\x00-\x1F\x7F]/g, "");
}

function sanitizeStopSequences(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  const seen = new Set<string>();
  const out: string[] = [];

  for (const item of raw) {
    if (item == null) continue;
    const s = String(item)
      .replace(/[\x00-\x1F\x7F]/g, "")
      .replace(/\r?\n+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim()
      .slice(0, 64);

    if (!s || s.length < 4 || !/[A-Za-z0-9]/.test(s)) continue;
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
      if (out.length >= 4) break;
    }
  }
  return out;
}

async function streamToString(stream: Readable): Promise<string> {
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", reject);
    stream.on("end", () =>
      resolve(Buffer.concat(chunks).toString("utf-8"))
    );
  });
}

/* ------------------------------------------------------------------ */
/* Core business logic (UNCHANGED, logging added)                       */
/* ------------------------------------------------------------------ */

async function processText(params: {
  textOutput: string;
  jobIdCustom: string;
}): Promise<void> {
  const { textOutput, jobIdCustom } = params;

  console.log("[textractResult:processText:start]", {
    jobIdCustom,
    textLength: textOutput.length,
  });

  await client.models.JobProgress.update({
    id: jobIdCustom,
    //step: "Matching with job spec",
    status: 'sts002'
  });

  const cv = await client.models.CVreg.get({ id: jobIdCustom });//prompt4bedrock
  const jobDesc = cv.data?.jobDesc;

  if (!jobDesc) {
    console.warn("[textractResult] Missing jobDesc", { jobIdCustom });
    return;
  }

  const modelCfg = await ddb.send(
    new GetCommand({
      TableName: MODEL_AI_TABLE,
      Key: { pk: "0" },
      ProjectionExpression:
        "model_id, prompt, charsPerToken, maxTokenCount, temperature, stopSequences, pageMultiplier",
    })
  );

  if (!modelCfg.Item) {
    console.error("[textractResult] Model config missing");
    throw new Error("Model configuration missing");
  }

  const {
    model_id,
    prompt: promptTemplateRaw,
    charsPerToken,
    maxTokenCount: maxTokenCountRaw,
    temperature:temperatureRaw,
    topP: topPRaw,
    stopSequences,
    pageMultiplier: pageMultiplierRaw,
  } = modelCfg.Item as Record<string, unknown>;

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

  console.log("[textractResult:bedrock:invoke]", {
    jobIdCustom,
    model: model_id,
    maxTokens: cappedTokens,
  });

  console.log("[textractResult:bedrock:invoke]::tokencap", {
    rawCap,
    maxTokenCount,
    modelOutputMax,
  });
///////////////////////////////
  const safeStopSequences = sanitizeStopSequences(stopSequences);

  const inferenceConfig: InferenceConfig = {
    maxTokens: cappedTokens,
    temperature,
  };

  if (safeStopSequences.length > 0) {
    inferenceConfig.stopSequences = safeStopSequences;
  } else {
    console.warn("[textractResult] No valid stopSequences after sanitization", {
      jobIdCustom,
    });
  }

  const message2model = {
    role: ConversationRole.USER,
    content: [{ text: prompt }],
  };

  console.log("[textractResult:bedrock:invoke]", {
    jobIdCustom,
    model: model_id,
    inferenceConfig,
  });

  let convResp: ConverseCommandOutput;

  try {
    convResp = await bedrock.send(
      new ConverseCommand({
        modelId: String(model_id),
        messages: [message2model],
        inferenceConfig,
      })
    );
  } catch (err) {
    console.error("[textractResult] Bedrock ConverseCommand failed", {
      jobIdCustom,
      err,
    });
    throw err;
  }

  // Defensive response extraction (same pattern as reference)
  let tailoredCV: string | null = null;

  if (
    isRecord(convResp.output) &&
    isRecord(convResp.output.message)
  ) {
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

  console.log("[textractResult:bedrock:response]", {
    jobIdCustom,
    requestId: convResp.$metadata?.requestId,
    httpStatus: convResp.$metadata?.httpStatusCode,
    hasText: !!tailoredCV,
  });

  if (!tailoredCV) {
    console.warn("[textractResult] Empty AI response", { jobIdCustom });
  }

  ////////////////////////////////////////
  await sns.send(
    new PublishCommand({
      TopicArn: NEXT_STEP_TOPIC_ARN,
      Message: JSON.stringify({ tailoredCV, progressId: jobIdCustom }),
    })
  );
/*
  await client.models.CVreg.update({
    id: jobIdCustom,
    prompt4bedrock: prompt,
  });
*/
  console.log("[textractResult:processText:done]", { jobIdCustom });
}

/* ------------------------------------------------------------------ */
/* Lambda handler                                                      */
/* ------------------------------------------------------------------ */

export const handler: Handler<
  SQSEvent | DynamoDBStreamEvent
> = async (event) => {
  console.log("[textractResult] Event received", {
    recordCount: event.Records.length,
    source: isDynamoDBStreamEvent(event) ? "DynamoDB" : "SQS",
  });

  /* ---------------- DynamoDB Stream path ---------------- */
  if (isDynamoDBStreamEvent(event)) {
    for (const rec of event.Records as DynamoDBRecord[]) {
      if (rec.eventName !== "MODIFY") continue;

      const img = rec.dynamodb?.NewImage;
      if (!img) continue;

      if (img.sk?.S !== "META" || img.status?.S !== "DONE") continue;

      const jobIdCustom = img.doc_id?.S;
      const outputKey = img.output_s3_key?.S;
      const progress_id = img.progress_id?.S;

      if (!jobIdCustom || !outputKey || !progress_id) {
        console.warn("[textractResult] Incomplete DynamoDB record");
        continue;
      }

      console.log("[textractResult:DDB] Processing", {
        jobIdCustom,
        outputKey,
      });

      const obj = await s3.send(
        new GetObjectCommand({
          Bucket: OUTPUT_BUCKET,
          Key: outputKey,
        })
      );

      const textOutput = await streamToString(obj.Body as Readable);
      await processText({ textOutput, jobIdCustom: progress_id });
    }

    return { statusCode: 200 };
  }

  /* ---------------- SQS (Textract) path ---------------- */
  let failures = 0;

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      const msg = JSON.parse(body.Message);

      if (msg.Status !== "SUCCEEDED") {
        console.log("[textractResult:SQS] Ignored status", msg.Status);
        continue;
      }

      console.log("[textractResult:SQS] Textract job completed", {
        jobId: msg.JobId,
        jobTag: msg.JobTag,
      });

      const jp = await client.models.JobProgress.get({ id: msg.JobTag });
      const jobIdCustom = jp.data?.jobId;

      if (!jobIdCustom) {
        console.warn("[textractResult] Missing jobIdCustom", msg.JobTag);
        continue;
      }

      // Textract pagination and line extraction
      const lines: string[] = [];
      const seenBlocks = new Set<string>();
      let nextToken: string | undefined = undefined;

      do {
        const cmd: GetDocumentTextDetectionCommand = new GetDocumentTextDetectionCommand({ JobId: msg.jobId, NextToken: nextToken });
        const page = await textract.send(cmd);
        nextToken = page.NextToken;

        for (const block of page.Blocks ?? []) {
          if (block.BlockType === "LINE" && block.Text && block.Id && !seenBlocks.has(block.Id)) {
            seenBlocks.add(block.Id);
            lines.push(block.Text);
          }
        }
      } while (nextToken);

      console.log("[textractResult:Textract] Lines extracted", {
        jobIdCustom,
        lineCount: lines.length,
      });

      await processText({
        textOutput: lines.join("\n").trim(),
        jobIdCustom,
      });
    } catch (err) {
      failures++;
      console.error("[textractResult:SQS:error]", err);
    }
  }

  return {
    statusCode: failures === 0 ? 200 : 207,
    body: `Processed ${event.Records.length}, failures=${failures}`,
  };
};
