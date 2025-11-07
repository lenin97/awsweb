// app/api/get-signed-url/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { generateServerClientUsingCookies } from '@aws-amplify/adapter-nextjs/api';
//import { backend } from '@/amplify/backend'; // your Amplify config
import type { Schema } from '@/amplify/data/resource'; // your Amplify model schema
import outputs from '@/amplify_outputs.json';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { fileName, fileType, jobDesc, jobTitle } = body;
  if (!fileName || !fileType) {
    return NextResponse.json({ error: "Missing fileName or fileType" }, { status: 400 });
  }

  if (!jobDesc || !jobTitle) {
    return NextResponse.json({ error: "Missing jobDesc or jobTitle in metadata" }, { status: 400 });
  }

  let client;
  try {
    client = generateServerClientUsingCookies<Schema>({ config: outputs, cookies });
  } catch (err) {
    console.error("Amplify client init error:", err);
    return NextResponse.json({ error: "Server auth setup failed" }, { status: 500 });
  }

  let result;
  try {
    console.log('[api/get-signed-url]::calling uploadCVflow backend');
    result = await client.mutations.uploadCVflow({
        uplCVfieldsarg: { fileName, jobDesc, jobTitle },
      },  
      {
        authMode: 'identityPool',
      });
    } catch (err) {
    if (err instanceof Error) {
      console.error('GraphQL mutation failed:', err.message);
      return NextResponse.json({ error: 'Mutation execution error', details: err.message }, { status: 500 });
    }
    console.error('Unexpected non-error thrown:', err);
    return NextResponse.json({ error: 'Unexpected failure' }, { status: 500 });
  }

  const { data, errors } = result;
  if (errors?.length) {
    console.error("GraphQL errors:", errors);
    return NextResponse.json({ error: "Mutation returned errors", details: errors }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "No data returned from mutation" }, { status: 500 });
  }

  // ✅ Success: extract the two fields
  const { id_un, int_path } = data;
  // ✅ Success path: `data` is the returned string (S3 key)
  console.log('[api/get-signed-url]::Mutation success, key:', data);

  return NextResponse.json({ id_un, int_path }, { status: 200 });
}
