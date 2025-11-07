
import DownloadPageClient from '@/app/(rootGroup)/(tools)/tailorCV/downloadTrack/[jobId]/DownloadPageClient';
//import StructuredDataJsonLD from './StructuredDataJsonLD'
//import { cookies } from 'next/headers'
import { getAuthServerCmpns } from '@/lib/serverAuth4Cmpns';
import type { Metadata } from 'next';
//import { headers } from 'next/headers';

export const dynamic = 'force-dynamic'
/*
export const metadata: Metadata = {
  title: 'Download Ready – ResumeGenAI',
};
*/
interface Props {
  params: Promise<{ jobId: string }>;
}

export default async function DownloadSuccessPage(props: Props) {

  const { jobId } = await props.params;

  const client = await getAuthServerCmpns();

  const result = await client.models.JobProgress.get({ id: jobId })
      .catch((error) => {
        console.error('Error in tailoredCVflow:', error);
        return null;
      });
  //const cookieStore = await cookies()
  const signedUrl =  result?.data?.signedUrl || 'NOSET'
  const fileName =  signedUrl !== 'NOSET'
                    ? (signedUrl?.split('/').pop() ?? '').split('?')[0] || 'NOSET'
                    : 'NOSET';

  // ✅ Server-side log — will appear in the terminal or hosting logs (not browser console)
  console.log('[DownloadSuccessPage] SIGNED_URL_KEY:', signedUrl );
  console.log('[DownloadSuccessPage] FILE_NAME_KEY:', fileName);

  return (
    <>
      {/* ✅ JSON-LD rendered server-side for SEO compliance */}

      {/* ✅ Interactive logic rendered client-side */}
      <DownloadPageClient signedUrl={signedUrl} fileName={fileName} />
    </>
  );
}