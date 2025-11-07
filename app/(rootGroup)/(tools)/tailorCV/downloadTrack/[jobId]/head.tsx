// app/head.tsx (root or specific route head)
'use server'

//import { Metadata } from 'next'
import { cookies } from 'next/headers'

interface HeadProps {
  params?: Record<string, string>
  searchParams?: Record<string, string | string[]>
}

export default async function Head({ params, searchParams }: HeadProps) {
  // Dynamic username from query/string
  const username = typeof searchParams?.username === 'string'
    ? searchParams.username
    : 'Guest'

  const pageTitle = `Success – ${username} | ResumeGenAI`
  const pageDescription = `User ${username} completed a task successfully.`

  // Read download data from cookies
  const cookieStore = await cookies()
  const signedUrl = cookieStore.get('SIGNED_URL_KEY')?.value ?? ''
  const fileName = cookieStore.get('FILE_NAME_KEY')?.value ?? ''

  // Structured Data payloads
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "ResumeGenAI",
    "description": "AI-powered resume tailoring tool for job seekers.",
    "url": process.env.TCV_BASE_DOMAIN,
    "logo": "https://resumegenai.com/logo.png",
    "brand": { "@type": "Brand", "name": "ResumeGenAI" }
  }

  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "ResumeGenAI",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "All",
    "description": "AI-powered resume tailoring tool",
    "url": process.env.TCV_SUBDOMAIN_TOOL_CV,
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }
  }

  // DataDownload structured data only if cookies present
  const dataDownloadJsonLd = fileName && signedUrl ? {
    "@context": "https://schema.org",
    "@type": "DataDownload",
    name: fileName,
    contentUrl: signedUrl,
    encodingFormat: fileName.endsWith('.pdf') ? 'application/pdf' : undefined,
    dateCreated: new Date().toISOString().split('T')[0],
  } : null

  return (
    <>
      {/* Dynamic Metadata */}

      {/* Product Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />

      {/* SoftwareApplication Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />

      {/* DataDownload Structured Data (download track) */}
      {dataDownloadJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(dataDownloadJsonLd) }}
        />
      )}
    </>
  )
}
/*
export const metadata: Metadata = {
  alternates: { canonical: 'https://resumegenai.com' },
}
*/
