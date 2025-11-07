// File: app/posts/[slug]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
//import { getPostBySlug, listAllPostSlugs } from '@/lib/posts';
import { getCachePostSlug } from '@/lib/mdxSAs/getCachePostSlug';
import { BreadCrumbPost } from './breadCrumbPost';
import PostPageClient from './PostPageClient';
import { createPageMetadata } from '@/lib/seo/createPageMetadata';
import {SlugScript}  from './slugscript';
import {getImageUrl} from '@/lib/utils/getImageUrl'

export const dynamic = 'force-dynamic';
interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const {slug}= await params
  const result = await getCachePostSlug(slug);
  if (!result) return notFound();
  const { post, articleMeta } = result;
  //if (!post) return {};

  const slug_uri = encodeURIComponent(slug);
  const url = `/posts/${slug_uri}`;

  return createPageMetadata({
    title: post.title,
    description: post.description,
    url,
    image: { url: post.image, alt: post.title },
    openGraphTitle: post.title,
    openGraphDescription: post.description,
    openGraphType: 'article',
    articleMeta, // pass the full ArticleMeta object
    twitterTitle: post.title,
    twitterDescription: post.description,
  });
}

export default async function PostPage({ params }: PostPageProps) {
  const {slug}= await params
  const result = await getCachePostSlug(slug);
  if (!result) return notFound();
  const { post,bodyMarkdown } = result;
  if (!post) return notFound();//process.env.NEXT_PUBLIC_SITE_URL//`${siteUrl}/posts/${encodeURIComponent(post.slug)}`;
  const shareUrl = `${process.env.TCV_BASE_DOMAIN}/posts/${encodeURIComponent(slug)}`;
  const imageUrl = getImageUrl(post.image);

  console.log("[PostPage]::imageUrl::",imageUrl)

  return (
    <>
    <SlugScript slug={slug}/>
    <PostPageClient post={post} shareUrl={shareUrl}  content={bodyMarkdown} imageUrl={imageUrl}/>
    </>
  )
}