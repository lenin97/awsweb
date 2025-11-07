'use client';

import type { Schema } from '@/amplify/data/resource';
import { generateClient } from 'aws-amplify/data';

let client: ReturnType<typeof generateClient<Schema>> | null = null;

/**
 * Lazily initializes the Amplify client only when needed,
 * ensuring `Amplify.configure()` has already run.
 */
export function getClient() {
  if (!client) {
    client = generateClient<Schema>({
      authMode: 'identityPool', // or 'userPool', adjust as needed
    });
  }
  return client;
}
