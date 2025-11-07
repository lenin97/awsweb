/*
File: app/blog/page.tsx
Server component using Amplify Gen 2 + Next.js App Router
*/
import { Metadata } from 'next';
import { runWithAmplifyServerContext } from '@/lib/amplifyServer';
import { list, getUrl } from 'aws-amplify/storage/server';
import { mdxToHtml } from '@/lib/mdxToHtml';
import { notFound } from 'next/navigation';
import BlogListClient from './BlogListClient';
import { cookies, headers } from 'next/headers';

//const POSTS_PER_PAGE = 5;

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
  const posts: Array<{
    title: string;
    description: string;
    tags?: string[];
    date: string;
    slug: string;
  }> = [];

  await runWithAmplifyServerContext({
    nextServerContext: {cookies},
    operation: async (context) => {
      try {
        const listResult = await list(context,{path: 'blog-posts/'});
        const mdxFiles = (listResult.items || []).filter(item =>
          item.path.endsWith('.mdx')
        );

        for (const file of mdxFiles) {
          try {
            const { url } = await getUrl(context,{
                path: file.path
              }
              );
            const res = await fetch(url.toString());
            const source = await res.text();
            const { metadata } = await mdxToHtml(source);

            const postDate = new Date(metadata.date);
            if (
              metadata.draft ||
              postDate > new Date() ||
              isNaN(postDate.getTime())
            ) {
              continue;
            }

            posts.push({
              ...metadata,
              slug: file.path
                .replace(/^blog-posts\//, '')
                .replace(/\.mdx$/, ''),
            });
          } catch {
            // ignore single-file errors
          }
        }
      } catch {
        // ignore listing errors
      }
    },
  });

  return posts;
}