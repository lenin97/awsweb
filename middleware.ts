// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { runWithAmplifyServerContext } from './lib/amplifyServer'
import { fetchAuthSession } from 'aws-amplify/auth/server'
import { getSafeRedirectPath } from './lib/safeRedirect'
import { getStepFromPath } from '@/lib/utils/stepMatcher'
import { TCV_STEP_COOKIE } from '@/lib/constants/stepConstants'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  console.log('[middleware] pathname:', pathname)
  const tcv_step_value=getStepFromPath(pathname)

  if(tcv_step_value){
    console.log('[middleware] tcv_step_value:')
    response.cookies.set(TCV_STEP_COOKIE, tcv_step_value, {
      path: '/',
      maxAge: 120,
      httpOnly: true,
      sameSite: 'lax',
      secure: true
    })
  }
  else{
    response.cookies.delete(TCV_STEP_COOKIE)
  }

  return response

  /*
  // Define protected routes
  const protectedPaths = [
    '/dashboard',
    '/tools',
    '/tailorCV/(internal)/',
    '/tailorCV/submitInfo',
  ]
  const isProtected = protectedPaths.some((path) => pathname.startsWith(path))
  if (!isProtected) return response

  // Run with Amplify context to check session
  const isAuthenticated = await runWithAmplifyServerContext({
    nextServerContext: { request, response },
    operation: async (contextSpec) => {
      try {
        const session = await fetchAuthSession(contextSpec)
        return (
          session.tokens?.accessToken !== undefined &&
          session.tokens?.idToken !== undefined
        )
      } catch {
        return false
      }
    },
  })

  if (true) {
    return response
  }

  // Unauthenticated: store safe redirect cookie and redirect to sign-in
  const redirectTo = getSafeRedirectPath(pathname)
  const signInUrl = new URL('/SigIn2Cont', request.url)
  //signInUrl.searchParams.set('redirectTo', redirectTo)

  const res = NextResponse.redirect(signInUrl)
  res.cookies.set('redirectTo', redirectTo, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 300, // 5 minutes
  })

  return res
  */
}

// Only apply middleware to these routes
export const config = {
  matcher: [
    '/tailorCV/:path*',
  ],
}