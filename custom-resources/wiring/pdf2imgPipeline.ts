import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";

import { createPDFsTable } from "../ddbs/createPDFsTable";
import { AggregatorStack } from "../lambdas/aggregator";
import { Splitter_PDF_Stack } from "../lambdas/splitter_pdf";
import { Splitter_DOCX_Stack } from "../lambdas/splitter_docx";
import { WorkerStack } from "../lambdas/worker";
import { SqsLambdaPipeline } from "../pipelines/SqsLambdaPipeline";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { config_textractResult } from "../amplifyCDK/config_textractResult";
import { addFilteredS3Trigger } from "./s3-lambda-triggers";
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';

export interface Pdf2ImgPipelineProps {
  stack: cdk.Stack;

  bucketL1: s3.CfnBucket;
  bucketL2: s3.IBucket;

  popplerLayerArn: string;
  docxLayerArn: string;

  fn: lambda.Function;

  fn4s3: lambda.Function;
}

export function constructPdf2ImgPipeline({
  stack,
  bucketL1,
  bucketL2,
  popplerLayerArn,
  docxLayerArn,
  fn,
  fn4s3
}: Pdf2ImgPipelineProps) {
  /* ---------------- DynamoDB ---------------- */

  const PDFsTable = createPDFsTable(stack);

  /* ---------------- Lambdas ---------------- */

  const { aggregatorFn } = AggregatorStack(
    stack,
    "AggregatorFn",
    PDFsTable,
    bucketL1,
    bucketL2
  );

  const { splitter_pdf_Fn } = Splitter_PDF_Stack(
    stack,
    "SplitterPDFFn-cf",
    bucketL1,
    bucketL2,
    PDFsTable,
    popplerLayerArn
  );

  const { splitter_docx_Fn } = Splitter_DOCX_Stack(
    stack,
    "SplitterDocxFn-cf",
    bucketL1,
    bucketL2,
    PDFsTable,
    docxLayerArn
  );

  const { workerFn } = WorkerStack(
    stack,
    "WorkerFn",
    bucketL1,
    bucketL2,
    PDFsTable
  );

  /* ---------------- SQS Pipeline ---------------- */

  const pipeline = new SqsLambdaPipeline(stack, "SplitterPDF2WorkerPipeline", {
    producer: splitter_pdf_Fn,
    consumer: workerFn,
    queueName: "pdf2worker-queue",
    visibilityTimeout: cdk.Duration.seconds(300),
    maxReceiveCount: 3,
    fifo: false,
  });

  config_textractResult({
    fn,
    table:PDFsTable,
    bucketL1,
    bucketL2
  })

  addFilteredS3Trigger({
    bucketL2,
    fn: fn4s3,
    prefix: "tools/tailorcv/",
    suffix: ".pdf",
  });

  addFilteredS3Trigger({
    bucketL2,
    fn: fn4s3,
    prefix: "tools/tailorcv/",
    suffix: ".docx",
  });

  //const fn4s3Role = fn4s3.role!;
  //const fnstack= cdk.Stack.of(splitterFn) //const dataStack = cdk.Stack.of(tbMDXupdates);

  fn4s3.role!.attachInlinePolicy(
    new Policy(stack, "SplitterInvokeInlinePolicy", {
      statements: [
        new PolicyStatement({
          actions: ["lambda:InvokeFunction"],
          resources: [
            splitter_pdf_Fn.functionArn,
            splitter_docx_Fn.functionArn,
          ],
        }),
      ],
    })
  );

  fn4s3.addEnvironment("PDF_SPLITTER_FN", 'tailorcv-pdf-splitter-lambda');
  fn4s3.addEnvironment("DOCX_SPLITTER_FN", 'tailorcv-docx-splitter-lambda');

  return {
    table: PDFsTable,
    aggregatorFn,
    splitter_pdf_Fn,
    splitter_docx_Fn,
    workerFn,
    queue: pipeline.queue,
    dlq: pipeline.dlq,
  };
}
