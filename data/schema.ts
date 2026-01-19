import {a} from "@aws-amplify/backend";
import {processTextAI,textractResult,mdx2htmlEventHandler,tailorCVEvent,seoEventHandler,tailorCVEventS3} from "../ampfuncs/resource"
import {uploadCVresolvflow,tailoredCVflow, saveTailoredCV,signerCDN,metaGenerator } from "../tasksResolvers/resource"

    export const schema = a.schema({
////////////////////////////////////////////////////////////// model graphQL
    JobProgress: a.model({
      jobId: a.id().required(),
      step: a.string().required(),
      signedUrl: a.string().required(),
      status: a.string().required(),
      message: a.string().required(),
      owner: a.string().required(),
      ttl: a.integer()
      //createdAt: ,
    }).//for app-owned private data//For app-owned config//Access is via IAM, but not tied to a Cognito identity.
    secondaryIndexes((index) => [
        // you can name the index anything; by default name === fieldName
        index('jobId'),
      ]).
    authorization(allow=>[allow.guest()]),
////////////////////////////////////////////////////////////// model graphQL

    MDXupdates: a.model({
      slug: a.string().required(),
      messagemdx: a.string().required(),
      messagetitle: a.string()
      //buildNm: a.integer().required(),
      //createdAt: ,
    }).//for app-owned private data//For app-owned config//Access is via IAM, but not tied to a Cognito identity.
    authorization(allow=>[allow.guest().to(['read','update'])]),
    //authorization(allow=>[allow.guest().to(["listen",'read','update'])])

/////////////////////////////////////////////////////////////////////////////////////////
    InputForm00: a.model({
      id: a.string().required(),
      type: a.string().required(),
      placeholder: a.string().required(),
      value: a.string().required(),
      onChange: a.string().required(),
      accept: a.string().required(),
      label: a.string().required(),//// Allow signed-in user to create, read, update,
      num: a.integer().required(),
      nickname: a.string().required()
    }).//for app-owned private data//For app-owned config//Access is via IAM, but not tied to a Cognito identity.
    authorization(allow=>[allow.guest().to(['read','create'])]),//a.allow.apiKey()
//////////////////////////////////////////////////////////////////////////
    CVreg: a.model({
      id: a.string().required(),
      cvPathBucket: a.string().required(),
      jobDesc: a.string().required(),
      jobTitle: a.string().required(),
      bucketId: a.string().required(),
      owner: a.string().required(),
      new_cv_body: a.string(),
      prompt4bedrock: a.string(),
      ttl: a.integer()/*,
      extractedCV: a.string().required(),
      tailoredCV: a.string().required(),
      tailoredCVPath: a.string().required()*/
    }).//for user-specific authenticated data//// For user-owned resources//for user-specific models, like user dashboards, profiles,settings, etc
    // Enforces row-level security: only the user who created the data can read/write it. 
    //Maps automatically to the userId passed via Cognito (Amplify adds this under the hood when using getCurrentUser()).
    authorization(allow=>[allow.guest()]),

//////////////////////////////////////////////////////////////////////
    PostsData: a.model({
      id: a.string().required(),
      slug: a.string(),
      articlemeta: a.string(),
      payload: a.string(),
      body: a.string(),
      ts_content: a.datetime(),
      ts_json: a.datetime(),
      metadata: a.json(),
      script: a.string()
    }).
    secondaryIndexes((index) => [
      // you can name the index anything; by default name === fieldName
      index('slug'),
    ]).//for user-specific authenticated data//// For user-owned resources//for user-specific models, like user dashboards, profiles,settings, etc
    // Enforces row-level security: only the user who created the data can read/write it. 
    //Maps automatically to the userId passed via Cognito (Amplify adds this under the hood when using getCurrentUser()).
    authorization(allow=>[allow.guest()]),
//////////////////////////////////////////////////////////////
    SeoMeta: a.model({
      id: a.string().required(),
      payload: a.string(),
      cacheMeta: a.datetime(),
      ts: a.datetime(),
      metadata: a.json(),
      script: a.string(),
      crawltxt: a.string()
    }).
    authorization(allow=>[allow.guest()]),
//////////////////////////////////////////////////////////////
    uplCVfields: a.customType({
      fileName: a.string().required(),
      jobDesc: a.string().required(),
      jobTitle: a.string().required()
    }),

    retUpInfo: a.customType({
      id_un: a.string().required(),
      int_path: a.string().required()
    }),

    uploadCVflow: a.mutation().
    arguments({uplCVfieldsarg: a.ref('uplCVfields')}).
    returns(a.ref('retUpInfo')).
    authorization(allow=>[allow.guest()]).
    handler(a.handler.function(uploadCVresolvflow)),// 

////////////////////////////////////////////////////////////// Main Flow
    CVid: a.customType({
      idcv: a.string().required()
    }),

    TailoredCVResult : a.customType({
      message: a.string().required(),
      signedUrl: a.string()
    }),

    tailoredCVflow: a.query().
    arguments({cvid: a.ref('CVid')}).
    returns(a.ref('TailoredCVResult')).
    authorization(allow=>[allow.guest()]).
    handler(a.handler.function(tailoredCVflow)),// Main Flow
//////////////////////////////////////////////////////////////1st step

    // Input type now has both the S3 path and an optional TTL in milliseconds
    urlCDN: a.customType({
      filename: a.string().required(),
      ttlMs:  a.integer(),             // optional time‑to‑live (ms)
    }),

    // Define the return object structure
    signedUrlResponse: a.customType({
      statusCode: a.integer().required(),
      body: a.string().required(), // JSON string: { url: "..." }
    }),

    signerCDN: a.mutation().
    arguments({urlCDN: a.ref('urlCDN')}).
    returns(a.ref('signedUrlResponse')).
    authorization(allow=>[allow.guest()]).
    handler(a.handler.function(signerCDN)),//1st step
//////////////////////////////////////////////////////////////
    svnewCVarg: a.customType({
      orgnPath : a.string().required(),
      tailoredCV : a.string().required(),
      userId  : a.string().required()
    }),

    saveTailoredCV: a.query().
    arguments({svnewCVargArg: a.ref('svnewCVarg')}).
    returns(a.string()).
    authorization(allow=>[allow.guest()]).
    handler(a.handler.function(saveTailoredCV)),//3rd step
////////////////////////////////////////////////////////////////////////
    metaJSON: a.customType({
      metainfo: a.string(),
      idname: a.string().required(),
      metastamp: a.string(),
      openGraphType: a.string().required(),
      slug: a.string(),
      articlemeta:a.json()
    }),

    metaGeneratorResponse: a.customType({
      message: a.string().required(),
      savedId: a.string(),
    }),

    metaGenerator: a.mutation().
    arguments({metaJSON: a.ref('metaJSON')}).
    returns(a.ref('metaGeneratorResponse')).
    authorization(allow=>[allow.guest()]).
    handler(a.handler.function(metaGenerator)),
////////////////////////////////////////////////////////////////////////
  })    
  .authorization(allow => [
    allow.resource(tailoredCVflow).to(['query', 'mutate']),//mdx2htmlEventHandler
    allow.resource(saveTailoredCV).to(['query', 'mutate']),//mdx2htmlEventHandler
    allow.resource(uploadCVresolvflow).to(['query', 'mutate']),
    allow.resource(textractResult).to(['query', 'mutate']),
    allow.resource(processTextAI).to(['query', 'mutate']),
    allow.resource(signerCDN).to(['query', 'mutate']),
    allow.resource(mdx2htmlEventHandler).to(['query', 'mutate']),//seoEventHandler
    allow.resource(tailorCVEvent).to(['query', 'mutate']),//tailorCVEventS3
    allow.resource(tailorCVEventS3).to(['query', 'mutate']),
    allow.resource(metaGenerator).to(['query', 'mutate']),
    allow.resource(seoEventHandler).to(['query', 'mutate'])
  ])
  
  ; // allow query and subscription operations but not mutations;