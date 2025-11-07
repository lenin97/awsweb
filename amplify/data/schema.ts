import {
    type ClientSchema,
    a,
    defineData,
    defineFunction,
  } from "@aws-amplify/backend";
  import {processTextAI,textractResult,mdx2htmlEventHandler,tailorCVEvent} from "../ampfuncs/resource"
  import {uploadCVresolvflow,tailoredCVflow, saveTailoredCV,signerCDN } from "../tasksResolvers/resource"

    export const schema = a.schema({
////////////////////////////////////////////////////////////// model graphQL
    JobProgress: a.model({
      jobId: a.id().required(),
      step: a.string().required(),
      signedUrl: a.string().required(),
      status: a.string().required(),
      message: a.string().required(),
      owner: a.string().required()
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
    authorization(allow=>[allow.publicApiKey().to(['read','create'])]),//a.allow.apiKey()
//////////////////////////////////////////////////////////////////////////
    CVreg: a.model({
      id: a.string().required(),
      cvPathBucket: a.string().required(),
      jobDesc: a.string().required(),
      jobTitle: a.string().required(),
      bucketId: a.string().required(),
      owner: a.string().required()/*,
      extractedCV: a.string().required(),
      tailoredCV: a.string().required(),
      tailoredCVPath: a.string().required()*/
    }).//for user-specific authenticated data//// For user-owned resources//for user-specific models, like user dashboards, profiles,settings, etc
    // Enforces row-level security: only the user who created the data can read/write it. 
    //Maps automatically to the userId passed via Cognito (Amplify adds this under the hood when using getCurrentUser()).
    authorization(allow=>[allow.guest()]),

////////////////////////////////////////////////////////////// upload Flow
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
/*
    validateInputs: a.query().
    arguments({cvid: a.ref('CVid')}).
    returns(a.string()).
    authorization(allow=>[allow.authenticated()]).
    handler(a.handler.function(validateInputs)),

    extCVarg: a.customType({
      bucketPath: a.string().required(),
      pathFile: a.string().required()
    }),
/*
    extractCVContent: a.query().
    arguments({extCVargArg: a.ref('extCVarg')}).
    returns(a.string()).
    authorization(allow=>[allow.authenticated()]).
    handler(a.handler.function(extractCVContent)),
*/
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

//////////////////////////////////////////////////////////////2nd step
/*
    tailorCVarg: a.customType({
      extedCV: a.string().required(),//extractedCV
      jobDesc: a.string().required()//jobDescription 
    }),

    tailorCV: a.query().
    arguments({tailorCVargArg: a.ref('tailorCVarg')}).
    returns(a.string()).
    authorization(allow=>[allow.authenticated()]).
    handler(a.handler.function(tailorCV)),//2nd step
    */
  
//////////////////////////////////////////////////////////////3rd step
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
/*
    genCVpatharg: a.customType({
      newCVpath: a.string().required()
    }),

    generateResponse: a.query().
    arguments({genCVpathargArg: a.ref('genCVpatharg')}).
    returns(a.string()).
    authorization(allow=>[allow.authenticated()]).
    handler(a.handler.function(generateResponse))*/

  })
    
  .authorization(allow => [
    allow.resource(tailoredCVflow).to(['query', 'mutate']),//mdx2htmlEventHandler
    allow.resource(uploadCVresolvflow).to(['query', 'mutate']),
    allow.resource(textractResult).to(['query', 'mutate']),
    allow.resource(processTextAI).to(['query', 'mutate']),
    allow.resource(signerCDN).to(['query', 'mutate']),
    allow.resource(mdx2htmlEventHandler).to(['query', 'mutate']),//tailorCVEvent
    allow.resource(tailorCVEvent).to(['query', 'mutate'])
  ])
  
  ; // allow query and subscription operations but not mutations;