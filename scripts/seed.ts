// scripts/seed.ts
import { type Schema } from '@/amplify/data/resource';   // adds model typing
import { generateServerClientUsingReqRes } from '@aws-amplify/adapter-nextjs/data';
import outputs from '../amplify_outputs.json';
//import { backend } from '@/amplify/backend';
import formsData from '@/seedData/forms.json';
//import {checkCBEcachePosts} from "@/lib/mdxSAs/checkCBEcachePosts"
import { runWithAmplifyServerContext } from '@/lib/amplifyServer';//initiateMDXUpdatesTable
//import {initiateMDXUpdatesTable} from "@/lib/mdxSAs/initiateMDXUpdatesTable"

//import { v4 as uuidv4 } from 'uuid';

//export const { runWithAmplifyServerContext } = createServerRunner({ config: outputs });
const client = generateServerClientUsingReqRes<Schema>({ config: outputs });

async function seed() {
  console.log('🚀 Seeding default forms …');
  await runWithAmplifyServerContext({
    nextServerContext: null,                                    // ④ not running in HTTP
    operation: async (ctx) => {

      let createdCount = 0;

      for (const form of formsData) {
        // crude idempotency: skip if a form with same type exists
        // inside runWithAmplifyServerContext({... operation: async (ctx) => { ... } })
        const { data: existing } = await client.models.InputForm00.list(
          ctx,
          {
            filter: { type: { eq: form.type } }, // query filter
            authMode: 'apiKey',                     // auth for local sandbox
          }
        );

        if (existing.length > 0) {
          console.log(`⚠️ Skipped (already exists): ${form.placeholder ?? form.type}`);
          continue;
        }

        await client.models.InputForm00.create(ctx, {
          type: form.type,
          placeholder: form.placeholder,
          value: form.value,
          onChange: form.onChange,
          accept: form.accept,
          label: form.label,
          num: form.num,
          nickname: form.nickname
        },{
            authMode: 'apiKey', // ✅ This makes it work in local dev / sandbox
          });

        createdCount++;

        //console.log(`✅ Seeded form: ${form.placeholder ?? form.type}`);
        console.log(`✅ Seeded form: ${form.placeholder || form.type || '[Unnamed Form]'}`);

      }

      if (createdCount === 0) {
        console.log('ℹ️ No new records needed seeding.');
      }

      //const idcv = uuidv4();
      /*
      try {
        const result = await client.models.MDXupdates.create(ctx, {
          id: "0",
          slug: "",
          messagemdx: "n2d",
        }, {
          authMode: 'identityPool',
        });

        console.log('✅ Created:', result);
      } catch (err) {
        console.error('❌ Failed to create MDXupdates:', err);
      }
      */
      //initiateMDXUpdatesTable()
      
    },
  });
  console.log('✅ Seeding complete.');

 // await checkCBEcachePosts()
/*
  const {messagemdx,slugs} = await validateCBE()
  
  if(messagemdx=="cmidfe"){
      await cachePosts(slugs)
  }else{
    console.log("Nothing to cache by now")
  }
*/
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});

/*
// scripts/seed.ts
import { runWithAmplifyServerContext } from './utils/amplify-server-client-env';
import { generateServerClientUsingEnv } from './utils/amplify-server-client-env';
import formsData from './seedData/forms.json';

const client = generateServerClientUsingEnv();

async function seed() {
  console.log('🚀 Seeding default forms...');

  await runWithAmplifyServerContext({
    async callback(contextSpec) {
      for (const form of formsData) {
        await client.models.Form.create(contextSpec, {
          type: form.type,
          placeholder: form.placeholder,
          value: form.value,
          onChange: form.onChange,
          accept: form.accept,
          className: form.className,
        });
        console.log(`✅ Seeded form: ${form.placeholder || form.type}`);
      }
    },
  });

  console.log('✅ Seeding complete.');
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1); // Fail CI/CD if seed fails
});
*/
