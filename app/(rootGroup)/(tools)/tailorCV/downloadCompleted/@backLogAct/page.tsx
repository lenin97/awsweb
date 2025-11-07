import LogDownloadActivityS3 from '@/lib/usrActy/logDownloadActivityS3';
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

/*
type Props = {
  searchParams: {signedUrl?: string};
};*/

export default async function BackLogAct() {

  const cookieStore = await cookies()
  //const signedUrl =  cookieStore.get('SIGNED_URL_KEY')?.value ?? ''
  const fileName =  cookieStore.get('FILE_NAME_KEY')?.value ?? ''

  if (fileName) {
    await LogDownloadActivityS3({ fileKey: fileName });
  }

  return null;
}
