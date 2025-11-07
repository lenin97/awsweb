"use client"

import Link from "next/link"
//import Image from "next/image"
import { Button } from "@/components/ui/button"
//import { Card, CardContent } from "@/components/ui/card"
import type { ReactNode } from 'react'
import { motion } from "framer-motion"
import ResponsiveImageCardClient  from '@/components/client/ResponsiveImageCard'
import {CustomButton} from "@/components/client/CustomButton"//navigate2TailorCV
import {navigate2TailorCV} from '@/lib/utils/navigate2TailorCV'


type LandingPageClientProps = {
  //imageUrl: string
  blogPosts: ReactNode // This will be passed from a Server Component
  nameApp: string,
  children: ReactNode
}

export default function LandingPageClient({ children, blogPosts, nameApp }: LandingPageClientProps) {

  const hreftoolcv= navigate2TailorCV()
  //const nameApp=process.env.TCV_APP_NAME_HEADER

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
            {nameApp} helps you tailor your resume to any job in seconds using AI.
          </p>
          <CustomButton href={hreftoolcv} label={`Try ${nameApp}`} />
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
            <h2 className="text-2xl font-semibold mb-4">Why {nameApp}?</h2>
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
             <ResponsiveImageCardClient>
              {children}
            </ResponsiveImageCardClient>
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

        {blogPosts}
        
      </section>
    </main>
  )
}
