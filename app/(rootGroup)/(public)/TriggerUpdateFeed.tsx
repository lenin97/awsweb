"use client";

import { useEffect } from "react";
//import { generateClient } from "aws-amplify/data";
import { useRouter } from "next/navigation";
import { getClient } from '@/lib/clientAuth4IAM'
import { updatePostAndRevalidate } from '@/lib/actions/updatePost';
//import client from '@/lib/clientAuth4Cmpns'

export function TriggerUpdateFeed() {
  const router = useRouter();
  //const client = getClient();

  useEffect(() => {
    //const client = generateClient();
    const client = getClient();
    console.log('[MDXupdates] mounted ❓🔍❓🔍❓🔍❓🔍❓🔍❓🔍❓🔍❓🔍❓🔍')
    const subscription = client.models.MDXupdates
        .onUpdate({ filter: { id: { eq: '0' } } })
        .subscribe({
          next: async (updated) => {
            console.log('[MDXupdates] UPDATE received🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍🔍:', updated.messagemdx)
            /*
            marks that path as stale so that on the very next request,
            Next.js will regenerate the file instead of serving the cached copy
            */
            updatePostAndRevalidate()
            await fetch('/api/revposts', { 
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            router.refresh();
          },
          error: (err) => {console.error('[ProgressTracker] onUpdate error:', err)
            if (err.errors) {
                for (const e of err.errors) {
                  console.error('🔍 Error message:', e.message);
                  console.error('🔍 Error type:', e.errorType);
                  console.error('🔍 Error path:', e.path);
                  console.error('🔍 Error locations:', e.locations);
                }
              } else if (err instanceof Error) {
                console.error('🔍 Error name:', err.name);
                console.error('🔍 Error message:', err.message);
                console.error('🔍 Error stack:', err.stack);
              } else {
                console.error('❓ Unknown error format:', JSON.stringify(err, null, 2));
              }
          }
        });

    return () => {
      console.log('[[MDXupdates]] Cleaning up subscriptions✅✅✅✅✅✅✅')
      subscription.unsubscribe();
    }
  }, [router]);

  return null;
}

/*
 updateSub = client.models.JobProgress
        .onUpdate({ filter: { id: { eq: recordId } } })
        .subscribe({
          next: async (updated) => {
            console.log('[ProgressTracker] UPDATE received:', updated)
            setStep(updated.step)
            setStatus(updated.status)
            if (updated.status === 'done' && updated.signedUrl) {
              //const params = new URLSearchParams({ signedUrl: updated.signedUrl })
              //sessionStorage.setItem('SIGNED_URL_KEY', updated.signedUrl)
              //sessionStorage.setItem('SIGNED_URL_KEY', updated.signedUrl)
              //sessionStorage.setItem('SIGNED_FILE_NAME', updated.signedUrl.split('/').pop()?.split('?')[0] ?? 'downloaded-file.pdf')
              const res = await fetch('/api/set-download-meta', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include', // 👈 This is the key part
                body: JSON.stringify({
                  signedUrl: updated.signedUrl,
                  fileName: updated.signedUrl.split('/').pop()?.split('?')[0] ?? 'downloaded-file.pdf',
                }),
              })
              if (!res.ok) {
                console.error('Failed to set cookies')
              }
              router.replace(`/tailorCV/downloadTrack`)
            }
          },
          error: (err) => console.error('[ProgressTracker] onUpdate error:', err),
        })
*/