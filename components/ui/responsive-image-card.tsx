'use client'

import { AspectRatio } from '@/components/ui/aspect-ratio'
import { motion } from 'framer-motion'
import Image from 'next/image'

type ResponsiveImageCardProps = {
  src: string
  alt: string
  priority?: boolean
  caption?: string
  className?: string
}

export function ResponsiveImageCard({
  src,
  alt,
  priority = false,
  caption,
  className = '',
}: ResponsiveImageCardProps) {
  return (
    <motion.figure
      layout
      className={`overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 shadow-md ring-1 ring-zinc-100 dark:ring-zinc-800 transition-colors duration-300 ${className}`}
    >
      <AspectRatio ratio={16 / 9}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          // make Next generate the appropriate srcset / preload candidate
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 60vw"
          // explicit loading matches priority for clarity
          loading={priority ? 'eager' : 'lazy'}
          className="object-cover"
        />
      </AspectRatio>

      {caption && (
        <figcaption className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
          {caption}
        </figcaption>
      )}
    </motion.figure>
  )
}
