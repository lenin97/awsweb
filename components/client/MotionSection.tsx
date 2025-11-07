// File: components/MotionSection.tsx
"use client"
import { motion } from 'framer-motion'

export default function MotionSection({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      className="border-t mt-20 px-4 md:px-6 py-12 bg-gray-100 dark:bg-gray-900 text-sm"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
    >
      {children}
    </motion.section>
  )
}
