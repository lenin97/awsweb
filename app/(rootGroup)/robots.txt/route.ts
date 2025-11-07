// app/robots.txt/route.ts
import { crawlrobots } from "@/lib/mdxSAs/crawlrobots"; // adjust path if needed

export async function GET() {
  const { usrag, alw, stmp, disallowedPaths } = await crawlrobots();
  const disallowSection = Array.isArray(disallowedPaths)
  ? disallowedPaths
      .map((path) => path.trim())
      .filter((path) => path.length > 0)
      .map((path) => `Disallow: ${path}`)
      .join('\n')
  : ''; // fallback if disallowedPaths is not an array
  const timegenerated= new Date().toISOString()
  //disallowedPaths = ["/admin", "/internal"]; // Static disallowed paths

  const body = `
User-agent: ${usrag}
Allow: ${alw}
${disallowSection ? disallowSection + '\n' : ''}
Sitemap: ${stmp}

# Generated at: ${timegenerated}
`.trim();


  return new Response(body, {
    headers: {
      "Content-Type": "text/plain",
    },
  });
}


/*
User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml

*/