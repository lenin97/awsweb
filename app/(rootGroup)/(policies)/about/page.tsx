import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import {
  TCV_APP_NAME_HEADER,
  TCV_EMAIL_CONTACT,
  TCV_X_PROFILE,
  TCV_LINKEDIN_PROFILE,
  TCV_TIKTOK_PROFILE,
  TCV_INST_PROFILE,
  TCV_SUBDOMAIN_PRIVACY_POLICY,
  TCV_SUBDOMAIN_COOKIE_POLICY,
  TCV_SUBDOMAIN_TERMS_OF_USE,
} from '@/lib/env.server'

export const metadata: Metadata = {
  title: `About ${TCV_APP_NAME_HEADER}`,
  description: `Learn about ${TCV_APP_NAME_HEADER}, our free, no-signup CV tailoring tool and our commitment to privacy, accessibility, and continuous improvement.`,
  robots: { index: true, follow: true },
};

export default function AboutPage() {
  const nameApp = TCV_APP_NAME_HEADER;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 transition-colors duration-300">
      <article className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 space-y-8">
        {/* -- About content -- */}
        <header>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">About {nameApp}</h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            A free, no-signup tool to tailor your CV to any job specification.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Our Mission</h2>
          <p className="text-gray-700 dark:text-gray-300">
            At {nameApp}, we believe every professional deserves a CV that
            perfectly matches the job they want. Our mission is to simplify
            the job search process by providing an intuitive, AI-powered tool
            that tailors your curriculum vitae according to the exact job
            description you provide—no signup required.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">How It Works</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Simply upload your existing resume details and the job
            specifications into our interface. Our system uses advanced
            language models to reshape, reorder, and highlight key
            experiences, ensuring your CV speaks directly to the employer’s
            needs. All processing happens securely in the browser or on our
            servers—your data stays private.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Privacy & Security</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We respect your privacy. No account is required, and we do not
            sell or share your personal information. For full details, please
            see our{' '}
            <Link href={TCV_SUBDOMAIN_PRIVACY_POLICY} className="text-indigo-500 hover:underline">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link href={TCV_SUBDOMAIN_COOKIE_POLICY} className="text-indigo-500 hover:underline">
              Cookie Policy
            </Link>
            .
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Continuous Improvement</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Our tool is constantly evolving. We monitor feedback and analytics
            (with your consent) to enhance accuracy, add new features, and
            ensure the output remains relevant. However, since no AI tool is
            perfect, we recommend reviewing each tailored CV to confirm it
            meets your expectations.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Get Started</h2>
          <p className="text-gray-700 dark:text-gray-300">
            Ready to craft your ideal CV?{' '}
            <Link href="/tailorCV/home" className="text-indigo-500 hover:underline">Go back to the tool</Link>{' '}
            and begin tailoring your resume today—no registration or payment
            required.
          </p>
        </section>

        {/* -- Embedded Contact Section for SEO & accessibility -- */}
        <section id="about-contact" className="space-y-4 border-t pt-6">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Contact & Transparency</h2>

          <p className="text-gray-700 dark:text-gray-300">
            {`${nameApp} is a remotely-operated service maintained by a small distributed team. We aim to provide clear, timely support and respect your privacy.`}
          </p>

          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
            <li>
              <strong>Email:</strong>{' '}
              <a href={`mailto:${TCV_EMAIL_CONTACT}`} className="text-indigo-500 hover:underline">
                {TCV_EMAIL_CONTACT}
              </a>
            </li>

            <li>
              <strong>Support / Response time:</strong> We aim to reply within 48 hours on weekdays.
            </li>

            <li>
              <strong>Hosting:</strong> Hosted on Amazon Web Services (London region) for performance and compliance.
            </li>

            <li>
              <strong>Legal & Policies:</strong> For legal notices or if a physical registered address is required, we publish details in our <Link href={TCV_SUBDOMAIN_TERMS_OF_USE} className="text-indigo-500 hover:underline">Terms</Link> or a dedicated Legal page.
            </li>

            <li>
              <strong>Social:</strong>{' '}
              {TCV_X_PROFILE && <a href={TCV_X_PROFILE} className="hover:underline">X</a>}{' '}
              {TCV_LINKEDIN_PROFILE && (
                <>
                  , <a href={TCV_LINKEDIN_PROFILE} className="hover:underline">LinkedIn</a>
                </>
              )}
              {TCV_INST_PROFILE && (
                <>, <a href={TCV_INST_PROFILE} className="hover:underline">Instagram</a></>
              )}
              {TCV_TIKTOK_PROFILE && (
                <>, <a href={TCV_TIKTOK_PROFILE} className="hover:underline">TikTok</a></>
              )}
            </li>
          </ul>

          <p className="text-gray-700 dark:text-gray-300">
            Or visit our full <Link href="/contact" className="text-indigo-500 hover:underline">Contact page</Link> for additional options, including a support form and reporting channels.
          </p>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Accessibility: Our site follows standard accessibility practices (semantic HTML, proper labels, and keyboard support). If you encounter issues, please let us know at the email above.
          </p>
        </section>

        <footer className="text-sm text-gray-500 dark:text-gray-400 pt-6 border-t">
          <p>&copy; {new Date().getFullYear()} {nameApp}. All rights reserved.</p>
        </footer>
      </article>
    </main>
  );
}
