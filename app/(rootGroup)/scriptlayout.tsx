// app/head.tsx (App Router)
import type { ReactElement } from 'react'
import { ThemeScript } from '@/scripts/theme-script'
import Script from 'next/script'
import { escapeForJsonLd, sanitizeEnvValue } from '@/lib/utils/sanitizeString'//resolveAbsoluteUrl
import {resolveAbsoluteUrl} from '@/lib/utils/resolveAbsoluteUrl'

import {
  TCV_APP_NAME_HEADER,
  TCV_BASE_DOMAIN,
  TCV_OPENGRAPH_IMG,
  TCV_EMAIL_CONTACT,
  TCV_X_PROFILE,
  TCV_LINKEDIN_PROFILE,
  TCV_INST_PROFILE,
  TCV_TIKTOK_PROFILE,
  TCV_GA_ID,
} from '@/lib/env.server'

export function scriptlayout(): ReactElement {
  //const GA_MEASUREMENT_ID = sanitizeEnvValue(process.env.NEXT_PUBLIC_GA_ID ?? '')
  const nameApp = TCV_APP_NAME_HEADER
  const baseUrl = TCV_BASE_DOMAIN
  const logoRelativeURL = TCV_OPENGRAPH_IMG
  const contactEmail = TCV_EMAIL_CONTACT

  const consentInit = {
    ad_storage: 'denied',
    analytics_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  }

  const logoUrl = resolveAbsoluteUrl(baseUrl, logoRelativeURL)

  const sameAs = [TCV_X_PROFILE, TCV_LINKEDIN_PROFILE, TCV_INST_PROFILE, TCV_TIKTOK_PROFILE].filter(Boolean)

  const orgJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: nameApp,
    url: baseUrl,
    logo: { '@type': 'ImageObject', url: logoUrl },
    contactPoint: {
      '@type': 'ContactPoint',
      email: contactEmail,
      contactType: 'Customer Support',
    },
    sameAs,
  }

  const siteJsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url: baseUrl,
    name: nameApp,
    publisher: {
      '@type': 'Organization',
      name: nameApp,
      logo: { '@type': 'ImageObject', url: logoUrl },
    },
  }

  // Use escapeForJsonLd at the last moment when embedding JSON into the HTML head.
  const orgJsonStr = escapeForJsonLd(JSON.stringify(orgJsonLd))
  const siteJsonStr = escapeForJsonLd(JSON.stringify(siteJsonLd))

  return (
    <>
      <ThemeScript />

      <script id="org-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: orgJsonStr }} />

      <script id="site-schema" type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteJsonStr }} />

      {TCV_GA_ID && <link rel="preconnect" href="https://www.googletagmanager.com" />}

      {TCV_GA_ID && (
        <>
          <Script
            id="gtag-script"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${TCV_GA_ID}`}
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('consent','default',${JSON.stringify(consentInit)});
            gtag('js',new Date());
            gtag('config','${TCV_GA_ID}',{ anonymize_ip: true });`}
          </Script>
        </>
      )}
    </>
  )
}
