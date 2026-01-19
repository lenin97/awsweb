import {
    defineFunction,
  } from "@aws-amplify/backend";
  import { secret } from '@aws-amplify/backend';

   export const uploadCVresolvflow = defineFunction({///################### 1st point
    name: "uploadResolv",
    entry: './uploadCVresolv.ts',
    resourceGroupName: 'data',
    environment: {
      //PUBLIC_BUCKET_NAME: 'amplify-yourappid-env-publicbucket'
    },
   // permissions: [firstBucket],
  })

  export const tailoredCVflow = defineFunction({///################### 2nd point
    name: "processTailorCVflow",
    entry: './tailoredCVflow.ts',
    timeoutSeconds: 60,
    resourceGroupName: 'data',
  })
///#################################

//########################################
/*
  export const tailorCV = defineFunction({///################### 4th point
    entry: './tasksResolvers/tailorCV.ts'
  })
*/
  export const saveTailoredCV = defineFunction({///################### 5th point
    name: "saveTailoredCV",
    entry: './saveTailoredCV.ts',
    resourceGroupName: 'storage'
  })

  export const signerCDN = defineFunction({///################### 5th point
    name: "signerCDN",
    entry: './signerCDN.ts',
    resourceGroupName: 'data',
    environment: {
      //NAME: "signerCDN_env",
      CF_DOMAIN:       secret("CLOUDFRONT_DOMAIN"),
      KEY_PAIR_ID:     secret("CLOUDFRONT_KEY_PAIR_ID"),
      PRIVATE_KEY_B64: secret("CLOUDFRONT_PRIVATE_KEY"),
    },
    //resourceGroupName: 'storage'
  })

  export const metaGenerator = defineFunction({///################### 1st point
    name: "metaGenerator",
    entry: './metaGenerator.ts',
    timeoutSeconds: 60,
    resourceGroupName: 'storage',
    environment: {
      TCV_APP_NAME_HEADER:'ResumeMakeAI',
      TCV_BASE_DOMAIN:'https://resumemakeai.com',
      TCV_OPENGRAPH_IMG:'/logo.png',
      TCV_EMAIL_CONTACT:'resumemakeai@gmail.com',
      TCV_X_PROFILE:'https://x.com/ResumeMakeAI',
      TCV_LINKEDIN_PROFILE:'https://www.linkedin.com/in/resumemakeai-38622837a/',
      TCV_INST_PROFILE:'https://www.instagram.com/resumemakeai/',
      TCV_TIKTOK_PROFILE:'https://www.tiktok.com/@resumemakeai',
      TCV_SUBDOMAIN_TOOL_CV:'/tailorCV/home',
      TCV_CDN:'https://assets.resumemakeai.com',
      TCV_OPENGRAPH_META_ROUTE:'/metadata/opengraph-image'
    },
   // permissions: [firstBucket],
  })