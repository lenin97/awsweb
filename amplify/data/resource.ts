import {
    type ClientSchema,
    defineData,
  } from "@aws-amplify/backend";
import {schema} from "./schema"
import { Code, Function, Runtime } from "aws-cdk-lib/aws-lambda";
import { DockerImage,Duration } from "aws-cdk-lib";
import { execSync } from "node:child_process";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import * as fs from "node:fs";
import {processTextAI,textractResult} from "../ampfuncs/resource"
import {uploadCVresolvflow,tailoredCVflow, saveTailoredCV } from "../tasksResolvers/resource"
//import {textractLambda} from "../backend"
//import {firstBucket} from "../storage/resource"
//import { firstBucket } from '../storage/resource';

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({ 
  schema,
  authorizationModes:{
    defaultAuthorizationMode: "identityPool",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    }
  }
});
