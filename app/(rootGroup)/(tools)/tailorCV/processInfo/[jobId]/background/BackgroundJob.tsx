import { getAuthServerCmpns } from '@/lib/serverAuth4Cmpns';

export const dynamic = 'force-dynamic'


export default async function BackgroundJob({
  jobId,
}: {
  jobId: string;
}) {
  
  //const { jobId } = await params

  console.log('[BackgroundJob] Received jobId:', jobId)

  if (!jobId) {
    console.error('Missing jobId in searchParams')
    return null
  }

  const client = await getAuthServerCmpns();

  const result = await client.queries
    .tailoredCVflow({ cvid: {idcv:jobId} })
    .catch((error) => {
      console.error('Error in tailoredCVflow:', error);
      return null;
    });

  const signedUrl = result?.data?.signedUrl ?? null;

  // You can log, render, or pass this URL somewhere else
  console.log('Signed URL:', signedUrl);

  return null; // Or return JSX if you want to display or pass it
}
