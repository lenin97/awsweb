// components/CookieBanner.tsx

'use client';
import React, { useState } from 'react';
import { useConsent } from './CookieConsentProvider';

export const CookieBanner: React.FC = () => {
  const { consent, acceptAll, rejectAll, customize } = useConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [analyticsPref, setAnalyticsPref] = useState(false);
  const [adsPref, setAdsPref] = useState(false);

  if (consent !== null) return null; // already chosen

  return (
    <div className="fixed bottom-4 inset-x-4 md:bottom-6 md:inset-x-6 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 space-y-4">
        {!showSettings ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
            <p className="text-gray-700 dark:text-gray-300">
              We use cookies for analytics and personalized ads. By clicking Accept, you consent to our use of cookies.
            </p>
            <div className="flex gap-2">
              <button onClick={acceptAll} className="px-4 py-2 bg-indigo-500 text-white rounded-lg">
                Accept All
              </button>
              <button onClick={rejectAll} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                Reject All
              </button>
              <button onClick={() => setShowSettings(true)} className="px-4 py-2 text-gray-600 dark:text-gray-400">
                Customize
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Cookie Preferences</h2>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={analyticsPref}
                  onChange={e => setAnalyticsPref(e.target.checked)}
                />
                <span className="text-gray-700 dark:text-gray-300">Analytics Cookies</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={adsPref}
                  onChange={e => setAdsPref(e.target.checked)}
                />
                <span className="text-gray-700 dark:text-gray-300">Advertising Cookies</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => customize({ analytics: analyticsPref, ads: adsPref })} className="px-4 py-2 bg-indigo-500 text-white rounded-lg">
                Apply
              </button>
              <button onClick={() => rejectAll()} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                Reject All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
