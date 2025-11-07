'use client'

import { useState, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import clsx from 'clsx'

// Color constants
const PRIMARY = '#ffffff'
const PRIMARY_LIGHT = '#dbeafe'

// Props: href, children, and optional classes
interface MotionLinkProps {
  href: string
  children: ReactNode
  className?: string
}

// Convert Next.js Link into a motion-enabled component
const MotionLink = motion.create(Link)

// Only animate scale here; colors come from Tailwind classes
const variants = {
  rest:  { scale: 1 },
  hover: { scale: 1.05 },
  tap:   { scale: 0.95 },
  // "pressed" just returns to normal scale but keeps the bg style
  pressed: { scale: 1 },
}

export function MotionNavLink({ href, children, className }: MotionLinkProps) {
  const [pressed, setPressed] = useState(false)
  const pathname = usePathname()

  // Reset on route change
  useEffect(() => setPressed(false), [pathname])

  // Reset immediately if navigating to the same route
  useEffect(() => {
    if (pressed && pathname === href) {
      setPressed(false)
    }
  }, [pressed, pathname, href])

  return (
    <MotionLink
      href={href}
      initial="rest"
      whileHover="hover"
      whileTap="tap"
      animate={pressed ? 'pressed' : 'rest'}
      variants={variants}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onTap={() => setPressed(true)}
      className={clsx(
        'inline-block px-4 py-2 rounded-lg transition-colors duration-150',
        // default neutral background
        'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800',
        // pressed / active background
        pressed && 'bg-gray-200 dark:bg-gray-700',
        className
      )}
      //style={{ backgroundColor: PRIMARY }}
    >
      {/* Wrap children in a span for consistent text rendering <span className="text-base font-medium">{children}</span>*/}
      
      {children}
    </MotionLink>
  )
}

// Usage in ModernHeader.tsx:
// <MotionNavLink
//   href="/"
//   className="text-lg sm:text-xl font-bold tracking-tight hover:opacity-90 transition"
// >
//   ResumeGenAI
// </MotionNavLink>

