// app/layout.tsx
import './globals.css'
// File: app/layout.tsx (Server Component)
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { ThemeProvider } from 'next-themes'
//import Link from 'next/link'
import AnimatedFooterSection from '@/components/server/AnimatedFooterSection'
import ModernHeader from '@/components/client/ModernHeader'
import AuthRefreshListener from "@/lib/AuthRefreshListener";//ModernHeader
import {crawlmetadata} from "@/lib/mdxSAs/crawlmetadata"
import { ToasterClient } from '@/components/client/ToasterClient'
//import {GlobalJobMonitor } from "@/lib/hooks/GlobalJobMonitor"
import { ClientShell } from './client-shell'
import { CookieConsentProvider } from '@/components/policies/CookieConsentProvider'
import { CookieBanner } from '@/components/policies/CookieBanner'
import {ShareButton} from '@/components/client/ShareButton'
import {scriptlayout} from './scriptlayout'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',     // <-- ensure text is visible immediately
})

export async function generateMetadata() {

  return await crawlmetadata("root")
}

export const themeColor = [
  { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
];

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  //userScalable: true,
};

export default function RootLayout({
  modalPopUp,
  UserAuthMenu,
  children,
}: {
  modalPopUp: React.ReactNode
  UserAuthMenu: React.ReactNode
  children: React.ReactNode
}) {
  const nameApp=process.env.TCV_APP_NAME_HEADER
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Structured data & analytics scripts for SEO */}
        {scriptlayout()}
        {/* Theme color meta tags (optional) */}
        {themeColor.map(({ media, color }) => (
          <meta key={media} name="theme-color" media={media} content={color} />
        ))}
        {/* Viewport meta tag (optional override) */}
        <meta 
            name="viewport" 
            content={`width=${viewport.width}, 
                      initial-scale=${viewport.initialScale}, 
                      maximum-scale=${viewport.maximumScale}`}
         />
      </head>
      <body className={cn('min-h-screen antialiased bg-background text-foreground', inter.className)}>        
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <CookieConsentProvider>
              <ToasterClient /> {/* ✅ Here */}
              <AuthRefreshListener/>    
              <ClientShell/>      
              <ModernHeader nameApp={nameApp!} />
              <ShareButton />
              {modalPopUp}          
              {children}            
              <AnimatedFooterSection nameApp={nameApp!}/>
              <CookieBanner />
              <footer className="border-t py-6 px-4 text-center text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-black">
                &copy; {new Date().getFullYear()} {nameApp}. All rights reserved.
              </footer>
          </CookieConsentProvider>          
        </ThemeProvider>
      </body>
    </html>
  )
}