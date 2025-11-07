'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'

export default function TailorCvFrameUI() {
  return (
    <motion.header
      role="banner"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative w-full h-32 sm:h-32 md:h-32 lg:h-32 overflow-hidden rounded-xl shadow-lg"
    >
      {/* Background image */}
      <Image
        src="/images/pexels-jeshoots-238118.jpg"
        alt="Person tailoring a résumé template"
        fill
        className="object-cover"
        priority
      />

      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Centered, large heading */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <h1 className="text-white text-4xl sm:text-4xl md:text-4xl lg:text-5xl font-extrabold tracking-tight drop-shadow-lg text-center">
          Tailor&nbsp;CV
        </h1>
      </div>
    </motion.header>
  )
}
