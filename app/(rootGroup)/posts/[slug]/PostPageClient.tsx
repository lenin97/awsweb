// File: components/PostPageClient.tsx (Client Component)
'use client';
import React, { useMemo, useState, useEffect } from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import type { Post } from '@/lib/types/Post';
import { Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
// Adjust this import path if your MarkdownRenderer is under a different folder
import MarkdownRenderer from '@/components/client/MarkdownRenderer';
import { unwrapBacktickedHtml } from '@/lib/utils/unwrapBacktickedHtml';
import { BreadCrumbPost } from './breadCrumbPost';

interface PostPageClientProps {
  post: Post;
  shareUrl: string;
  content?: string;
  imageUrl?: string | null; // <-- new prop
}

export default function PostPageClient({ post, shareUrl, content = '', imageUrl }: PostPageClientProps) {
  // decide the allowHtml mode you will pass to the renderer
  // (you were using allowHtml="sanitize" in the previous code)
  const allowHtmlMode: 'sanitize' | 'none' = 'sanitize';

  // Initialize processedContent synchronously to avoid hydration mismatch.
  const [processedContent, setProcessedContent] = useState<string>(() => {
    if (!content) return '';
    if (allowHtmlMode === 'sanitize') {
      const sanitised = unwrapBacktickedHtml(content);
      return sanitised ?? '';
    }
    return content;
  });

  // Keep in sync if `content` prop changes at runtime
  useEffect(() => {
    if (!content) {
      if (processedContent !== '') setProcessedContent('');
      return;
    }
    if (allowHtmlMode === 'sanitize') {
      const sanitised = unwrapBacktickedHtml(content) ?? '';
      if (sanitised !== processedContent) setProcessedContent(sanitised);
    } else {
      if (content !== processedContent) setProcessedContent(content);
    }
  }, [content, allowHtmlMode, processedContent]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title, text: post.description, url: shareUrl });
      } catch {
        // no-op (user cancelled, etc)
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link copied to clipboard');
      } catch {
        toast.error('Could not copy link', { description: shareUrl });
      }
    }
  };

  return (
    <article className="max-w-3xl px-4 mx-auto py-10 sm:py-16 lg:py-20">
      <div className="space-y-4">
        {/* Breadcrumb placed above the H1 so it's top-of-article and immediately visible */}
        <BreadCrumbPost slug={post.slug as string} title={post.title} />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
          {post.title}
        </h1>

        <p className="text-sm text-muted-foreground">
          Published on <time dateTime={post.date}>{post.date}</time>
        </p>

        <div className="relative w-full aspect-video rounded-xl overflow-hidden">
          <Image
            src={imageUrl!}
            alt={post.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 50vw"
            className="object-cover"
            priority
          />
        </div>

        {/* Short description (keeps your previous link handling) */}
        <div className="prose dark:prose-invert max-w-none">
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
            {post.description}
          </ReactMarkdown>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <Button
            onClick={handleShare}
            variant="outline"
            className="w-full sm:w-auto"
            aria-label="Share this post"
          >
            <Share className="mr-2 h-4 w-4" /> Share this post
          </Button>
        </div>

        {/* Main content rendered with your MarkdownRenderer */}
        {processedContent && (
          <section className="mt-8">
            <MarkdownRenderer
              content={processedContent}
              useBreaks={true}
              allowHtml={allowHtmlMode}
              prose={true}
            />
          </section>
        )}
      </div>
    </article>
  );
}
