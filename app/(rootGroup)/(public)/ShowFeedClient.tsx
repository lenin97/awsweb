// ShowFeedClient.tsx
'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'

type Post = {
  slug: string
  frontmatter: {
    title: string
    date: string
    description: string
  }
}

type ShowFeedClientProps = {
  posts: Post[]
}

export default function ShowFeedClient({ posts }: ShowFeedClientProps) {
  return (
    <>
      {posts.map((post) => (
        <motion.div
          key={post.slug}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <Card className="h-full dark:bg-gray-800">
            <CardContent className="p-5 flex flex-col justify-between h-full">
              <Link href={`/blog/${post.slug}`} className="block space-y-2">
                <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-400 hover:underline">
                  {post.frontmatter.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {post.frontmatter.date}
                </p>
                <p className="text-gray-700 dark:text-gray-200 line-clamp-3">
                  {post.frontmatter.description}
                </p>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </>
  )
}
