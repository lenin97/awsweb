import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('redirectTo');
  let destination = new URL('/dashboard', req.url); // ✅ default to absolute URL

  if (cookie?.value) {
    try {
      // Try to resolve cookie value to a safe absolute URL
      const requestedUrl = new URL(cookie.value, req.url);

      // ✅ Allow only same-origin internal redirects
      if (requestedUrl.origin === req.nextUrl.origin) {
        destination = requestedUrl;
      }
    } catch {
      // If cookie value was invalid, fallback remains /dashboard
    }
  }

  const res = NextResponse.redirect(destination);
  res.cookies.delete('redirectTo'); // Cleanup after redirect

  return res;
}
