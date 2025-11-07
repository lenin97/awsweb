// app/blog/[slug]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

/*
You’re building a strategic SEO blog, where you (the owner) post helpful, keyword-targeted articles to improve discoverability, trust, and conversions. Not a social blog. Not a multi-author publishing platform (unless you expand to that).

Let me know if you'd like to:

Add a blog listing page

Connect to real CMS or MDX content

Auto-generate sitemap entries for your blog posts
*/

// This would normally be dynamic
const post = {
  title: 'How to Write a Resume with AI',
  description: 'Learn how to use AI to write a highly effective resume tailored to job descriptions.',
  slug: 'resume-with-ai',
  date: '2025-06-30',
  author: 'Jane Doe',
  image: 'https://resumegenai.com/blog/resume-ai-cover.jpg'
}

export const metadata: Metadata = {
  title: post.title,
  description: post.description,
  alternates: {
    canonical: `/blog/${post.slug}`
  }
}

export default function BlogPostPage() {
  if (!post) return notFound()

  return (
    <article>
      <h1>{post.title}</h1>
      <p><em>By {post.author} on {post.date}</em></p>
      <img src={post.image} alt="Blog post cover" />
      <p>{post.description}</p>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": post.title,
        "author": {
          "@type": "Person",
          "name": post.author
        },
        "datePublished": post.date,
        "image": post.image,
        "url": `https://resumegenai.com/blog/${post.slug}`,
        "publisher": {
          "@type": "Organization",
          "name": "ResumeGenAI",
          "logo": {
            "@type": "ImageObject",
            "url": "https://resumegenai.com/logo.png"
          }
        },
        "description": post.description
      }) }} />
    </article>
  )
}
