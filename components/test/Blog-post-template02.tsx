// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'
import { runWithAmplifyServerContext } from 'aws-amplify/adapter-nextjs'
import { Storage } from 'aws-amplify/storage/server'
import { mdxToHtml } from '@/lib/mdxToHtml'
import path from 'path'

interface BlogPostMeta {
  title: string
  description: string
  date: string
  author: string
  image: string
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const slug = params.slug

  const fileKey = `blog-posts/${slug}.mdx`

  let mdxContent: string | null = null

  await runWithAmplifyServerContext({ nextServerContext: {} }, async (context) => {
    try {
      const { url } = await Storage.get({ key: fileKey }, { access: { level: 'public' }, context })
      const res = await fetch(url)
      mdxContent = await res.text()
    } catch (err) {
      console.error('Failed to load MDX from S3:', err)
    }
  })

  if (!mdxContent) return notFound()

  const { content, metadata } = await mdxToHtml(mdxContent)
  const meta = metadata as BlogPostMeta

  return (
    <article className="prose max-w-3xl mx-auto py-8">
      <h1>{meta.title}</h1>
      <p><em>By {meta.author} on {meta.date}</em></p>
      <img src={meta.image} alt="Blog post cover" className="rounded-xl" />
      <div dangerouslySetInnerHTML={{ __html: content }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": meta.title,
        "author": {
          "@type": "Person",
          "name": meta.author
        },
        "datePublished": meta.date,
        "image": meta.image,
        "url": `https://resumegenai.com/blog/${slug}`,
        "publisher": {
          "@type": "Organization",
          "name": "ResumeGenAI",
          "logo": {
            "@type": "ImageObject",
            "url": "https://resumegenai.com/logo.png"
          }
        },
        "description": meta.description
      }) }} />
    </article>
  )
}
/*
| Feature                       | `/blog/page.tsx` (List Page)   | `/blog/[slug]/page.tsx` (Single Post Page) |
| ----------------------------- | ------------------------------ | ------------------------------------------ |
| **Purpose**                   | Lists all published blog posts | Renders one full blog post by slug         |
| **Reads all files from S3**   | ✅ yes (to extract metadata)    | ❌ no                                       |
| **Reads a specific file**     | ❌ no                           | ✅ yes (`slug`)                             |
| **Filters out drafts/future** | ✅ yes                          | ❌ no (but you could add the same logic)    |
| **Parses full MDX content**   | ❌ no, only metadata            | ✅ yes (uses full content + metadata)       |
| **Pagination/Search**         | ✅ yes                          | ❌ no                                       |
| **Structured SEO output**     | ❌ no                           | ✅ yes (JSON-LD added)                      |

*/