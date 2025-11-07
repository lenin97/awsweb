'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ComponentProps } from 'react'

// Grab full <Link> props so "children" and styling work
type SafeLinkProps = ComponentProps<typeof Link>

/**
 * Wraps App Router <Link> to prevent duplicate navigations
 */
export function SafeLink(props: SafeLinkProps) {
  const { onNavigate: userOnNavigate, ...rest } = props
  const [clicked, setClicked] = useState(false)

  const handleNavigate = (event: { preventDefault(): void }) => {
    if (clicked) {
      event.preventDefault()
    } else {
      setClicked(true)
    }
    userOnNavigate?.(event)  // preserve user callback
  }

  return <Link {...rest} onNavigate={handleNavigate} />
}
