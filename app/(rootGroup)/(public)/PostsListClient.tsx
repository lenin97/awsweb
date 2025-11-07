'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';
import type { Post } from '@/lib/types/Post';
import { Share } from 'lucide-react';
import { toast } from "sonner"; // instead of useToast

export interface ExternalLink {
  label: string;
  url: string;
}

export interface PostsListClientProps {
  posts: Post[];
  defaultCount?: number;
  moreCount?: number;
}

export default function PostsListClient({
  posts,
  defaultCount = 3,
  moreCount = 3,
}: PostsListClientProps) {
  const [visibleCount, setVisibleCount] = useState(defaultCount);
  const [animating, setAnimating] = useState(false);
  const visiblePosts = posts.slice(0, visibleCount);

  const handleShare = async (post: Post) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/posts/${post.slug}`;
    const shareData: ShareData = {
      title: post.title,
      text: post.description || '',
      url: shareUrl,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);//share image, updated later
      } catch (err) {
        console.info('Share cancelled or failed', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard')
      } catch {
        toast.error('Could not copy to clipboard', {
          description: shareUrl,
        })
      }
    }
  };

  const handleShowMore = () => {
    const newCount = Math.min(visibleCount + moreCount, posts.length);
    setVisibleCount(newCount);
  };

  const handleShowLess = () => {
    setAnimating(true);
    // Let exit animation complete before slicing
    setTimeout(() => {
      setVisibleCount(defaultCount);
      setAnimating(false);
    }, 300); // Match `exit` transition duration
  };

  return (
    <>
      <motion.div
        layout
        role="list"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence>
          {visiblePosts.map((post, index) => {
            let externalLinks: ExternalLink[] = [];
            if (post.links && post.links.trim()) {
              try {
                const parsed = JSON.parse(post.links);
                if (Array.isArray(parsed)) {
                  externalLinks = parsed as ExternalLink[];
                }
              } catch {
                console.warn(`Invalid links JSON for post ${post.slug}`);
              }
            }

            return (
              <motion.article
                key={post.slug}
                layout
                role="listitem"
                 initial={{ opacity: 0, scale: 0.98, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  transition={{
                    type: 'spring',
                    stiffness: 100,
                    damping: 20,
                    mass: 0.4,
                  }}
                className="flex flex-col h-full"
              >
                <Card className="flex flex-col h-full dark:bg-gray-800 shadow-lg rounded-2xl">
                  <div className="relative w-full h-48 md:h-56 lg:h-64 rounded-t-2xl overflow-hidden">
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover"
                      priority={index === 0}
                    />
                    <motion.button
                      onClick={() => handleShare(post)}
                      whileTap={{ scale: 0.9 }}
                      title="Share post"
                      aria-label="Share post"
                      className="absolute top-2 right-2 z-10 p-2 rounded-full shadow-md bg-white/80 dark:bg-gray-900/70 hover:shadow-lg backdrop-blur transition-colors"
                    >
                      <Share size={18} className="text-black dark:text-white" />
                    </motion.button>
                  </div>
                  <CardContent className="p-5 flex flex-col justify-between flex-1">
                    
                  <div className="space-y-2 group block">
                     <Link href={`/posts/${post.slug}`}>
                        <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-400 group-hover:underline">
                          {post.title}
                        </h3>
                        <time
                          dateTime={post.date}
                          className="text-sm text-gray-500 dark:text-gray-400"
                        >
                          {post.date}
                        </time>
                     </Link>
                      <div className="prose prose-sm dark:prose-invert line-clamp-3">
                        <ReactMarkdown
                          components={{
                            a: ({ node, ...props }) => (
                              <a
                                {...props}
                                className="text-blue-600 dark:text-blue-300 hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                              />
                            ),
                          }}
                        >
                          {post.description || ''}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {externalLinks.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {externalLinks.map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 dark:text-blue-300 hover:underline"
                          >
                            {link.label}
                          </a>
                        ))}
                      </div>
                    )}

                  </CardContent>
                </Card>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {(visibleCount < posts.length || visibleCount > defaultCount) && (
        <div className="mt-8 flex justify-center gap-4">
          {visibleCount < posts.length && (
            <Button onClick={handleShowMore} className="px-6 py-2">
              Show more
            </Button>
          )}
          {visibleCount > defaultCount && (
            <Button
              variant="outline"
              onClick={handleShowLess}
              className="px-6 py-2"
              disabled={animating}
            >
              Show fewer
            </Button>
          )}
        </div>
      )}
    </>
  );
}
