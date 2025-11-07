//import UserAuthMenuWrapper from '@/app/(rootGroup)/@UserAuthMenu/UserAuthMenuWrapper'
//import { getCurrentUserSS } from '@/lib/serverAuth4Cmpns';
import UserAuthMenu from '@/app/(rootGroup)/@UserAuthMenu/UserAuthMenu';
//import AuthRefreWrapper from '@/lib/AuthRefreWrapper';

// This page always dynamically renders per request
//export const dynamic = 'force-dynamic';


export default async function authPage() {

    // Await here
    /*
  const resolved = searchParams ? await searchParams : {};
  const ts = resolved.ts;
  const userdata = await getCurrentUserSS();
  */

  console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥 userAuthmenu slot');

    return (
        <header className="flex justify-end p-4 border-b bg-background">
                <UserAuthMenu/>
        </header>
        
    )
}
