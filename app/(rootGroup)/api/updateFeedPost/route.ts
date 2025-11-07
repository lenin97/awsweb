// app/api/set-download-meta/route.ts
import { NextResponse } from 'next/server'
import { cookies } from "next/headers";

export async function POST(req: Request) {

  const { msg } = await req.json()
  const cookieStore = await cookies()

  const buildCookie = cookieStore.get('BUILD_FEED_NOW')?.value ?? 'cc'
  const showCookie = cookieStore.get('SHOW_FEED_NOW')?.value ?? 'cc'

  let buildVal = buildCookie
  let showVal = showCookie

  if (msg === 'bd') {
    // If value is "cc", allow changing only if msg is 'bd'
    if (buildCookie === 'cc') {
      buildVal = '1'
    } else {
      buildVal = buildCookie === '1' ? '0' : '1'
    }
  }

  if (msg === 'sw') {
    // If value is "cc", allow changing only if msg is 'sw'
    if (showCookie === 'cc') {
      showVal = '1'
    } else {
      showVal = showCookie === '1' ? '0' : '1'
    }
  }

  const res = NextResponse.json({ ok: true })

  res.cookies.set('BUILD_FEED_NOW', buildVal, {
    path: '/',
    maxAge: 120,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  })

  res.cookies.set('SHOW_FEED_NOW', showVal, {
    path: '/',
    maxAge: 120,
    httpOnly: true,
    sameSite: 'lax',
    secure: true,
  })

  return res
}
