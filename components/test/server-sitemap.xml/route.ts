// app/server-sitemap.xml/route.ts
import { getServerSideSitemap } from 'next-sitemap'
import { runWithAmplifyServerContext } from 'aws-amplify/adapter-nextjs'
import { Storage } from 'aws-amplify/storage/server'
import { mdxToHtml } from '@/lib/mdxToHtml'
import { MetadataRoute } from 'next'

export async function GET(): Promise<MetadataRoute.Sitemap> {
  const urls: MetadataRoute.SitemapUrl[] = []

  await runWithAmplifyServerContext({ nextServerContext: {} }, async (context) => {
    try {
      const list = await Storage.list({ path: 'blog-posts/' }, { access: { level: 'public' }, context })
      const mdxFiles = list.items?.filter(item => item.key.endsWith('.mdx')) || []

      for (const file of mdxFiles) {
        try {
          const { url } = await Storage.get({ key: file.key! }, { access: { level: 'public' }, context })
          const res = await fetch(url)
          const text = await res.text()
          const { metadata } = await mdxToHtml(text)

          if (metadata.draft) continue
          const postDate = new Date(metadata.date)
          if (isNaN(postDate.getTime()) || postDate > new Date()) continue

          const slug = file.key.replace(/^blog-posts\//, '').replace(/\.mdx$/, '')
          urls.push({
            loc: `https://resumegenai.com/blog/${slug}`,
            lastmod: postDate.toISOString()
          })
        } catch {}
      }
    } catch {}
  })

  return getServerSideSitemap(urls)
}
