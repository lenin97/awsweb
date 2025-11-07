import React from 'react';
import Link from 'next/link';
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

export const metadata = {
  title: `Privacy Policy | ${TCV_APP_NAME_HEADER}`,
  description: `Privacy Policy for ${TCV_APP_NAME_HEADER}: How we collect, use, retain, and protect information when customizing CVs.`,
  robots: { index: true, follow: true },
};

const nameApp = TCV_APP_NAME_HEADER;

const PrivacyPolicyPage: React.FC = () => (
  <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 transition-colors duration-300">
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
      <header className="bg-gradient-to-r from-indigo-500 to-indigo-400 dark:from-indigo-700 dark:to-indigo-600 p-6">
        <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
      </header>
      <div className="p-6 space-y-8">
        <section className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            At {nameApp}, we help you customize your CV based on the job specifications you provide. Any personal information
            you enter (including resume details and job criteria) is kept strictly private and will <span className="font-semibold">never</span> be sold to advertisers.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">1. Information We Collect</h2>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
            <li>Personal and professional details you input for CV customization.</li>
            <li>Automatically collected technical data (IP address, browser type) via server logs.</li>
            <li>Non-personal usage data (pages viewed, session duration).</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">2. How We Use Your Data</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We use your data solely to generate and improve your customized CV. Technical and usage data help us optimize
            performance and user experience. We do not share or sell your information to advertisers or other entities.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">3. Third‑Party Services</h2>
          <p className="text-gray-700 dark:text-gray-300">
            In the future, we may integrate analytics or advertising services (for example Google Analytics 4 or AdSense) to
            understand site usage and support the project. These services may set cookies and collect data as per their
            policies; we will provide choices via a cookie banner before enabling them.
          </p>
          <ul className="list-disc list-inside text-gray-700 dark:text-gray-300">
            <li>
              <a href="https://www.google.com/analytics/policies/" className="text-indigo-500 dark:text-indigo-400 hover:underline">
                Google Analytics Policies
              </a>
            </li>
            <li>
              <a href="https://support.google.com/adsense/answer/1348695" className="text-indigo-500 dark:text-indigo-400 hover:underline">
                Google AdSense Data Practices
              </a>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">4. Your Choices & Rights</h2>
          <p className="text-gray-700 dark:text-gray-300">
            You can request access, correction, or deletion of your personal data anytime by contacting us at{' '}
            <a href={`mailto:${TCV_EMAIL_CONTACT}`} className="text-indigo-500 dark:text-indigo-400 underline">{TCV_EMAIL_CONTACT}</a>.
            When analytics or advertising are activated, you will have control via our cookie banner and can opt out through the
            providers&#39; controls.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">5. Data Retention & Security</h2>
          <p className="text-gray-700 dark:text-gray-300">
            We retain user-uploaded content only for a short, defined period strictly necessary to provide the service. All
            uploaded CV content and job specifications are <strong>automatically deleted from our servers within 24 hours</strong> of upload.
          </p>

          <p className="text-gray-700 dark:text-gray-300">
            During the short retention window, uploaded data is protected with industry standard safeguards (encrypted in transit
            and at rest) and is not shared with third parties. Access to uploads is restricted to automated processing systems.
            Human access is blocked by default and only allowed in exceptional cases (for example, to investigate a technical issue);
            any such access is strictly controlled, audited, and logged.
          </p>

          <p className="text-gray-700 dark:text-gray-300">
            If you need immediate deletion before the 24-hour window elapses, contact us at{' '}
            <a href={`mailto:${TCV_EMAIL_CONTACT}`} className="text-indigo-500 dark:text-indigo-400 underline">{TCV_EMAIL_CONTACT}</a> and we will process your request as promptly as possible.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">6. Policy Updates</h2>
          <p className="text-gray-700 dark:text-gray-300">
            This policy is effective as of August 12, 2025. We may update it to reflect changes in legal requirements or service features;
            the updated version will indicate the new effective date.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">7. Related Documents</h2>
          <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
            <li>
              <Link href={TCV_SUBDOMAIN_COOKIE_POLICY} className="text-indigo-500 dark:text-indigo-400 hover:underline">Cookie Policy</Link>
            </li>
            <li>
              <Link href={TCV_SUBDOMAIN_TERMS_OF_USE} className="text-indigo-500 dark:text-indigo-400 hover:underline">Terms of Use</Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </main>
);

export default PrivacyPolicyPage;
