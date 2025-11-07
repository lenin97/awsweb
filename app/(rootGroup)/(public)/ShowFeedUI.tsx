// app/posts/[slug]/PostsList.tsx
import { getCachePosts } from '@/lib/mdxSAs/getCachePosts'; // your React.cache data loader
import PostsListClient from './PostsListClient';
import { getImageUrl } from '@/lib/utils/getImageUrl';

import type { Post } from '@/lib/types/Post';

export default async function ShowFeedUI() {
  // Fetch cached posts (slug, title, date, description, image, links)
  const posts: Post[] = await getCachePosts();

  // Resolve each post.image to a real URL (using getImageUrl).
  // If getImageUrl returns null, we keep the original post.image value as a fallback.
  const postsWithResolvedImages: Post[] = posts.map((p) => {
    const resolved = getImageUrl(p.image);
    return {
      ...p,
      image: resolved ?? p.image,
    };
  });

  // Pass posts with resolved image URLs to the client component
  return <PostsListClient posts={postsWithResolvedImages} />;
}
