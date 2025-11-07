import type { Metadata } from 'next';

type DownloadCompletedPageProps = {
  searchParams: {
    signedUrl?: string;
  };
  backLogAct: React.ReactNode;
  msgDyn: React.ReactNode
};
/*
export const metadata: Metadata = {
  title: 'Success – Task Completed | YourAppName',
  description: 'Confirmation of successful task completion',
  alternates: { canonical: 'https://resumegenai.com/tailorCV/congrats' }
}
*/

export default function DownloadCompletedLayout({
  backLogAct,
  msgDyn
}: DownloadCompletedPageProps) {
  return (
    <div>
      {/* Hidden background logger */}
      <div className="hidden">
        {/*{backLogAct}*/}
      </div>

      {/* Message display */}
      <div>
        {msgDyn}
      </div>
    </div>
  );
}
