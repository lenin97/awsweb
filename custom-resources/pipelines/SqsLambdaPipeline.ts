import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';

export interface SqsLambdaPipelineProps {
  producer: lambda.Function;
  consumer: lambda.Function;

  queueName?: string;

  visibilityTimeout?: cdk.Duration;
  maxReceiveCount?: number;
  fifo?: boolean;
}

export class SqsLambdaPipeline extends Construct {
  public readonly queue: sqs.Queue;
  public readonly dlq: sqs.Queue;

  constructor(scope: Construct, id: string, props: SqsLambdaPipelineProps) {
    super(scope, id);

    const visibilityTimeout = props.visibilityTimeout ?? cdk.Duration.seconds(300);
    const maxReceiveCount = props.maxReceiveCount ?? 3;
    const fifo = props.fifo ?? false;

    // 1️⃣ Dead-letter queue
    this.dlq = new sqs.Queue(this, 'DLQ', {
      retentionPeriod: cdk.Duration.days(14),
      fifo,
      queueName: fifo ? `${props.queueName}-dlq.fifo` : undefined,
    });

    // 2️⃣ Main queue
    this.queue = new sqs.Queue(this, 'Queue', {
      queueName: props.queueName,
      fifo,
      visibilityTimeout,
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount,
      },
    });

    // 3️⃣ Consumer Lambda ← SQS
    this.queue.grantConsumeMessages(props.consumer);
    props.consumer.addEventSource(
      new eventsources.SqsEventSource(this.queue, {
        batchSize: 1, // safer default
      })
    );

    // 4️⃣ Producer Lambda → SQS
    this.queue.grantSendMessages(props.producer);
    props.producer.addEnvironment(
      `${id.toUpperCase()}_QUEUE_URL`,
      this.queue.queueUrl
    );
  }
}
