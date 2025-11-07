import React, { cache } from 'react';
import { MDXRemote } from 'next-mdx-remote';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';

type Frontmatter = {
  title: string;
  [key: string]: unknown; // ✅ Avoid 'any' while allowing additional fields
};

type Post = {
  frontmatter: Frontmatter;
  MDXContent: MDXRemoteSerializeResult;
};

/**
 * Given the posts array, memoize the JSX output.
 * As long as `posts` is the same reference,
 * this returns the exact same React nodes without re-computing.
 */
export const renderPosts = cache((posts: Post[]) => {
  return posts.map((post, i) => (
    <article key={i}>
      <h1>{post.frontmatter.title}</h1>
      <MDXRemote {...post.MDXContent} />
    </article>
  ));
});
