'use client'

import Link from 'next/link'

export default function ResumeGenAiLandingPage() {
  return (
    <>
      <head>
        <title>AI‑Powered CV Customization Tool | ResumeGenAI</title>
        <meta name="description" content="Customize your CV with AI‑driven insights and job‑specific keywords in seconds. Optimize format, layout, and content for any role." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://resumegenai.com/" />
        <meta name="robots" content="index, follow" />
      </head>

      <header>
        <h1>ResumeGenAI</h1>
        <nav>
          <ul>
            <li><Link href="/">Home</Link></li>
            <li><Link href="/features">Features</Link></li>
            <li><Link href="/pricing">Pricing</Link></li>
            <li><Link href="/blog">Blog</Link></li>
            <li><Link href="/about">About</Link></li>
          </ul>
        </nav>
      </header>

      <main>
        <article>
          <h1>Customize Your CV with AI‑Driven Precision</h1>

          <section>
            <h2>How It Works</h2>
            <p>Upload your existing CV and enter the job description—our AI analyzes both to highlight your most relevant skills, tailor your experience, and optimize keyword usage for ATS compliance.</p>
          </section>

          <section>
            <h2>Key Benefits</h2>
            <ul>
              <li>Instant AI‑powered keyword optimization</li>
              <li>Smart formatting and layout suggestions</li>
              <li>Built‑in templates for any industry</li>
              <li>Export to PDF or DOCX in one click</li>
            </ul>
          </section>

          <aside>
            <h3>Related Resources</h3>
            <ul>
              <li><Link href="/blog/resume-writing-tips">Top Resume Writing Tips</Link></li>
              <li><Link href="/blog/ai-recruiter-trends">AI Trends in Recruitment</Link></li>
            </ul>
          </aside>
        </article>
      </main>

      <footer>
        <p>&copy; 2025 ResumeGenAI Inc.</p>
        <nav>
          <Link href="/privacy">Privacy Policy</Link> | <Link href="/terms">Terms of Service</Link>
        </nav>
      </footer>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "url": "https://resumegenai.com/",
        "name": "AI‑Powered CV Customization Tool | ResumeGenAI",
        "description": "Customize your CV with AI‑driven insights and job‑specific keywords in seconds. Optimize format, layout, and content for any role."
      }) }} />
    </>
  )
}
