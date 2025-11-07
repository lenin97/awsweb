// components/client/ToasterClient.tsx
'use client'

import { Toaster as Sonner } from 'sonner'
import { useTheme } from 'next-themes'

export function ToasterClient() {
  const { theme = 'system' } = useTheme()

  // Validate the theme before passing it to Sonner
  const validTheme = theme === 'light' || theme === 'dark' || theme === 'system'
    ? theme
    : 'system'

  return <Sonner theme={validTheme} position="top-right" richColors />
}
