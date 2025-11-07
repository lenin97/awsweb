// app/lib/getInternalInputForms.ts
import { cookies } from 'next/headers';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/data';
//import { backend } from '@/amplify/backend';
import outputs from '@/amplify_outputs.json';
//import { runWithAmplifyServerContext } from '@/lib/amplifyServer';
import { type Schema } from '@/amplify/data/resource';
//import { cookies } from 'next/headers';
import { getCurrentUser,fetchAuthSession  } from 'aws-amplify/auth/server';
import { runWithAmplifyServerContext } from '@/lib/amplifyServer';
//import type { CognitoAuthSignInDetails } from 'aws-amplify';


export interface CurrentUserSS {
  username: string | null;
  userId: string | null;
  signInDetails: unknown | null; // or use your custom interface
}

export async function getCurrentUserSS(): Promise<CurrentUserSS> {
  try {
    const { username, userId, signInDetails } = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: ctx => getCurrentUser(ctx),
    });
    return { username, userId, signInDetails: signInDetails ?? null };
  } catch (err: unknown) {
    // Any error—assume unauthenticated
    return { username: null, userId: null, signInDetails: null };
  }
}

/*
const { result } = await runWithAmplifyServerContext({
    nextServerContext: { cookies }, // App Router
    operation: (ctx) => getUrl(ctx,{ path: 'mediaApp/public/georgie-unsplash.jpg' }),
    },
  })
*/

export interface EmailUsrAuthSess {
  email: string | null;
}
export async function getUserSessionEmail(): Promise<EmailUsrAuthSess> {
  try {
    const session = await runWithAmplifyServerContext({
      nextServerContext: { cookies },
      operation: ctx => fetchAuthSession(ctx),
    });

    const email = session.tokens?.idToken?.payload?.email;

    return { email: typeof email === 'string' ? email : null };
    
  } catch (err: unknown) {
    // Any error—assume unauthenticated
    return {email: null};
  }
}
/*
const isAuthenticated = await runWithAmplifyServerContext({
    nextServerContext: { request, response },
    operation: async (contextSpec) => {
      try {
        const session = await fetchAuthSession(contextSpec)
        return (
          session.tokens?.accessToken !== undefined &&
          session.tokens?.idToken !== undefined
        )
      } catch {
        return false
      }
    },
  })
*/

/*
const currentUser = await runWithAmplifyServerContext({
        nextServerContext: { cookies },
        operation: (contextSpec) => getCurrentUser(contextSpec)
    });
*/

export async function getAuthServerCmpns() {//#####################used many times
  const client = generateServerClientUsingCookies<Schema>({
    config: outputs,
    cookies,
  });

  return client;

}