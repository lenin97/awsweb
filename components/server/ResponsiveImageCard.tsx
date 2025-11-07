// components/ResponsiveImageCard.server.tsx
import { AspectRatio } from '@/components/ui/aspect-ratio'
import Image from 'next/image'
//import ResponsiveImageCardClient from './ResponsiveImageCard.client'

type Props = {
  src: string
  alt: string
  priority?: boolean
  caption?: string
  className?: string
}

export default function ResponsiveImageCard({
  src,
  alt,
  priority = false,
  caption,
  className = '',
}: Props) {
  // Build the server-rendered content (Image + figcaption). This will be SSR'd,
  // so Next can emit the correct <link rel="preload"> when priority === true.
  const content = (
    <>
      <AspectRatio ratio={16 / 9}>
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}           // <-- SSR-level priority
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 60vw"
          className="object-cover"
        />
      </AspectRatio>

      {caption && (
        <figcaption className="px-4 py-3 text-sm text-zinc-700 dark:text-zinc-300">
          {caption}
        </figcaption>
      )}
    </>
  )

  // Wrap server content with the client motion wrapper (server components may import client components)
  return content
}
