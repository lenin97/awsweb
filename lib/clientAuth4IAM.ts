// src/utils/amplify-client.ts
'use client';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';

let client: ReturnType<typeof generateClient<Schema>> | null = null;

/**
 * Lazily initializes the Amplify client only when needed,
 * ensuring `Amplify.configure()` has already run.
 */

export function getClient() {
  if (!client) {
    client = generateClient<Schema>({
      authMode: 'identityPool',
    });
  }
  return client;
}


/*
| Phase                                  | What Happens                                                      |
| -------------------------------------- | ----------------------------------------------------------------- |
| ✅ **1. Server Render**                 | Next.js server renders the layout HTML, no JavaScript runs yet.   |
| ✅ **2. HTML is sent to browser**       | The browser shows the static HTML (pre-hydration)                 |
| ✅ **3. Hydration begins**              | React starts running your `'use client'` components from top down |
| ✅ **4. `AuthRefreshListener` mounts**  | This triggers `Amplify.configure(...)` immediately                |
| ✅ **5. Other client components mount** | If they use Amplify, it's now safe (because configure ran first)  |

*/
