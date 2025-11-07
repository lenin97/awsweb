'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import type { Post } from '@/lib/types/Post';

export interface PostsListClientProps {
  posts: Post[];
}

export default function PostArray({ posts }: PostsListClientProps) {
  return (
    <>
       {posts.map((post) => (
        <motion.article
          key={post.slug}
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full h-full"
        >
          <Card className="w-full h-full flex flex-col justify-between dark:bg-gray-800 shadow-lg rounded-2xl">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <Link
                href={`/blog/${post.slug}`}
                className="space-y-2 group focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <h3 className="text-xl font-semibold break-words text-blue-700 dark:text-blue-400 group-hover:underline">
                  {post.title}
                </h3>
                <time
                  dateTime={post.date}
                  className="block text-sm text-gray-500 dark:text-gray-400"
                >
                  {post.date}
                </time>
                <p className="text-gray-700 dark:text-gray-200 line-clamp-3">
                  {post.description}
                </p>
              </Link>
            </CardContent>
          </Card>
        </motion.article>
      ))}
    </>
  );
}
