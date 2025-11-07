// lib/mdxToHtml.ts
//import { compile } from '@mdx-js/mdx'
//import * as runtime from 'react/jsx-runtime'
import matter from 'gray-matter'
import { toHtml } from 'hast-util-to-html'
import { toHast } from 'mdast-util-to-hast'
import { fromMarkdown } from 'mdast-util-from-markdown'
//import remarkFrontmatter from 'remark-frontmatter'
//import remarkGfm from 'remark-gfm'
//import rehypeRaw from 'rehype-raw'
//import rehypeStringify from 'rehype-stringify'

//npm install gray-matter @mdx-js/mdx react remark-gfm remark-frontmatter rehype-raw rehype-stringify hast-util-to-html mdast-util-from-markdown mdast-util-to-hast


export async function mdxToHtml(source: string) {
  const { content, data } = matter(source)

  const tree = fromMarkdown(content)
  const hast = toHast(tree, { allowDangerousHtml: true })
  const html = toHtml(hast)

  return {
    content: html,
    metadata: data
  }
}
