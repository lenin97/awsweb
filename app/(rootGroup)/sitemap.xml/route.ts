// app/sitemap.xml/route.ts
import { crawlsitemap } from "@/lib/mdxSAs/crawlsitemap"; // adjust path as needed
import { SitemapEntry } from "@/lib/types/sitemap";

export async function GET() {
  const entries: SitemapEntry[] = await crawlsitemap();

  const urls = entries
    .map(({ loc, lastmod, changefreq, priority }) => {
      return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`.trim();

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}



/*
// app/sitemap.xml/route.ts
export async function GET() {
  const posts = await fetch('https://yourdomain.com/api/posts', {
    next: { revalidate: 600 },
  }).then(res => res.json());

  const staticPages = [
    { loc: '/', lastmod: '2025-07-15' },
    { loc: '/about', lastmod: '2025-07-01' },
  ];

  const dynamicPages = posts.map((post: any) => ({
    loc: `/blog/${post.slug}`,
    lastmod: post.updatedAt || '2025-07-15',
  }));

  const allUrls = [...staticPages, ...dynamicPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
  ${allUrls
    .map(
      (url) => `
  <url>
    <loc>https://yourdomain.com${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url.loc === '/' ? '1.0' : '0.8'}</priority>
  </url>`
    )
    .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}

*/

/*
<?xml version="1.0" encoding="UTF-8"?>
<urlset 
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
>
  <url>
    <loc>https://yourdomain.com/</loc>
    <lastmod>2025-07-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://yourdomain.com/blog/my-post</loc>
    <lastmod>2025-07-14</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>

*/