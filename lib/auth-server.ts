// lib/auth-server.ts
import {  fetchAuthSession } from 'aws-amplify/auth/server';
import { cookies } from 'next/headers';
//import { backend } from '@/amplify/backend';
import outputs from '@/amplify_outputs.json';
import { createServerRunner } from '@aws-amplify/adapter-nextjs';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/data';

const { runWithAmplifyServerContext } = createServerRunner({ config: outputs });

// Get the current authenticated user (throws if not signed in)
export async function getCurrentUser() {
  return await getCurrentUser();
}

/**
 * Returns detailed session info using Amplify server context
 */
export async function getServerAuthSession() {
  return await runWithAmplifyServerContext({
    nextServerContext: {
      cookies: async () => cookies(),
    },
    operation: async (contextSpec) => {
      return await fetchAuthSession(contextSpec);
    },
  });
}

/**
 * Returns user sub (user ID) if signed in, or null
 */
export async function getUserSub() {
  const session = await getServerAuthSession();
  return session.userSub ?? null;
}

///////////////////////////////////////////////////////////////Fetch public data Amplify chagpt-A///////////////////////////////////////////////
const getServerClient = () =>
  generateServerClientUsingCookies({
    config: outputs,
    cookies,
  });

/**
 * Internal (app-owned) data context — IAM private access, no user identity.
 */
export async function withInternalAmplifyContext<T>(
  callback: (
    client: ReturnType<typeof getServerClient>
  ) => Promise<T>
): Promise<T> {
  const client = getServerClient();

  return runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async () => {
      return callback(client);
    },
  });
}

/**
 * User-specific (authenticated) data context — Cognito identity required.
 */
type AmplifyUserContext = {
  user: { userId: string } | null;
  auth: {
    getCurrentUser: () => Promise<{ userId: string } | null>;
  };
};

export async function withUserAmplifyContext<T>(
  callback: (
    client: ReturnType<typeof getServerClient>,
    context: AmplifyUserContext
  ) => Promise<T>
): Promise<T> {
  const client = getServerClient();

  return runWithAmplifyServerContext({
    nextServerContext: { cookies },
    operation: async () => {
      const user = await getCurrentUser();
      return callback(client, {
        user,
        auth: { getCurrentUser },
      });
    },
  });
}
////////////////////////////////////////////////////////////////////////////////////////////
// lib/amplify/withInternalAmplifyContext.ts



/**
 * Access private app-owned data not tied to any user.
 */


////////////////AWS Amplify Auth Error chatgpt-M 22/5/25///now give me examples how to call it or use it withAmplifyServerContext
/*
const profile = await withAmplifyServerContext(async (client, context) => {
  if (!context.user) throw new Error('Unauthenticated');
  return client.models.Profile.get({ id: context.user.userId });
});

// app/dashboard/page.tsx
import { withAmplifyServerContext } from '@/lib/withAmplifyServerContext';

export default async function DashboardPage() {
  const profile = await withAmplifyServerContext(async (client, context) => {
    if (!context.user) {
      throw new Error('Not authenticated');
    }

    return client.models.Profile.get({ id: context.user.userId });
  });

  return <div>Hello, {profile.fields?.displayName}</div>;
}

*/
///////////////////////////////////////////////////////////
/*
type ClientType = Awaited<ReturnType<typeof generateServerClientUsingCookies>>;

export async function withAmplifyData<T>(
  operation: (client: ClientType) => Promise<T>
): Promise<T> {
  return runWithAmplifyServerContext({
    nextServerContext: {
      cookies: async () => cookies(),
    },
    operation: async () => {
      const client = generateServerClientUsingCookies({
        config: backend,
        cookies: async () => cookies(),
      });

      return operation(client);
    },
  });
}*/


export async function getUserAndProfile() {
  const user = await getCurrentUser();
  if (!user) return { user: null, profile: null };
/*
  const profile = await withAmplifyData(async (client) => {
    const { data } = await client.models.Profile.get({ id: user.userId });
    return data;
  });
*/
  return { user/*, profile*/ };
}

/*
// app/dashboard/page.tsx
import { withAmplifyData } from "@/lib/amplify-data-client";

export default async function DashboardPage() {
  const data = await withAmplifyData(async (client) => {
    const { data, errors } = await client.models.Profile.list();

    if (errors?.length) throw new Error(errors[0].message);
    return data;
  });

  return (
    <div>
      {data.map((profile) => (
        <div key={profile.id}>{profile.name}</div>
      ))}
    </div>
  );
}
*/