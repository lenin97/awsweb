import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient
} from '@aws-sdk/lib-dynamodb'
import { runWithAmplifyServerContext, region } from '@/lib/amplifyServer';
import { cookies } from 'next/headers';
import { fetchAuthSession } from 'aws-amplify/auth/server';
//import type { MDXRemoteSerializeResult } from 'next-mdx-remote';

let ddbClient 
let ddb

export async function dynamoDBClient(): Promise<DynamoDBDocumentClient> {
  // Await the async cache loader
  await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: async (contextSpec) => {

         const session = await fetchAuthSession(contextSpec);

         ddbClient = new DynamoDBClient({
                                region,
                                credentials: session.credentials,
                              })
         ddb = DynamoDBDocumentClient.from(ddbClient)
      
  }})

  return ddb!;
  //return null
}