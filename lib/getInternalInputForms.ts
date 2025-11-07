// app/lib/getInternalInputForms.ts
import { cookies } from 'next/headers';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/data';
//import { backend } from '@/amplify/backend';
//import { runWithAmplifyServerContext } from '@/lib/amplifyServer';
import { type Schema } from '@/amplify/data/resource';
import outputs from '@/amplify_outputs.json';

/*
export async function getInternalInputForms() {
  const client = generateServerClientUsingCookies<Schema>({
    config: backend,
    cookies,
  });

  return runWithAmplifyServerContext({
    nextServerContext: { cookies},
    operation: async () => {
      return client.models.InputForm00.list();
    },
  });
}*/

export async function getInternalInputForms() {
  const client = generateServerClientUsingCookies<Schema>({
    config: outputs,
    cookies,
  });

  return client.models.InputForm00.list();
}

/*
-----------------InputForm00 Model Error chatgpt LE----------------
| Function                           | Needs `runWithAmplifyServerContext`? | Used with                                        |
| ---------------------------------- | ------------------------------------ | ------------------------------------------------ |
| `generateServerClientUsingCookies` | ❌ No                                 | App Router (e.g. route handlers, server actions) |
| `generateServerClientUsingReqRes`  | ✅ Yes                                | Pages Router, API routes with `req/res`          |

*/