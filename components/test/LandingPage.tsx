"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { ModeToggle } from "@/components/client/mode-toggle"
import { Menu } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b">
        <h1 className="text-xl font-bold">My Amplify App</h1>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/dashboard">
            <Button>Dashboard</Button>
          </Link>
          <ModeToggle />
        </div>

        {/* Mobile menu */}
        <div className="md:hidden flex items-center gap-2">
          <ModeToggle />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="space-y-4 p-6">
              <Link href="/sign-in">
                <Button className="w-full" variant="ghost">Sign In</Button>
              </Link>
              <Link href="/dashboard">
                <Button className="w-full">Dashboard</Button>
              </Link>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-grow px-6 py-20 flex flex-col items-center justify-center text-center relative">
        {/* SVG Illustration */}
        <div className="absolute top-0 left-0 w-full overflow-hidden pointer-events-none">
          <svg
            className="w-full h-64 opacity-20 dark:opacity-30"
            viewBox="0 0 1440 320"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill="currentColor"
              d="M0,192L60,192C120,192,240,192,360,186.7C480,181,600,171,720,176C840,181,960,203,1080,202.7C1200,203,1320,181,1380,170.7L1440,160V320H1380C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320H0Z"
            />
          </svg>
        </div>

        <motion.h2
          className="text-4xl md:text-5xl font-bold tracking-tight mb-4 z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Build Fast. Deploy Smart.
        </motion.h2>

        <motion.p
          className="text-lg text-muted-foreground max-w-xl mb-8 z-10"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          Kickstart your app with Amplify Gen 2, shadcn/ui, and a modern dev workflow.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          <Link href="/get-started">
            <Button size="lg">Get Started</Button>
          </Link>
        </motion.div>
      </main>

      {/* Features */}
      <section className="px-6 py-12 bg-muted grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: "Auth", desc: "Amplify Gen 2 + Cognito, pre-wired for App Router." },
          { title: "Storage", desc: "Secure file uploads with S3, private or public access." },
          { title: "AI-Ready", desc: "Easily connect to Bedrock, SageMaker, or Polly." },
        ].map((feat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
            viewport={{ once: true }}
          >
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground">{feat.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} My Amplify App
      </footer>
    </div>
  )
}