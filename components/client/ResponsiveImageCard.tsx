// components/ResponsiveImageCard.client.tsx
'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

type ClientProps = {
  children: ReactNode
  className?: string
}

export default function ResponsiveImageCardClient({ children, className = '' }: ClientProps) {
  return (
    // motion.figure will hydrate on the client and animate, while its children are server-rendered HTML
    <motion.figure
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={`overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-md ring-1 ring-zinc-100 dark:ring-zinc-800 transition-colors duration-300 ${className}`}
    >
      {children}
    </motion.figure>
  )
}
