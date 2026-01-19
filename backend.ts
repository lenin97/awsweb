import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { uploadCVresolvflow,tailoredCVflow, saveTailoredCV,signerCDN,metaGenerator } from "./tasksResolvers/resource"
import { textractResult, processTextAI,mdx2htmlEventHandler,seoEventHandler,tailorCVEvent,modelParamEventHandler,s3ImageOptimizer,tailorCVEventS3 } from './ampfuncs/resource';
import { firstBucket } from './storage/resource';
import { TextractStack } from './custom-resources/lambdas/pythGetFileContent';
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
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { constructPdf2ImgPipeline } from "./custom-resources/wiring/pdf2imgPipeline";

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
  tailorCVEventS3,
  modelParamEventHandler,
  metaGenerator,
  s3ImageOptimizer
});

////////////////////////////////////////////////////////////////////////////////////////////
// Replace placeholder with actual bucket name at build tim
// 🔗 Attach CDK-defined Lambda
const bucket4perml2 = backend.firstBucket.resources.bucket;
const bucket4phyl1 = backend.firstBucket.resources.cfnResources.cfnBucket;
const textractResultHandler = backend.textractResult.resources.lambda as lambda.Function;

const pdf2img_resources = backend.createStack("PDF2IMG-RESOURCES");

/* ---------------- Pipeline ---------------- */
constructPdf2ImgPipeline({
  stack: pdf2img_resources,
  bucketL1: bucket4phyl1,
  bucketL2: bucket4perml2,
  popplerLayerArn:"arn:aws:lambda:xx-xxxx-x:999999999999:layer:poppler-pdf2image:5",
  docxLayerArn: 'arn:aws:lambda:xx-xxxx-x:999999999999:layer:word-processing-layer:1',
  fn: textractResultHandler,
  fn4s3: backend.tailorCVEventS3.resources.lambda as lambda.Function
});

// 🔟 Grant invoke + set env
const callerL2 = backend.tailoredCVflow.resources.lambda as lambda.Function;

/////////////////////////////////////////////////////////////////////////////////
const custom = backend.createStack("CustomResources");//***************************!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! */
// Access the CFN L1/L2 resource for your MDXupdates table
const modelParamTriggerFunc = backend.modelParamEventHandler.resources.lambda as lambda.Function;
const mdxFn = backend.mdx2htmlEventHandler.resources.lambda as lambda.Function;
const imgOptimiser = backend.s3ImageOptimizer.resources.lambda as lambda.Function;
const fnRole = mdxFn.role!;
const tbMDXupdates = backend.data.resources.tables["MDXupdates"];//JobProgress

/////////////////////////////////////////////////////////////////////////////////////////
const { cfnResources } = backend.data.resources;

cfnResources.amplifyDynamoDbTables["JobProgress"].timeToLiveAttribute = {
  attributeName: "ttl",
  enabled: true,
};
cfnResources.amplifyDynamoDbTables["CVreg"].timeToLiveAttribute = {
  attributeName: "ttl",
  enabled: true,
};
/////////////////////////////////////////////////////////////////////////////////////////
//const PostsData_table = backend.data.resources.tables["PostsData"];
const dataStack = cdk.Stack.of(tbMDXupdates);
//const PostsData_table_stack = cdk.Stack.of(PostsData_table);
console.log(  "available data tables:",Object.keys(backend.data.resources.tables || {}));//process.env.MODEL_AI_ARN!
console.log("[backend-buildtime]::MODEL_AI_ARN::",process.env.MODEL_AI_ARN,"::ACCOUNT_ID::",process.env.ACCOUNT_ID)
console.log("[backend-buildtime]::TCV_BASE_DOMAIN::",process.env.TCV_BASE_DOMAIN,"::TCV_APP_NAME_HEADER::",process.env.TCV_APP_NAME_HEADER)
const seoEvTrig = backend.seoEventHandler.resources.lambda as lambda.Function;

const triggerEventFile='done.txt'
////////////////////////////////////////////////////////////////////////////////////////////

const prenm_imgs='mediaApp/public/images/'
const bucket4images=backend.firstBucket.resources.bucket

bucket4images.addEventNotification(
    EventType.OBJECT_CREATED_PUT,
    new LambdaDestination(imgOptimiser),
    {
      prefix: prenm_imgs,
      //suffix: triggerEventFile,
    }
);

bucket4images.addEventNotification(
    EventType.OBJECT_CREATED_COMPLETE_MULTIPART_UPLOAD,
    new LambdaDestination(imgOptimiser),
    {
      prefix: prenm_imgs,
      //suffix: triggerEventFile,
    }
);
////////////////////////////////////////////////////////////////////////////////////////////
const prenm_posts='mediaApp/public/posts/'

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
////////////////////////////////////////////////////////////////////////////////////////////

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
const lambdaStack = cdk.Stack.of(mdxFn);

const watermarkTable = new ddb.Table(lambdaStack, 'watermarkTable', {
  partitionKey: { name: 'pk', type: ddb.AttributeType.STRING },
  billingMode: ddb.BillingMode.PAY_PER_REQUEST,
  timeToLiveAttribute: 'ttl',
});
// Grant the Lambda function read/write access to the table
//mdxCacheTable.grantReadWriteData(mdxFn);
watermarkTable.grantReadWriteData(fnRole);

(mdxFn).addEnvironment('WATERMARK_TABLE', watermarkTable.tableName);

const unauthRole = backend.auth.resources.unauthenticatedUserIamRole;

unauthRole.attachInlinePolicy(
  new Policy(dataStack, 'GuestDdbPolicy_mdxUpdatesTable', {
    statements: [
      new PolicyStatement({
        actions: ['dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem'],
        resources: [tbMDXupdates.tableArn],
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

   // 4️⃣ Subscribe SQS to SNS
  textractTopic.addSubscription(new subs.SqsSubscription(textractQueue));

  // 5️⃣ Allow SNS to send to SQS
  textractQueue.addToResourcePolicy(new iam.PolicyStatement({
    actions: ["sqs:SendMessage"],
    principals: [new iam.ServicePrincipal("sns.amazonaws.com")],
    resources: [textractQueue.queueArn],
    conditions: {
      ArnEquals: {
        "aws:SourceArn": textractTopic.topicArn,
      },
    },
  }));

  // 6️⃣ Allow Textract to publish to SNS
  const textractPublishRole = new iam.Role(custom, "TextractSNSPublishRole", {
    assumedBy: new iam.ServicePrincipal("textract.amazonaws.com"),
  })

  textractPublishRole.addToPolicy(new iam.PolicyStatement({
    actions: ["sns:Publish"],
    resources: [textractTopic.topicArn],
  }));

  // 7️⃣ Result handler function
  //const textractResultHandler = backend.textractResult.resources.lambda as lambda.Function;
  textractQueue.grantConsumeMessages(textractResultHandler);
  const txtrsltStack = cdk.Stack.of(textractResultHandler);
  const modelTxtRsltTable = new ddb.Table(txtrsltStack,'ModelTextractResult', {
    partitionKey: { name: 'pk', type: ddb.AttributeType.STRING },
    billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    timeToLiveAttribute: 'ttl',
  });

  ///////////////////////
  const prenm_modelparam='mediaApp/public/param/'
  const suffix_modelparam='modelparam.json'
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
  
  textractResultHandler.role?.addToPrincipalPolicy(
    new iam.PolicyStatement({
      actions: ["bedrock:InvokeModel"],
      resources: [
        // replace with your actual model ARN:
        `arn:aws:bedrock:xx-xxxx-x::foundation-model/${process.env.MODEL_AI_ARN}`
        //appProfileBedRock.attrInferenceProfileArn 
      ],
    })
  );

  //8️⃣ Connect SQS to Lambda
  textractResultHandler.addEventSource(new eventsources.SqsEventSource(textractQueue));
  

  // 9️⃣ Textract resolver
  const { textractResolver } = TextractStack(custom,"TextractResolver",bucket4phyl1, bucket4perml2);

  // 🔟 Grant invoke + set env
  //const callerL2 = backend.tailoredCVflow.resources.lambda as lambda.Function;
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
    //CACHE_POSTTABLE: mdxCacheTable.tableName,
    //UPDATES_CACHE_POSTTABLE: tbMDXupdates.tableName,//seoTable
    //SEO_TABLE: seoTable.tableName,
    //CF_DOMAIN: process.env.CLOUDFRONT_DOMAIN,
    //KEY_PAIR_ID:secret('CLOUDFRONT_KEY_PAIR_ID'),
    //PRIVATE_KEY_B64:secret('CLOUDFRONT_PRIVATE_KEY'),
  }  
});