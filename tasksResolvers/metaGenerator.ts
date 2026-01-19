// amplify/functions/metaGenerator/handler.ts
import type { Schema } from '../data/resource';
import { generateClient } from 'aws-amplify/data';
import { Amplify } from 'aws-amplify';
import { env } from "$amplify/env/metaGenerator";
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import {Metacustom,ArticleMeta,fallback,getImageUrl,Post} from './Utilsseometa'
import {createPageMetadata} from './createPageMetadata'
import {scriptlayout,scriptHome,scriptTailorCV,slugScript} from './createPageScript'
import {
  TCV_OPENGRAPH_IMG,
  TCV_BASE_DOMAIN,  
  TCV_APP_NAME_HEADER
} from './envvar'

// -----------------------------
// Amplify Data client init (same pattern you already use)
// -----------------------------
const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);
const client = generateClient<Schema>();

// -----------------------------
// Handler: parses single-string input -> Metacustom -> create metadata -> persist to "seometa" table
// -----------------------------
export const handler: Schema['metaGenerator']['functionHandler'] = async (event, context) => {
  console.log("[metaGenerator]::TCV_BASE_DOMAIN::",TCV_BASE_DOMAIN,"::TCV_APP_NAME_HEADER::",TCV_APP_NAME_HEADER)
  console.log('[metaGenerator] event:', JSON.stringify(event?.arguments ?? {}));

  try {
    const args = event?.arguments?.metaJSON;
    const rawInput = args?.metainfo
    const idname = args?.idname
    const metastamp = args?.metastamp
    const openGraphType = args?.openGraphType
    const slug = args?.slug?? ''
    const rawArticle= args?.articlemeta?? ''
    if (!rawInput || typeof rawInput !== 'string' || !idname || !openGraphType) {
      console.error('[metaGenerator] Missing input string or required args', { idname, metastamp, openGraphType });
      return { message: 'Missing input string', savedId: idname };
    }

    let metaInput: Metacustom;  
    let metadata2store  

    if(openGraphType==='website'){

        try {
            metaInput = typeof rawInput === 'string' ? (JSON.parse(rawInput) as Metacustom) : (rawInput as Metacustom)
        } catch (err) {
            console.error('[metaGenerator] Input JSON parse error for website payload', { err: (err as Error).message ?? err, sample: String(rawInput).slice(0,300) });
            return { message: 'Invalid JSON input', savedId: idname };
        }

        console.log('[metaGenerator]:: crawlmetadata loaded ::', metaInput);

        metadata2store = createPageMetadata({
            title: `${metaInput.title} | ${TCV_APP_NAME_HEADER}`,
            description: metaInput.excerpt,

            openGraphTitle: fallback(metaInput.openGraphTitle, metaInput.title),
            openGraphDescription: fallback(metaInput.openGraphDescription, metaInput.excerpt),

            twitterTitle: fallback(metaInput.twitterTitle, metaInput.title),
            twitterDescription: fallback(metaInput.twitterDescription, metaInput.excerpt),

            url: process.env[metaInput.canonicalRealtiveURL!] || TCV_BASE_DOMAIN!,
            
            image: {
                url: getImageUrl(metaInput.ogImage) || new URL(TCV_OPENGRAPH_IMG!,TCV_BASE_DOMAIN).toString(),
                //alt: meta.title,
            },            
        })
/*
        console.log(
                '[metaGenerator] metadata2store =',
                JSON.stringify(
                    metadata2store,
                    (_key, value) =>
                    value instanceof URL
                        ? value.toString()
                        : value instanceof Date
                        ? value.toISOString()
                        : value,
                    2 // pretty print with 2 spaces
                )
            );
*/
        const metadataSanitized = JSON.stringify(metadata2store, (_key, value) =>
            value instanceof URL ? value.toString() :
            value instanceof Date ? value.toISOString() :
            value
        );

        console.log(
                '[metaGenerator] metadata2store =',
                metadataSanitized
            );
        // persist metadata: protect DB calls with try/catch and log errors with context
        try {
          const seo_update = await client.models.SeoMeta.update({
                id: idname!,
                metadata: metadataSanitized,
                cacheMeta: metastamp
            },
            { 
                authMode: 'identityPool' 
            }
          );
          console.log('[metaGenerator] Updated SeoMeta id=', idname, { seo_update: !!seo_update?.data });

          // original logic preserved (if update returned data, call create)
          try {
            if(!seo_update.data){
              const meta_Store=await client.models.SeoMeta.create({
                      id: idname!,
                      metadata: metadataSanitized,
                      cacheMeta: metastamp
                  },
                  { 
                      authMode: 'identityPool' 
                  }
              );
              console.log('[metaGenerator] Created SeoMeta id=', idname, '::meta_Store::',meta_Store);
            }
          } catch (createErr) {
            console.error('[metaGenerator] SeoMeta.create failed', { idname, message: (createErr as Error).message ?? createErr });
          }

        } catch (updateErr) {
          console.error('[metaGenerator] SeoMeta.update failed', { idname, message: (updateErr as Error).message ?? updateErr });
        }

        // script-related updates: each DB call wrapped to isolate errors (keeps original switch logic)
        try {
          switch(idname){
              case 'root':
                  try {
                    const script_root= scriptlayout() // combine array into one string

                    await client.models.SeoMeta.update({
                            id: idname!,
                            script: script_root,
                            //cacheMeta: metastamp
                        },
                        { 
                            authMode: 'identityPool' 
                        }
                    );
                    console.log('[metaGenerator] script update(root) success', { idname });
                  } catch (err) {
                    console.error('[metaGenerator] script update(root) failed', { idname, message: (err as Error).message ?? err });
                  }
                  break
                  // fall-through intentional in original code
              case 'home':
                  try {
                    const getRes = await client.models.MDXupdates.get({ id: '0' }, { authMode: 'identityPool' })
                    if (getRes.data) {
                      const script_home= scriptHome(metaInput,getRes.data.messagemdx,getRes.data.messagetitle!)
                      const result =await client.models.SeoMeta.update({
                            id: idname!,
                            script: script_home,
                            //cacheMeta: metastamp
                        },
                        { 
                            authMode: 'identityPool' 
                        }
                      );
                      console.log('[metaGenerator] script update(home) success', { idname ,result });
                    } else {
                      console.log('[metaGenerator] MDXupdates.get returned no data for id=0');
                    }
                  } catch (err) {
                    console.error('[metaGenerator] script update(home) failed', { idname, message: (err as Error).message ?? err });
                  }
                  break
                  // fall-through intentional in original code
              case 'tailorCV':
                  try {
                    const script_tailorcv = scriptTailorCV(metaInput)
                    await client.models.SeoMeta.update({
                                id: idname!,
                                script: script_tailorcv,
                                //cacheMeta: metastamp
                            },
                            { 
                                authMode: 'identityPool' 
                            }
                    );
                    console.log('[metaGenerator] script update(tailorCV) success', { idname });
                  } catch (err) {
                    console.error('[metaGenerator] script update(tailorCV) failed', { idname, message: (err as Error).message ?? err });
                  }
                  break
              default:
                  break
          }
        } catch (switchErr) {
          // catch any unexpected error thrown inside the switch (already have per-case catches)
          console.error('[metaGenerator] Unexpected error in script switch', { idname, message: (switchErr as Error).message ?? switchErr });
        }

    }

    if(openGraphType==='article'){

        let post: Post
        let articleMeta: ArticleMeta

        try {

            const rawPayload = rawInput;

            if (!rawPayload || !rawArticle || !slug) {
                console.log(`[metaGenerator] Cache miss (missing payload/articlemeta) for slug "${slug}".`);
            }

            post =
            typeof rawPayload === 'string'
                ? JSON.parse(rawPayload)
                : (rawPayload as Post);

            articleMeta =
            typeof rawArticle === 'string'
                ? JSON.parse(rawArticle)
                : (rawArticle as ArticleMeta);

            console.log(`[metaGenerator] Cache hit for slug "${slug}".`);
            const slug_uri = encodeURIComponent(slug);
            const url = `/posts/${slug_uri}`;

            metadata2store = createPageMetadata({
                title: post.title,
                description: post.description,
                url,
                image: { url: getImageUrl(post.image)?? TCV_OPENGRAPH_IMG!, alt: post.title },
                openGraphTitle: post.title,
                openGraphDescription: post.description,
                openGraphType,
                articleMeta, // pass the full ArticleMeta object
                twitterTitle: post.title,
                twitterDescription: post.description,
            });

            const metadataSanitized = JSON.stringify(metadata2store, (_key, value) =>
                value instanceof URL ? value.toString() :
                value instanceof Date ? value.toISOString() :
                value
            );

            console.log(
                    '[metaGenerator] metadata2store =',
                    metadataSanitized
                );
        
            console.log('[metaGenerator] Updated SeoMeta id=', idname);

            const script_slug = await slugScript(post,articleMeta,slug)

            try {
              const result = await client.models.PostsData.update({
                  id: idname!,
                  metadata: metadataSanitized,
                  script:script_slug
              },
              { 
                  authMode: 'identityPool' 
              });
              console.log('[metaGenerator] PostsData.update success', { idname, slug, result });
            } catch (postUpdateErr) {
              console.error('[metaGenerator] PostsData.update failed', { idname, slug, message: (postUpdateErr as Error).message ?? postUpdateErr });
            }

        } catch (error) {
            console.error(`[getCachedPostSlug] Error checking cache for slug "${slug}":`, { message: (error as Error).message ?? error});
        }       


    }    

    return { message: 'Metadata saved', idname };
  } catch (error) {
    console.error('[metaGenerator] Error:', { message: (error as Error).message ?? error });
    return { message: 'Internal error while generating metadata', idname: null };
  }
};
