// app/contact/page.tsx

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
  title: 'Contact | ResumeGenAI',
  description: 'Contact ResumeGenAI for support, feedback, or inquiries about our free CV tailoring tool.',
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  const nameApp=process.env.TCV_APP_NAME_HEADER
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 transition-colors duration-300">
      <article className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contact Us</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">We’re here to help. Reach out with questions or feedback.</p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Get in Touch</h2>
          <p className="text-gray-700 dark:text-gray-300">
            For support, feedback, or general inquiries, email us at{' '}
            <a href={`mailto:${TCV_EMAIL_CONTACT}`} className="text-indigo-500 hover:underline">
              {TCV_EMAIL_CONTACT}
            </a>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Feedback & Improvements</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We continuously improve our tool based on user feedback. Let us know any issues or suggestions, and we’ll work to enhance your experience.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Related Links</h2>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
            <li><a href="/privacy-policy" className="text-indigo-500 hover:underline">Privacy Policy</a></li>
            <li><a href="/cookie-policy" className="text-indigo-500 hover:underline">Cookie Policy</a></li>
            <li><a href="/terms-of-use" className="text-indigo-500 hover:underline">Terms of Use</a></li>
          </ul>
        </section>

        <footer className="text-sm text-gray-500 dark:text-gray-400">
          <p>&copy; {new Date().getFullYear()} ResumeGenAI. All rights reserved.</p>
        </footer>
      </article>
    </main>
  );
}
