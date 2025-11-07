'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import clsx from 'clsx'

const PRIMARY = '#ffffff'       // Tailwind’s blue-500
const PRIMARY_LIGHT = '#dbeafe' // Tailwind’s blue-400
// 1) Props to parametrize href and label
// Props to parametrize href, label, disabled state, button type, and size
// Note: size values must match the underlying Button's variant types
interface TryToolButtonProps {
  href?: string
  label: string
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  size?: 'sm' | 'default' | 'lg' | 'icon'
}

// 2) Create a Motion-enabled Button
const MotionButton = motion.create(Button)

const variants = {
  rest:      { scale: 1, backgroundColor: '#ffffff' },   // Idle look
  hover:     { scale: 1.05 },                           // While cursor is over
  tap:       { scale: 0.95, backgroundColor: '#dbeafe' }, // While pressing
  pressed:   { scale: 1, backgroundColor: '#dbeafe' }    // After press finishes
}


export function CustomButton({ 
  href,
  label,
  disabled = false,
  type = 'button',
  size = 'default',
  }: TryToolButtonProps) {
  const [pressed, setPressed] = useState(false)
  const pathname = usePathname()
  //useUploadStatusStore.getState().hasStarted

  // Reset pressed state when user returns to this page
  useEffect(() => {
    setPressed(false)
  }, [pathname])

  // Determine if using Link or button
  const asChild = Boolean(href)

  return (
    <MotionButton
      asChild={asChild}
      size={size}
      type={type}
      initial="rest"
      whileHover={disabled ? undefined : 'hover'}
      whileTap={disabled ? undefined : 'tap'}
      animate={pressed ? 'pressed' : 'rest'}
      variants={variants}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      onTap={() => {
        if (!disabled) setPressed(true)
      }}
      disabled={disabled}
      className={clsx(
        'rounded-xl transition-shadow duration-200 shadow-md font-semibold',
        // size-specific padding and text
        size === 'sm' && 'px-4 py-2 text-xs',
        size === 'default' && 'px-5 py-2.5 text-sm',
        size === 'lg' && 'px-6 py-3 text-sm',
        size === 'icon' && 'p-2',
        // color and border
        'text-blue-600 border border-blue-200',
        // focus ring
        'focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 focus-visible:ring-offset-2',
        // hover and pressed states
        !disabled && 'hover:bg-blue-50',
        pressed && !disabled && 'bg-blue-100',
        // disabled styles
        disabled && 'opacity-50 cursor-not-allowed',
      )}
      style={{ backgroundColor: PRIMARY }}  // ensure initial color for non-js or pre-hydration
    >
      {/* Render Link if href provided, else plain span */}
      {href ? <Link href={href}>{label}</Link> : <span>{label}</span>}
    </MotionButton>
  )
}

// Usage Example:
// <TryToolButton href="/tailorCV/home" label="Try the Tool" />
