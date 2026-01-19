import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as eventsources from 'aws-cdk-lib/aws-lambda-event-sources';

export interface SnsSqsLambdaPipelineProps {
  publisher: lambda.Function;
  consumer: lambda.Function;

  topicName?: string;
  queueName?: string;

  visibilityTimeout?: cdk.Duration;
  maxReceiveCount?: number;
}

export class SnsSqsLambdaPipeline extends Construct {
  public readonly topic: sns.Topic;
  public readonly queue: sqs.Queue;
  public readonly dlq: sqs.Queue;

  constructor(scope: Construct, id: string, props: SnsSqsLambdaPipelineProps) {
    super(scope, id);

    const visibilityTimeout = props.visibilityTimeout ?? cdk.Duration.seconds(300);
    const maxReceiveCount = props.maxReceiveCount ?? 3;

    // 1️⃣ SNS Topic
    this.topic = new sns.Topic(this, 'Topic', {
      topicName: props.topicName,
    });

    // 2️⃣ DLQ
    this.dlq = new sqs.Queue(this, 'DLQ', {
      retentionPeriod: cdk.Duration.days(14),
    });

    // 3️⃣ Main Queue
    this.queue = new sqs.Queue(this, 'Queue', {
      queueName: props.queueName,
      visibilityTimeout,
      deadLetterQueue: {
        queue: this.dlq,
        maxReceiveCount,
      },
    });

    // 4️⃣ SNS → SQS subscription
    this.topic.addSubscription(
      new subs.SqsSubscription(this.queue)
    );

    // 5️⃣ Allow SNS → SQS
    this.queue.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['sqs:SendMessage'],
        principals: [new iam.ServicePrincipal('sns.amazonaws.com')],
        resources: [this.queue.queueArn],
        conditions: {
          ArnEquals: {
            'aws:SourceArn': this.topic.topicArn,
          },
        },
      })
    );

    // 6️⃣ Consumer Lambda ← SQS
    this.queue.grantConsumeMessages(props.consumer);
    props.consumer.addEventSource(
      new eventsources.SqsEventSource(this.queue)
    );

    // 7️⃣ Publisher Lambda → SNS
    this.topic.grantPublish(props.publisher);
    props.publisher.addEnvironment(
      `${id.toUpperCase()}_TOPIC_ARN`,
      this.topic.topicArn
    );
  }
}

/*
new SnsSqsLambdaPipeline(custom, 'TextractToAI', {
  publisher: textractResultHandler,
  consumer: nextHandler,

  topicName: 'TextractCompletedTopic',
  queueName: 'TextractCompletedQueue',

  visibilityTimeout: cdk.Duration.seconds(300),
  maxReceiveCount: 3,
});
*/