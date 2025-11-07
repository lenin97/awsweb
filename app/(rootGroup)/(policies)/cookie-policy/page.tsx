// app/cookie-policy/page.tsx

import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Cookie Policy | YourSite',
  description: 'Cookie Policy for YourSite: Types of cookies we use and how you can manage them.',
  robots: { index: true, follow: true },
};

const nameApp=process.env.TCV_APP_NAME_HEADER

const CookiePolicyPage: React.FC = () => (

  <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4 transition-colors duration-300">
    <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
      <header className="bg-gradient-to-r from-indigo-500 to-indigo-400 dark:from-indigo-700 dark:to-indigo-600 p-6">
        <h1 className="text-4xl font-bold text-white">Cookie Policy</h1>
      </header>
      <div className="p-6 space-y-8">
        <section className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Cookies are small text files stored on your device when you visit a website. They help us recognize you on return visits,
            remember your preferences, and (with your consent) collect analytics and serve personalized ads.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">1. Types of Cookies We Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 shadow-sm">
              <h3 className="font-medium text-gray-800 dark:text-gray-100">Essential</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Enable core functionality (navigation, security). Always active.</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 shadow-sm">
              <h3 className="font-medium text-gray-800 dark:text-gray-100">Analytics</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Track site usage and performance via Google Analytics&nbsp;4 (<code className="text-xs">_ga</code>, <code className="text-xs">_gid</code>).   
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 shadow-sm">
              <h3 className="font-medium text-gray-800 dark:text-gray-100">Advertising</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Serve and personalize ads via Google AdSense (<code className="text-xs">IDE</code>, <code className="text-xs">DSID</code>).
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">2. Consent and Control</h2>
          <p className="text-gray-700 dark:text-gray-300">
            No Analytics or Advertising cookies will run until you click <span className="font-semibold">“Accept”</span> in our consent banner.
            You can withdraw or modify your consent at any time via the banner’s <span className="italic">“Customize”</span> button,
            or by adjusting your browser settings.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">3. Managing Cookies</h2>
          <p className="text-gray-700 dark:text-gray-300">
            You can manage or delete cookies in your browser’s settings (usually under Privacy or Site Settings).
            For more information, visit <a href="https://aboutcookies.org" className="text-indigo-500 dark:text-indigo-400 underline">
              aboutcookies.org
            </a>.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">4. Related Policies</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <Link href="/privacy-policy" className="text-indigo-500 dark:text-indigo-400 hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms-of-use" className="text-indigo-500 dark:text-indigo-400 hover:underline">
                Terms of Use
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </main>
);

export default CookiePolicyPage;
