// components/CookieConsentProvider.tsx

'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ConsentOptions {
  analytics: boolean;
  ads: boolean;
}

interface ConsentContextProps {
  consent: ConsentOptions | null;
  acceptAll: () => void;
  rejectAll: () => void;
  customize: (options: ConsentOptions) => void;
}

const ConsentContext = createContext<ConsentContextProps | undefined>(undefined);

export const useConsent = () => {
  const ctx = useContext(ConsentContext);
  if (!ctx) throw new Error('useConsent must be used within a CookieConsentProvider');
  return ctx;
};

export interface CookieConsentProviderProps {
  children: React.ReactNode;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Function to update Google Consent Mode
function updateGoogleConsent({ analytics, ads }: ConsentOptions) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      ad_storage: ads ? 'granted' : 'denied',
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_user_data: ads ? 'granted' : 'denied',
      ad_personalization: ads ? 'granted' : 'denied'
    });
  }
}

export const CookieConsentProvider= ({
  children,
}: CookieConsentProviderProps) => {
  const [consent, setConsent] = useState<ConsentOptions  | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('site_consent');
    if (saved) {
      const parsed:ConsentOptions = JSON.parse(saved);
      setConsent(parsed);
      updateGoogleConsent(parsed);
    }
  }, []);

  const save = (options: ConsentOptions) => {
    localStorage.setItem('site_consent', JSON.stringify(options));
    setConsent(options);
    updateGoogleConsent(options);
    // TODO: integrate with Google Consent Mode API if needed
  };

  const acceptAll = () => save({ analytics: true, ads: true });
  const rejectAll = () => save({ analytics: false, ads: false });
  const customize = (options: ConsentOptions) => save(options);

  return (
    <ConsentContext.Provider value={{ consent, acceptAll, rejectAll, customize }}>
      {children}
    </ConsentContext.Provider>
  );
};
