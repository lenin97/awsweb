// utils/getUserDashboardStatus.ts
// utils/getUserDashboardStatus.ts

'use server';

import { cookies } from 'next/headers';
import { fetchAuthSession } from 'aws-amplify/auth/server';
import { createServerRunner  } from '@aws-amplify/adapter-nextjs';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/data';
//import { backend } from '@/amplify/backend';
import outputs from '@/amplify_outputs.json';
import { type Schema } from '@/amplify/data/resource';

type UserDashboardResult =
  | { type: 'unauthenticated' }
  | { type: 'pendingSetup' }
  | { type: 'error'; error: unknown }
  | { type: 'ok'; userData: Schema['CVreg']['type'] };

const { runWithAmplifyServerContext } = createServerRunner({ config: outputs });

export async function getUserStatus(): Promise<UserDashboardResult> {
  return await runWithAmplifyServerContext({
    nextServerContext: {
      cookies: async () => cookies(), // ✅ fixed
    },
    operation: async (contextSpec) => {
      const { userSub } = await fetchAuthSession(contextSpec);

      if (!userSub) {
        return { type: 'unauthenticated' as const };
      }

      const client = generateServerClientUsingCookies<Schema>({
        config: outputs,//outputs,
        cookies: async () => cookies(), // ✅ fixed
      });

      const { data, errors } = await client.models.CVreg.list({
        filter: { id: { eq: userSub } },
      });

      if (errors?.length) {
        return { type: 'error' as const, error: errors[0] };
      }

      const userData = data?.[0];
      if (!userData /*|| !userData.profileComplete*/) {
        return { type: 'pendingSetup' as const };
      }

      return { type: 'ok' as const, userData };
    },
  });
}
