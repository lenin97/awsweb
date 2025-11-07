import {defineFunction} from "@aws-amplify/backend";

    export const processTextAI = defineFunction({///################### 1st point
    name: "processTextAI",
    entry: './processTextAI.ts',
    resourceGroupName: 'data',
    environment: {
      //PUBLIC_BUCKET_NAME: 'amplify-yourappid-env-publicbucket'
    },
   // permissions: [firstBucket],
  })

  export const textractResult = defineFunction({///################### 1st point
    name: "textractResult",
    entry: './textractResult.ts',
    timeoutSeconds: 60,
    resourceGroupName: 'data',
    environment: {
      //MODEL_ID: "amazon.titan-text-lite-v1"
      //PUBLIC_BUCKET_NAME: 'amplify-yourappid-env-publicbucket'
    },
   // permissions: [firstBucket],
  })

  export const mdx2htmlEventHandler = defineFunction({///################### 1st point
    name: "mdx2htmlEventHandler",
    entry: './mdx2htmlEventHandler.ts',
    timeoutSeconds: 60,
    resourceGroupName: 'storage',
    environment: {
      PREFIX: "mediaApp/public/posts/",
     // AMPLIFY_DATA_DEFAULT_NAME:"nodata"
      //PUBLIC_BUCKET_NAME: 'amplify-yourappid-env-publicbucket'
    },
   // permissions: [firstBucket],
  })

    export const seoEventHandler = defineFunction({///################### 1st point
    name: "seoEventHandler",
    entry: './seoEventHandler.ts',
    timeoutSeconds: 60,
    resourceGroupName: 'storage',
    environment: {
      PREFIX: "mediaApp/public/seo/",
     // AMPLIFY_DATA_DEFAULT_NAME:"nodata"
      //PUBLIC_BUCKET_NAME: 'amplify-yourappid-env-publicbucket'
    },
   // permissions: [firstBucket],
  })//

  export const tailorCVEvent = defineFunction({///################### 1st point
    name: "tailorCVEvent",
    entry: './tailorCVEvent.ts',
    timeoutSeconds: 60,
    resourceGroupName: 'storage',
    environment: {
      //PREFIX: "mediaApp/public/seo/",
     // AMPLIFY_DATA_DEFAULT_NAME:"nodata"
      //PUBLIC_BUCKET_NAME: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    },
   // permissions: [firstBucket],
  })//modelParamEventHandler

  export const modelParamEventHandler = defineFunction({///################### 1st point
    name: "modelParamEventHandler",
    entry: './modelParamEventHandler.ts',
    timeoutSeconds: 60,
    resourceGroupName: 'storage',
    environment: {
      //PREFIX: "mediaApp/public/seo/",
     // AMPLIFY_DATA_DEFAULT_NAME:"nodata"
      //PUBLIC_BUCKET_NAME: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'
    },
   // permissions: [firstBucket],
  })