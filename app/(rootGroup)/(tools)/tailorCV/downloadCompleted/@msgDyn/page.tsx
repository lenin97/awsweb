import ClientCongrats from '@/app/(rootGroup)/(tools)/tailorCV/downloadCompleted/@msgDyn/ClientCongrats'
import { getUserSessionEmail } from '@/lib/serverAuth4Cmpns';
//import type { Metadata } from 'next';
//import CongratsHead from './CongratsHead'

export const dynamic = 'force-dynamic'
/*
export const metadata: Metadata = {
  title: `Success – Task Completed | YourAppName`,
};
*/
export default async function msgDyn() {
    
  const useremail = await getUserSessionEmail() ;

  // Guarantee `username` is always a string:
  const userinfo = useremail.email ?? 'Guest'


  return (
    <>
      {/* This <Head> gets hoisted into the HTML <head> */}
      
      {/* This is your interactive body, hydrated on the client */}
      <ClientCongrats username={userinfo} />
    </>
  )
}