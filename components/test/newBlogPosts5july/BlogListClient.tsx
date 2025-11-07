/*
File: app/blog/BlogListClient.tsx
Description: Client component handling UI, filtering, pagination, and accessibility
*/
'use client';

import Link from 'next/link';
import { useState } from 'react';

type Post = { title: string; description: string; tags?: string[]; date: string; slug: string };

interface BlogListClientProps {
  posts: Post[];
  query: string;
  tag: string;
  currentPage: number;
  postsPerPage: number;
}

export default function BlogListClient({ posts, query, tag, currentPage, postsPerPage }: BlogListClientProps) {
  const [q, setQ] = useState(query);
  const [t, setT] = useState(tag);

  // filter posts
  const filtered = posts.filter(post => {
    const mq = !q || post.title.toLowerCase().includes(q.toLowerCase()) || post.description.toLowerCase().includes(q.toLowerCase());
    const mt = !t || (post.tags || []).includes(t);
    return mq && mt;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / postsPerPage));
  const page = Math.min(Math.max(1, currentPage), totalPages);
  const paginated = filtered.slice((page - 1) * postsPerPage, page * postsPerPage);

  return (
    <main className="max-w-3xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Blog</h1>

      <form method="get" className="mb-6" role="search" aria-label="Filter blog posts">
        <input
          type="search"
          name="q"
          placeholder="Search posts..."
          defaultValue={q}
          onChange={e => setQ(e.target.value)}
          className="border rounded p-2 w-full" 
          aria-label="Search query"
        />
        <input
          type="text"
          name="tag"
          placeholder="Tag filter..."
          defaultValue={t}
          onChange={e => setT(e.target.value)}
          className="border rounded p-2 w-full mt-2"
          aria-label="Tag filter"
        />
        <button type="submit" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded">
          Filter
        </button>
      </form>

      <ul className="space-y-6">
        {paginated.map(post => (
          <li key={post.slug} className="border-b pb-4">
            <Link href={`/blog/${post.slug}`} className="text-xl font-semibold text-blue-600 hover:underline">
              {post.title}
            </Link>
            <time dateTime={post.date} className="text-sm text-gray-500 block">
              {new Date(post.date).toLocaleDateString()}
            </time>
            <p className="mt-1 text-gray-700">{post.description}</p>
          </li>
        ))}
      </ul>

      <nav className="flex justify-between mt-6" aria-label="Pagination">
        <Link
          href={{ pathname: '/blog', query: { q, tag: t, page: page - 1 } }}
          className={`px-4 py-2 rounded bg-gray-200 ${page <= 1 ? 'opacity-50 pointer-events-none' : ''}`}
          aria-disabled={page <= 1}
        >
          Previous
        </Link>
        <span className="self-center">Page {page} of {totalPages}</span>
        <Link
          href={{ pathname: '/blog', query: { q, tag: t, page: page + 1 } }}
          className={`px-4 py-2 rounded bg-gray-200 ${page >= totalPages ? 'opacity-50 pointer-events-none' : ''}`}
          aria-disabled={page >= totalPages}
        >
          Next
        </Link>
      </nav>
    </main>
  );
}
