"use client"

import Link from "next/link"
import Image from "next/image"
import { getFeaturedPosts } from "@/lib/getFeaturedPosts"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"

export default async function LandingPage() {
  const posts = await getFeaturedPosts()

  return (
    <main className="min-h-screen bg-white text-gray-900 dark:bg-black dark:text-white">
      {/* Hero Section */}
      <section className="py-20 px-4 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.6 }}
        >
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Supercharge Your Resume with AI
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            ResumeGenAI helps you tailor your resume to any job in seconds using AI. 
          </p>
          <Button asChild size="lg">
            <Link href="/tool">Try the Tool</Link>
          </Button>
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-100 dark:bg-gray-900 py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, amount: 0.5 }}
          >
            <h2 className="text-2xl font-semibold mb-4">Why ResumeGenAI?</h2>
            <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Instant resume tailoring with AI</li>
              <li>Designed for all industries and roles</li>
              <li>Simple, clean, and export-ready</li>
              <li>No signup required</li>
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, amount: 0.5 }}
            className="rounded-2xl overflow-hidden shadow-md"
          >
            <Image 
              src="/tool-preview.png" 
              alt="ResumeGenAI preview"
              width={600} height={400} 
              className="w-full object-cover"
              priority
            />
          </motion.div>
        </div>
      </section>

      {/* Blog Posts for SEO */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <motion.h2 
          className="text-3xl font-bold mb-10 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, amount: 0.5 }}
        >
          Career Tips & Job Hacks
        </motion.h2>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{post.date}</p>
                    <p className="text-gray-700 dark:text-gray-200 line-clamp-3">{post.description}</p>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button asChild variant="outline">
            <Link href="/blog">Browse All Posts</Link>
          </Button>
        </div>
      </section>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": "ResumeGenAI",
            "description": "AI-powered resume tailoring tool for job seekers.",
            "url": "https://resumegenai.com",
            "logo": "https://resumegenai.com/logo.png",
            "brand": {
              "@type": "Brand",
              "name": "ResumeGenAI"
            }
          })
        }}
      />
    </main>
  )
}
