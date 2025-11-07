'use server';

import { revalidatePath } from 'next/cache';
//import { client } from '@/lib/amplify'; // however you initialize Amplify

export async function updatePostAndRevalidate() {
  // 1. Update the post in Amplify
  //await client.mutations.Post.update({ id, title });

  // 2. Immediately revalidate the relevant path(s)
  revalidatePath('/sitemap.xml');
  revalidatePath('/robots.txt');

  // (Optional) revalidate blog post metadata route if it's dynamic
  //revalidatePath(`/blog/${id}`); // or use revalidateTag('blog-post') if tagged

  return { ok: true };
}
