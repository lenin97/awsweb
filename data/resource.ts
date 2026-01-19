import {
    type ClientSchema,
    defineData,
  } from "@aws-amplify/backend";
import {schema} from "./schema"

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