// File: components/ShareButton.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function ShareButton({ className = '' }: { className?: string }) {
  const [isMobile, setIsMobile] = useState(false)
  const [canShareNative, setCanShareNative] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  // Detect device viewport
  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.matchMedia('(max-width: 640px)').matches)
    }

    checkViewport()
    window.addEventListener('resize', checkViewport)
    return () => window.removeEventListener('resize', checkViewport)
  }, [])

  // Check if navigator.share is available
  useEffect(() => {
    setCanShareNative(typeof navigator !== 'undefined' && !!navigator.share)
  }, [])

  const handleShare = useCallback(async () => {
    const shareData = {
      title: document.title,
      text: document.title,
      url: window.location.href,
    }

    if (canShareNative) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled or error
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareData.url)
        setFeedback('Link copied!')
        setTimeout(() => setFeedback(null), 2000)
      } catch {
        setFeedback('Unable to copy link')
        setTimeout(() => setFeedback(null), 2000)
      }
    }
  }, [canShareNative])

  const baseStyles =
    'fixed z-50 transition-all ' +
    (isMobile
      ? 'bottom-4 right-4 rounded-full shadow-xl backdrop-blur-md dark:bg-neutral-900/80 bg-white/80'
      : 'top-16 right-4')

  return (
    <div
      className={`z-50 ${
        isMobile
          ? 'fixed bottom-4 right-4'
          : 'fixed top-16 right-4 px-4 py-2 rounded-full bg-white/80 dark:bg-neutral-900/80 text-black dark:text-white shadow-md backdrop-blur-md hover:scale-105 transition flex items-center space-x-2'
      } ${className}`}
    >
      <button
        onClick={handleShare}
        aria-label="Share this page"
        className={`flex items-center justify-center ${
          isMobile
            ? 'w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-xl hover:scale-105 transition'
            : 'text-sm font-medium text-foreground'
        }`}
      >
        <Share2 className={`w-5 h-5 ${isMobile ? '' : 'mr-2'}`} />
        {!isMobile && <span>Share</span>}
      </button>

      <AnimatePresence>
        {feedback && (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="absolute -top-8 right-0 bg-black text-white text-xs px-2 py-1 rounded shadow-md dark:bg-white dark:text-black"
          >
            {feedback}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
