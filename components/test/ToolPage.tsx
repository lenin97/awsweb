import { Metadata } from "next"
import Script from "next/script"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Tailor Your Resume with AI – ResumeGenAI Tool",
  description: "Use our free AI-powered tool to instantly tailor your resume to any job description. No signup required.",
  alternates: {
    canonical: "https://resumegenai.com/tool"
  },
  openGraph: {
    title: "Tailor Your Resume with AI",
    description: "Get job-specific resume versions in seconds.",
    url: "https://resumegenai.com/tool",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Tailor Your Resume with AI",
    description: "No signup, no hassle. Just fast, AI-powered resumes.",
    images: ["/og-image-tool.png"]
  }
}

export default function ToolPage() {
  return (
    <main className="min-h-screen px-4 py-12 max-w-4xl mx-auto text-gray-900 dark:text-white">
      <h1 className="text-3xl sm:text-4xl font-bold mb-4">Tailor Your Resume with AI</h1>
      <p className="text-lg mb-6 text-gray-600 dark:text-gray-300">
        Enter your resume and job description. Our AI will instantly rewrite your resume to match the job posting.
      </p>

      <form className="space-y-4" aria-label="Resume Tailoring Form">
        <div>
          <label htmlFor="resume" className="block font-medium mb-1">Your Resume</label>
          <textarea id="resume" name="resume" required rows={6} className="w-full border rounded p-3" />
        </div>

        <div>
          <label htmlFor="job" className="block font-medium mb-1">Job Description</label>
          <textarea id="job" name="job" required rows={6} className="w-full border rounded p-3" />
        </div>

        <Button type="submit">Tailor My Resume</Button>
      </form>

      <Script
        type="application/ld+json"
        id="structured-data"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "ResumeGenAI",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "All",
            "description": "AI-powered resume tailoring tool",
            "url": "https://resumegenai.com/tool",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            }
          })
        }}
      />
    </main>
  )
}
