// app/terms-of-use/page.tsx

import type { Metadata } from 'next';
import React from 'react';
import {
  TCV_APP_NAME_HEADER,
  TCV_EMAIL_CONTACT,
  TCV_X_PROFILE,
  TCV_X_AT,
  TCV_LINKEDIN_PROFILE,
  TCV_TIKTOK_PROFILE,
  TCV_INST_PROFILE,
  TCV_SUBDOMAIN_ABOUT,
  TCV_SUBDOMAIN_PRIVACY_POLICY,
  TCV_SUBDOMAIN_COOKIE_POLICY,
  TCV_SUBDOMAIN_TERMS_OF_USE,
} from '@/lib/env.server'

export const metadata: Metadata = {
  title: 'Terms of Use | {nameApp}',
  description: 'Terms of Use for {nameApp}, our CV customization tool. Please read carefully before using the service.',
  robots: { index: true, follow: true },
};

export default function TermsOfUsePage() {
  const nameApp=process.env.TCV_APP_NAME_HEADER
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 transition-colors duration-300">
      <article className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Terms of Use</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">Last updated: July 26, 2025</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">1. Introduction</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Welcome to {nameApp}. By accessing or using our service, you agree to these Terms of Use. If you do not agree, please do not use the tool.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">2. Service Description</h2>
          <p className="text-gray-700 dark:text-gray-300">
            {nameApp} helps you generate and customize your CV based on the job specifications you provide. This is an automated tool designed to assist—you are responsible for reviewing and confirming that the final output meets your expectations.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">3. Privacy & Data</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We respect your privacy. Any personal information and CV details you submit are kept private and will never be sold or shared with third parties. For more information, see our <a href="/privacy-policy" className="text-indigo-500 hover:underline">Privacy Policy</a> and <a href="/cookie-policy" className="text-indigo-500 hover:underline">Cookie Policy</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">4. Accuracy & Disclaimer</h2>
          <p className="text-gray-700 dark:text-gray-300">
            {nameApp} is continuously improving, but it may not be 100% accurate. You should verify all generated content and ensure it aligns with your requirements before use. We disclaim any liability for errors or omissions in the output.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">5. Analytics & Advertising</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We plan to use Google Analytics and AdSense in the future. These services may set cookies and collect data according to their policies. Your consent will be requested via our cookie banner. See our <a href="/cookie-policy" className="text-indigo-500 hover:underline">Cookie Policy</a> for details.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">6. Changes to Terms</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We may update these terms at any time. The &quot;Last updated&quot; date at the top will reflect changes. Continued use of the service constitutes acceptance of the revised terms.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">7. Contact Us</h2>
          <p className="text-gray-700 dark:text-gray-300">
            If you have any questions about these Terms, please contact us at <a href={`mailto:${TCV_EMAIL_CONTACT}`} className="text-indigo-500 hover:underline">{TCV_EMAIL_CONTACT}</a>.
          </p>
        </section>
      </article>
    </main>
  );
}
