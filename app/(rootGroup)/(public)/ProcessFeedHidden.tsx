// app/posts/[slug]/PostsList.tsx
//import { showFeed } from '@/lib/showFeed';
//import {validateCBE} from "@/lib/validateCBE"
import {checkCBEcachePosts} from "@/lib/mdxSAs/checkCBEcachePosts"
//import type { MDXRemoteSerializeResult } from 'next-mdx-remote';

export default async function ProcessFeedHidden() {
  // Await the async cache loader
  await checkCBEcachePosts()

  return null
}
