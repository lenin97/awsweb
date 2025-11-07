// File: components/ModernHeader.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { MotionNavLink } from '@/components/client/MotionNavLink'
import { ThemeToggle } from './ThemeToggle'
import { navigate2TailorCV } from '@/lib/utils/navigate2TailorCV'

interface ModernHeaderProps {
  /**
   * The display name of the application (used in logo alt text and brand name).  
   * Now passed in as a prop for better configurability.
   */
  nameApp: string
  /**
   * Optional client-rendered user-authentication menu (rendered via parallel route slot).
   */
  UserAuthMenu?: React.ReactNode
}

export default function ModernHeader({
  nameApp,
  UserAuthMenu,
}: ModernHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const hreftoolCV = navigate2TailorCV()
  //const nameApp = process.env.TCV_APP_NAME_HEADER

  return (
    <header
      className="
        sticky top-0 z-50 border-b bg-white/90 dark:bg-black/80 
        backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/60 
        transition-shadow shadow-sm
      "
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Logo + Brand */}
        <MotionNavLink href="/" className="inline-flex items-center space-x-2">
          <Image
            src="/images/logo.png"
            alt={`${nameApp} logo`}
            width={48}
            height={48}
            className="h-10 w-auto sm:h-12 md:h-14 lg:h-16"
            priority
          />
          <span className="text-lg sm:text-xl font-bold tracking-tight text-black dark:text-white">
            {nameApp}
          </span>
        </MotionNavLink>

        {/* Hamburger: shown on small screens only */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-expanded={menuOpen}
          aria-label="Toggle menu"
          className="sm:hidden p-2 rounded-md focus:outline-none focus:ring"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-800 dark:text-gray-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Navigation links */}
        <nav
          aria-label="Main navigation"
          className={`
            absolute top-full inset-x-0 bg-white dark:bg-black/90 border-b border-gray-200 dark:border-gray-800 
            sm:static sm:flex sm:space-x-4 sm:bg-transparent sm:border-none
            transition-max-h duration-300 ease-in-out overflow-hidden
            ${menuOpen ? 'max-h-96 py-4' : 'max-h-0 sm:max-h-full sm:py-0'}
          `}
        >
          <ul className="flex flex-col sm:flex-row items-start sm:items-center text-gray-600 dark:text-gray-300 text-sm font-medium">
            {[
              { href: hreftoolCV, label: 'Tool' },
              { href: '/about', label: 'About' },
              { href: '/contact', label: 'Contact' },
            ].map(({ href, label }) => (
              <li key={label} className="w-full sm:w-auto" onClick={() => setMenuOpen(false)}>
                <MotionNavLink
                  href={href}
                  className="block px-4 py-2 hover:text-black dark:hover:text-white transition"
                >
                  {label}
                </MotionNavLink>
              </li>
            ))}
            <li className="px-4 py-2">
              <ThemeToggle />
            </li>
            {UserAuthMenu && <li className="px-4 py-2">{UserAuthMenu}</li>}
          </ul>
        </nav>
      </div>
    </header>
  )
}
