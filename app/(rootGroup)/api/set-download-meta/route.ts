// app/api/set-download-meta/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { signedUrl, fileName } = await req.json()

  const response = NextResponse.json({ ok: true })

  console.log('[set-download-meta]::start')
  // Set short-lived cookies (e.g. 2 minutes)
  response.cookies.set('SIGNED_URL_KEY', signedUrl, {
    path: '/',
    //maxAge: 120,
    httpOnly: true,
    sameSite: 'lax',
    secure: true
  })

  response.cookies.set('FILE_NAME_KEY', fileName, {
    path: '/',
    //maxAge: 120,
    httpOnly: true,
    sameSite: 'lax',
    secure: true
  })

  console.log('[set-download-meta]::end')

  return response
}
