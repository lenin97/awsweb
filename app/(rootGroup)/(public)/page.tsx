// File: app/(marketing)/page.tsx
import LandingPageClient from '@/app/(rootGroup)/(public)/LandingPageClient'
import Feedbody from './Feedbody'
import {TriggerUpdateFeed} from "./TriggerUpdateFeed"//
import {crawlmetadata} from "@/lib/mdxSAs/crawlmetadata"
import {ScriptHome} from './homescript'
import ResponsiveImageCard from '@/components/server/ResponsiveImageCard'

export const dynamic = 'force-dynamic';

const imageUrl='/images/georgie-unsplash.jpg'
const nameApp=process.env.TCV_APP_NAME_HEADER

export async function generateMetadata() {
  return await crawlmetadata("home")
}

export default async function LandingPage() { 
  
  const content= <ResponsiveImageCard 
                      src={imageUrl}
                      alt="AI Tailoring your Resume"
                      priority={true}
                      caption="Let AI help you craft the perfect CV"
                 />

  return (
    <>
      {/* Page-specific JSON-LD goes into <head> immediately */}
      <ScriptHome/>
      <TriggerUpdateFeed/>
      <LandingPageClient blogPosts={<Feedbody />} nameApp={nameApp!}>
        {content}       
      </LandingPageClient>
    </>
  )
}
