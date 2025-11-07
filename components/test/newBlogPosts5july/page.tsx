/*
File: app/blog/page.tsx
Description: Server component for Next.js App Router + Amplify Gen2
*/
import { Metadata } from 'next';
import { runWithAmplifyServerContext } from '@aws-amplify/adapter-nextjs';
import { Storage } from 'aws-amplify/storage/server';
import { mdxToHtml } from '@/lib/mdxToHtml';
import { notFound } from 'next/navigation';
import BlogListClient from './BlogListClient';

const POSTS_PER_PAGE = 5;

// SEO metadata
export const metadata: Metadata = {
  title: 'Blog | MySite',
  description: 'Read the latest articles and tutorials on JavaScript, AWS Amplify, Next.js, and more.',
  openGraph: {
    title: 'Blog | MySite',
    description: 'Stay up‑to‑date with our in‑depth technical posts and guides.',
    url: 'https://www.mysite.com/blog',
  },
};

async function fetchAllPosts() {
  const posts: Array<{ title: string; description: string; tags?: string[]; date: string; slug: string }> = [];

  await runWithAmplifyServerContext({ nextServerContext: {} }, async (context) => {
    try {
      const listResult = await Storage.list({ path: 'blog-posts/' }, { context });
      const mdxFiles = listResult.items?.filter(item => item.key?.endsWith('.mdx')) || [];

      for (const file of mdxFiles) {
        try {
          const { url } = await Storage.get({ key: file.key! }, { context });
          const res = await fetch(url);
          const source = await res.text();
          const { metadata } = await mdxToHtml(source);

          const postDate = new Date(metadata.date);
          if (metadata.draft || postDate > new Date() || isNaN(postDate.getTime())) continue;

          posts.push({
            ...metadata,
            slug: file.key!.replace(/^blog-posts\//, '').replace(/\.mdx$/, ''),
          });
        } catch {
          // ignore file errors
        }
      }
    } catch {
      // ignore list errors
    }
  });

  return posts;
}

export default async function BlogPage({ searchParams }: { searchParams?: { q?: string; tag?: string; page?: string } }) {
  const q = searchParams?.q ?? '';
  const tag = searchParams?.tag ?? '';
  const page = parseInt(searchParams?.page ?? '1', 10);

  const allPosts = await fetchAllPosts();
  if (allPosts.length === 0 && page === 1) {
    notFound();
  }

  return (
    <BlogListClient
      posts={allPosts}
      query={q}
      tag={tag}
      currentPage={page}
      postsPerPage={POSTS_PER_PAGE}
    />
  );
}