// app/providers.tsx

"use client"

import { ThemeProvider } from "next-themes"
import { PropsWithChildren } from "react"


export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
