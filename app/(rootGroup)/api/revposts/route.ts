import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAuthServerCmpns } from '@/lib/serverAuth4Cmpns';

export async function POST(request: NextRequest) {
  try {
    const client = await getAuthServerCmpns();

    const result = await client.models.MDXupdates.get(
      { id: '0' },
      {
        authMode: 'identityPool',
      }
    ).catch((error) => {
      console.error('[revalidate-all-posts] Error fetching data:', error);
      return null;
    });

    console.log('[revalidate-all-posts]:: result:', result);

    const slugsString = result?.data?.slug;
    if (!slugsString) {
      console.warn('[revalidate-all-posts] No slugs found in the result.');
      return NextResponse.json({ message: 'No slugs found' }, { status: 404 });
    }

    const slugs = slugsString.split('||').filter(Boolean);

    for (const slug of slugs) {
      revalidatePath(`/posts/${slug}`);
    }

    return NextResponse.json(
      { message: `Revalidated ${slugs.length} post path(s).`, paths: slugs },
      { status: 200 }
    );

  } catch (err) {
    console.error('[revalidate-all-posts] Unexpected error:', err);
    return NextResponse.json({ message: 'Error during revalidation' }, { status: 500 });
  }
}
