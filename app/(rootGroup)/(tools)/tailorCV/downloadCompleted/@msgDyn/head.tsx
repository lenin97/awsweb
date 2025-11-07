// app/tailorCV/congrats/head.tsx
'use server'

//import { Metadata } from 'next'

type HeadProps = {
  params?: { [key: string]: string }
  searchParams?: { [key: string]: string | string[] }
}

export default function Head({ params, searchParams }: HeadProps) {
  // Determine username dynamically from query or fallback
  const username = typeof searchParams?.username === 'string'
    ? searchParams.username
    : 'Guest'

  // Build the HowTo structured data
  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Complete Task Successfully",
    description: `User ${username} completed a task successfully.`,
    step: [
      { "@type": "HowToStep", position: 1, name: "Start the process" },
      { "@type": "HowToStep", position: 2, name: "Execute all required actions" },
      { "@type": "HowToStep", position: 3, name: "Reach the confirmation page" }
    ],
    totalTime: "PT1M",
    tool: { "@type": "SoftwareApplication", name: "YourAppName" },
    dateCreated: new Date().toISOString().split('T')[0]
  }

  return (
    <>
      {/* Page title and description */}

      {/* HowTo JSON-LD for SEO */}
      <script
        key="howto-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
    </>
  )
}


