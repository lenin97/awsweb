import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { uploadCVresolvflow,tailoredCVflow, saveTailoredCV,signerCDN } from "./tasksResolvers/resource"
import { textractResult, processTextAI,mdx2htmlEventHandler,seoEventHandler,tailorCVEvent,modelParamEventHandler } from './ampfuncs/resource';
import { firstBucket } from './storage/resource';
//import { CustomFunctionStack } from './custom-resources/custom-function-stack';
import * as path from 'node:path';
import * as fs from 'node:fs';
import { PythonFunction } from '@aws-cdk/aws-lambda-python-alpha';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Code, DockerImage, Duration } from 'aws-cdk-lib';
import { execSync } from 'node:child_process';
import { TextractStack } from './custom-resources/pythGetFileContent/textract-lambda';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as sns from "aws-cdk-lib/aws-sns";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as subs from "aws-cdk-lib/aws-sns-subscriptions";
import * as iam from "aws-cdk-lib/aws-iam";
import * as eventsources from "aws-cdk-lib/aws-lambda-event-sources";
import * as cdk from "aws-cdk-lib";
import * as ddb from 'aws-cdk-lib/aws-dynamodb';
import { EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { secret } from '@aws-amplify/backend';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { CfnApplicationInferenceProfile } from 'aws-cdk-lib/aws-bedrock';
//import { addCloudFrontKeyGroup } from "./custom-resources/cloudfront-keygroup";
//import { tailoredCVflow, uploadCVresolvflow } from './data/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
export const backend = defineBackend({
  auth,
  data,
  firstBucket,
  tailoredCVflow,
  uploadCVresolvflow,
  saveTailoredCV,
  textractResult,
  processTextAI,
  signerCDN,
  mdx2htmlEventHandler,
  seoEventHandler,
  tailorCVEvent,
  modelParamEventHandler
});

const custom = backend.createStack("CustomResources");//***************************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
// 🔎 Access the generated table correctly:
// Access the CFN L1/L2 resource for your MDXupdates table
const modelParamTriggerFunc = backend.modelParamEventHandler.resources.lambda as lambda.Function;
const mdxFn = backend.mdx2htmlEventHandler.resources.lambda as lambda.Function;
const fnRole = mdxFn.role!;
const tbMDXupdates = backend.data.resources.tables["MDXupdates"];
const dataStack = cdk.Stack.of(tbMDXupdates);

const prenm_posts='mediaApp/public/posts/'
const triggerEventFile='done.txt'

backend.firstBucket.resources.bucket.addEventNotification(
    EventType.OBJECT_CREATED_PUT,
    new LambdaDestination(mdxFn),
    {
      prefix: prenm_posts,
      suffix: triggerEventFile,
    }
);

backend.firstBucket.resources.bucket.addEventNotification(
    EventType.OBJECT_CREATED_COMPLETE_MULTIPART_UPLOAD,
    new LambdaDestination(mdxFn),
    {
      prefix: prenm_posts,
      suffix: triggerEventFile,
    }
);

const prenm_seo='mediaApp/public/seo/'

backend.firstBucket.resources.bucket.addEventNotification(
    EventType.OBJECT_CREATED_PUT,
    new LambdaDestination(seoEvTrig),
    {
      prefix: prenm_seo,
      suffix: triggerEventFile,
    }
);

backend.firstBucket.resources.bucket.addEventNotification(
    EventType.OBJECT_CREATED_COMPLETE_MULTIPART_UPLOAD,
    new LambdaDestination(seoEvTrig),
    {
      prefix: prenm_seo,
      suffix: triggerEventFile,
    }
);
////////////////////////////////////////////////////////////////////////////////////////////
const prenm_toolTailorCV='tools/tailorcv/'
const tE_toolTailorCV='.pdf'//tailorCVEventTrigger
backend.firstBucket.resources.bucket.addEventNotification(
    EventType.OBJECT_CREATED_PUT,
    new LambdaDestination(tailorCVEventTrigger),
    {
      prefix: prenm_toolTailorCV,
      suffix: tE_toolTailorCV,
    }
);

backend.firstBucket.resources.bucket.addEventNotification(
    EventType.OBJECT_CREATED_COMPLETE_MULTIPART_UPLOAD,
    new LambdaDestination(tailorCVEventTrigger),
    {
      prefix: prenm_toolTailorCV,
      suffix: tE_toolTailorCV,
    }
);
////////////////////////////////////////////////////////////////////////////////////////////
// Replace placeholder with actual bucket name at build tim
// 🔗 Attach CDK-defined Lambda
const bucket4perml2 = backend.firstBucket.resources.bucket;
const bucket4phyl1 = backend.firstBucket.resources.cfnResources.cfnBucket;


const lambdaStack = cdk.Stack.of(mdxFn);
const mdxCacheTable = new ddb.Table(lambdaStack,'MdxCacheTable', {
  partitionKey: { name: 'pk', type: ddb.AttributeType.STRING },
  billingMode: ddb.BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: 'ttl',
});

// GSI 1: query by slug (string). Project only needed attributes to save costs.
mdxCacheTable.addGlobalSecondaryIndex({
  indexName: 'slug-index',
  partitionKey: { name: 'slug', type: ddb.AttributeType.STRING },
  // Projection: only include what you need (e.g. payload, articlemeta, body)
  projectionType: ddb.ProjectionType.INCLUDE,
  nonKeyAttributes: ['payload', 'articlemeta', 'body'],
  // For PAY_PER_REQUEST you must NOT supply read/write capacity here.
  // For PROVISIONED billing you would need to specify readCapacity/writeCapacity on the index if required.
});

const watermarkTable = new ddb.Table(lambdaStack, 'watermarkTable', {
  partitionKey: { name: 'pk', type: ddb.AttributeType.STRING },
  billingMode: ddb.BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: 'ttl',
});

const seoStack = cdk.Stack.of(seoEvTrig);
const seoTable = new ddb.Table(seoStack,'seoTable', {
  partitionKey: { name: 'pk', type: ddb.AttributeType.STRING },
  billingMode: ddb.BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: 'ttl',
});

// Grant the Lambda function read/write access to the table
//mdxCacheTable.grantReadWriteData(mdxFn);
mdxCacheTable.grantReadWriteData(fnRole);
watermarkTable.grantReadWriteData(fnRole);
seoTable.grantReadWriteData(seoEvTrig.role!);

(mdxFn).addEnvironment('DYNAMO_TABLE', mdxCacheTable.tableName);
(mdxFn).addEnvironment('WATERMARK_TABLE', watermarkTable.tableName);

(seoEvTrig).addEnvironment('SEO_TABLE', seoTable.tableName);//BUCKET_NAME4EV


const unauthRole = backend.auth.resources.unauthenticatedUserIamRole;

const slugIndexName = 'slug-index'; // change if your index name differs
const indexArn = `${mdxCacheTable.tableArn}/index/${slugIndexName}`;

unauthRole.attachInlinePolicy(
  new Policy(lambdaStack, 'GuestDdbPolicy_mdxCacheTable', {
    statements: [
      new PolicyStatement({
        actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:Query'],
        resources: [mdxCacheTable.tableArn,indexArn],
      }),
    ],
  })
);

// Inject the table name into the Lambda’s environment
//addCloudFrontKeyGroup(custom);//new CloudFront

// 1️⃣ Create SNS Topic
  const textractTopic = new sns.Topic(custom, "TextractJobCompletionTopic", {
    displayName: "Textract Job Completion Topic"
  });

  //2️⃣ DLQ
  const deadLetterQueue = new sqs.Queue(custom, "TextractDLQ", {
    retentionPeriod: cdk.Duration.days(14),
  });

  //  3️⃣ Main SQS Queue
  const textractQueue = new sqs.Queue(custom, "TextractJobQueue", {
    visibilityTimeout: cdk.Duration.seconds(300),
    deadLetterQueue: {
      maxReceiveCount: 3,
      queue: deadLetterQueue,
    },
  });
  // 6️⃣ Allow Textract to publish to SNS
  const textractPublishRole = new iam.Role(custom, "TextractSNSPublishRole", {
    assumedBy: new iam.ServicePrincipal("textract.amazonaws.com"),
  })

  textractPublishRole.addToPolicy(new iam.PolicyStatement({
    actions: ["sns:Publish"],
    resources: [textractTopic.topicArn],
  }));

  // 7️⃣ Result handler function
  const textractResultHandler = backend.textractResult.resources.lambda as lambda.Function;
  textractQueue.grantConsumeMessages(textractResultHandler);
  const txtrsltStack = cdk.Stack.of(textractResultHandler);
  const modelTxtRsltTable = new ddb.Table(txtrsltStack,'ModelTextractResult', {
    partitionKey: { name: 'pk', type: ddb.AttributeType.STRING },
    billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    timeToLiveAttribute: 'ttl',
  });

  ///////////////////////
  const prenm_modelparam='mediaApp/public/param/'
  const suffix_modelparam='modelparam.json'//tailorCVEventTrigger
  backend.firstBucket.resources.bucket.addEventNotification(
      EventType.OBJECT_CREATED_PUT,
      new LambdaDestination(modelParamTriggerFunc),
      {
        prefix: prenm_modelparam,
        suffix: suffix_modelparam,
      }
  );
  backend.firstBucket.resources.bucket.addEventNotification(
      EventType.OBJECT_CREATED_COMPLETE_MULTIPART_UPLOAD,
      new LambdaDestination(modelParamTriggerFunc),
      {
        prefix: prenm_modelparam,
        suffix: suffix_modelparam,
      }
  );
  ////////////////////////
  
  modelParamTriggerFunc.role?.attachInlinePolicy(
    new Policy(txtrsltStack, 'GuestDdbPolicy_mdxCacheTable', {
      statements: [
        new PolicyStatement({
          actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem'],
          resources: [modelTxtRsltTable.tableArn],
        }),
      ],
    })
  );
  ///////////////////////////////////////

 // modelTxtRsltTable.grantReadWriteData(modelParamTriggerFunc.role!);
  modelTxtRsltTable.grantReadWriteData(textractResultHandler.role!);

  (textractResultHandler).addEnvironment('MODEL_TABLE', modelTxtRsltTable.tableName);
  //(modelParamTriggerFunc).addEnvironment('MODEL_TABLE', modelTxtRsltTable.tableName);
  
  
  textractResultHandler.addEnvironment("AWS_NODEJS_CONNECTION_REUSE_ENABLED", "1");
  //textractResultHandler.addEnvironment("SNS_TOPIC_ARN", textractTopic.topicArn);
  textractResultHandler.role?.addToPrincipalPolicy(
    new iam.PolicyStatement({
      actions: [
        "textract:GetDocumentTextDetection",
        // (optionally) also include if you call StartDocumentTextDetection, etc.:
        // "textract:StartDocumentTextDetection",
        // "textract:GetDocumentAnalysis",
      ],
      resources: ["*"],  // scope down to specific Job or S3 ARNs if you can
    })
  );  
  // Read model ARN from environment variable
    // 1) Create the Application Inference Profile
    /*
  const appProfileBedRock = new CfnApplicationInferenceProfile(txtrsltStack, 'GlobalAiprofile', {//ACCOUNT_ID
    inferenceProfileName: 'global-nova-pro',            // update name as needed
    description: 'Global AI model profile with cross-Region routing cost tags',
    modelSource: {
      // copy from provided environment variable
      copyFrom: `arn:aws:bedrock:us-west-2:${process.env.ACCOUNT_ID}:inference-profile/${process.env.MODEL_AI_ARN}`
    },
    tags: [
      { key: 'project',     value: 'my-global-app' },
      { key: 'environment', value: 'production' },
    ],
  });
  */
  // (Optional) Or with CDK’s tagging helpers:
  // cdk.Tags.of(appProfile).add('project', 'my-global-app');
  // cdk.Tags.of(appProfile).add('environment', 'production');
  textractResultHandler.role?.addToPrincipalPolicy(
    new iam.PolicyStatement({
      actions: ["bedrock:InvokeModel"],
      resources: [
        // replace with your actual model ARN:
        `arn:aws:bedrock:eu-west-2::foundation-model/${process.env.MODEL_AI_ARN}`
        //appProfileBedRock.attrInferenceProfileArn 
      ],
    })
  );

  //8️⃣ Connect SQS to Lambda
  textractResultHandler.addEventSource(new eventsources.SqsEventSource(textractQueue));
  

  // 9️⃣ Textract resolver
  const { textractResolver } = TextractStack(custom,"TextractResolver",bucket4phyl1, bucket4perml2);

  // 🔟 Grant invoke + set env
  const callerL2 = backend.tailoredCVflow.resources.lambda as lambda.Function;
  // grant invoker rights
  textractResolver.grantInvoke(callerL2);
  // pass the function name into the caller
  callerL2.addEnvironment("TEXTRACT_FN_NAME", textractResolver.functionName);

  // 🔟 Pass SNS topic + IAM role to textractResolver via env
  textractResolver.addEnvironment("SNS_TOPIC_ARN", textractTopic.topicArn);
  textractResolver.addEnvironment("TEXTRACT_SNS_ROLE_ARN", textractPublishRole.roleArn);

  // ------------------------------
  // New SNS/SQS for nextFunction4nextStep
  // ------------------------------

  // 9. New SNS Topic for post-processing step
  const nextStepTopic = new sns.Topic(custom, "TextractNextStepTopic", {
    displayName: "Textract Post-Processing Topic"
  });

  // 10. New DLQ for next step
  const nextStepDLQ = new sqs.Queue(custom, "NextStepDLQ", {
    retentionPeriod: cdk.Duration.days(14),
  });

  // 11. New SQS Queue for next step
  const nextStepQueue = new sqs.Queue(custom, "NextStepQueue", {
    visibilityTimeout: cdk.Duration.seconds(300),
    deadLetterQueue: {
      maxReceiveCount: 3,
      queue: nextStepDLQ,
    },
  });

  // 12. Subscribe nextStepQueue to nextStepTopic
  nextStepTopic.addSubscription(new subs.SqsSubscription(nextStepQueue));

  // 13. Allow SNS to send to next step SQS
  nextStepQueue.addToResourcePolicy(new iam.PolicyStatement({
    actions: ["sqs:SendMessage"],
    principals: [new iam.ServicePrincipal("sns.amazonaws.com")],
    resources: [nextStepQueue.queueArn],
    conditions: {
      ArnEquals: {
        "aws:SourceArn": nextStepTopic.topicArn,
      },
    },
  }));

  // 14. Connect nextFunction4nextStep Lambda to SQS queue
  const nextHandler = backend.processTextAI.resources.lambda as lambda.Function;
  nextStepQueue.grantConsumeMessages(nextHandler);
  nextHandler.addEnvironment("AWS_NODEJS_CONNECTION_REUSE_ENABLED", "1");
  nextHandler.addEventSource(new eventsources.SqsEventSource(nextStepQueue));

  // 15. Grant publish rights to textractResult (so it can trigger the next step)
  nextStepTopic.grantPublish(textractResultHandler);
  textractResultHandler.addEnvironment("NEXT_STEP_TOPIC_ARN", nextStepTopic.topicArn);

export default backend

backend.addOutput({//mdxCacheTable.tableName//mdxUpdatesTable.tableName
  //POSTS_TABLE: mdxCacheTable.tableName
  custom: {
    CACHE_POSTTABLE: mdxCacheTable.tableName,
    UPDATES_CACHE_POSTTABLE: tbMDXupdates.tableName,//seoTable
    SEO_TABLE: seoTable.tableName,
    //CF_DOMAIN: process.env.CLOUDFRONT_DOMAIN,
    //KEY_PAIR_ID:secret('CLOUDFRONT_KEY_PAIR_ID'),
    //PRIVATE_KEY_B64:secret('CLOUDFRONT_PRIVATE_KEY'),
  }  
});