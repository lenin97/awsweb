// app/api/revalidate/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();

  if (body.secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Optional: Add secret validation if needed
  const { type } = body;

  console.log(`[Revalidation] Triggered for: ${type}`);

  // Optionally handle specific types
  if (type === 'sitemap') {
    // Could invalidate an in-memory cache if used
    return NextResponse.json({ revalidated: true, target: 'sitemap' });
  }

  if (type === 'metadata') {
    return NextResponse.json({ revalidated: true, target: 'metadata' });
  }

  return NextResponse.json({ revalidated: false, error: 'Unknown type' });
}
/*
await fetch('https://yourdomain.com/api/revalidate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'sitemap' }),
});
await fetch('https://yourdomain.com/api/revalidate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'sitemap',
    secret: process.env.REVALIDATE_SECRET,
  }),
});

*/