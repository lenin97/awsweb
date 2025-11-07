import TailorCvUI from '@/app/(rootGroup)/(tools)/tailorCV/TailorCvUI'
import { CardContent } from '@/components/ui/card';
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { createPageMetadata } from '@/lib/seo/createPageMetadata'
import { TCV_STEP_COOKIE } from '@/lib/constants/stepConstants'
import {crawlmetadata} from "@/lib/mdxSAs/crawlmetadata"
import TailorCvFrameUI from './frame/TailorCvFrameUI'
import { NebulaBackground } from '@/components/client/NebulaSection'
//import AuthRefreWrapper from '@/lib/AuthChangeRefresher';
/*
export const stepMap: Record<string, string> = {
  '/tailorCV/home': 'hm',
  '/tailorCV/submitInfo': 'sbm',
  '/tailorCV/downloadTrack': 'dwntrk',
  '/tailorCV/downloadCompleted': 'dwncmp',
}
*/
// This page always dynamically renders per request
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies()
  const currentStep = cookieStore.get(TCV_STEP_COOKIE)?.value || '' // e.g., 'uploading'

  switch (currentStep) {
    case 'hm':
      console.log('[TCV_STEP_COOKIE]::step01::',currentStep)
      return await crawlmetadata("tailorCV")

    case 'sbm':
      console.log('[TCV_STEP_COOKIE]::step02::',currentStep)
      return createPageMetadata({
          title: 'Submitting – ResumeGenAI',
          description: 'Your personal AI resume assistant',
          url: process.env.TCV_SUBDOMAIN_TOOL_CV_SUBMIT!,
      })

    case 'prsid':
      console.log('[TCV_STEP_COOKIE]::step03::',currentStep)
      return createPageMetadata({
          title: 'Processing – ResumeGenAI',
          description: 'Your personal AI resume assistant',
          url: process.env.TCV_BASE_DOMAIN!,
      })

    case 'dwntrk':
      console.log('[TCV_STEP_COOKIE]::step04::',currentStep)
      return createPageMetadata({
        title: 'Download Ready – ResumeGenAI',
        description: 'Your resume has been submitted.',
        url: process.env.TCV_BASE_DOMAIN!,
      })

    case 'dwncmp':
      console.log('[TCV_STEP_COOKIE]::step05::',currentStep)
      return createPageMetadata({
        title: 'Success – Task Completed | YourAppName',
        description: 'Confirmation of successful task completion',
        url: process.env.TCV_SUBDOMAIN_TOOL_CV_DWNCMP!,//alternates: { canonical: 'https://resumegenai.com/tailorCV/congrats' }
      })

    default:
      console.log('[TCV_STEP_COOKIE]::step06::',currentStep)
      return await crawlmetadata("tailorCV")
  }
}


export default function TailorCvlayout({
  children
}: {
  children: React.ReactNode
}) {
  console.log("🔥 UPDATED TailorCvlayout IS BEING USED***************new one vTailorCvlayouter🔥");
  return (
    <>    
    <TailorCvUI>
        <TailorCvFrameUI/>
        <CardContent className="p-0">{children}</CardContent>
    </TailorCvUI>
    </>
  )
}

