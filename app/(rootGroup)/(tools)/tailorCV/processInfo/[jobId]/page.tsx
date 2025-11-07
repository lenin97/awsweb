import BackgroundJob from "./background/BackgroundJob"
import ProgressTracker from "./progress/ProgressTracker"
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

// Define types so params is a Promise
interface Props {
  params: Promise<{ jobId: string }>;
}

export default async function processInfoPage(props: Props) {
  
  const { jobId } = await props.params;

  console.log("[processInfoLayout] Received params:", jobId)

  return (
    <>
      {/* Start job silently Hidden fire-and-forget job start*/} 
      {/*<BackgroundJob jobId={ jobId } />*/}
      
      {/* Visible live progress Visible progress tracker UI */}
      <ProgressTracker jobId={ jobId }/>

      {/*children*/}
    </>
  )
}