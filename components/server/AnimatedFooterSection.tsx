// File: components/AnimatedFooterSection.tsx
import MotionSection from '../client/MotionSection'
import Link from 'next/link'
import { iconLink } from '../client/iconLink'
import { TikTokIcon } from '../icons/TikTokIcon'
import { InstagramIcon } from '../icons/InstagramIcon'
import { XIcon } from '../icons/XIcon'
import { LinkedinIcon } from '../icons/LinkedinIcon'
import { Info, Mail } from 'lucide-react'

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

interface AnimatedFooterSectionProps {
  /**
   * Application name, used in branding and links
   */
  nameApp?: string
}

export default function AnimatedFooterSection({
  nameApp = TCV_APP_NAME_HEADER,
}: AnimatedFooterSectionProps) {
  const nameappsocials = nameApp.toLowerCase().replace(/\s+/g, '')

  return (
    <MotionSection>
      <footer
        aria-label="Site footer"
        className="bg-gray-100 dark:bg-gray-900 py-8 px-4 transition-colors duration-300"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {/* About */}
          <section aria-labelledby="footer-about" className="space-y-2">
            <h3 id="footer-about" className="flex items-center space-x-2 text-lg font-semibold">
              <Info className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <Link href={TCV_SUBDOMAIN_ABOUT} className="hover:underline">
                About
              </Link>
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {nameApp} is a free, no-signup tool powered by AI to help you tailor your CV to any job
              specification, empowering professionals to present their best selves.
            </p>
            <Link
              href={TCV_SUBDOMAIN_ABOUT}
              className="inline-block px-4 py-1 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-transform transform hover:scale-105"
              aria-label={`Learn more about ${nameApp}`}
            >
              Learn more
            </Link>
          </section>

          {/* Contact */}
          <section aria-labelledby="footer-contact" className="space-y-2">
            <h3 id="footer-contact" className="flex items-center space-x-2 text-lg font-semibold">
              <Mail className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <Link href="/contact" className="hover:underline">
                Contact
              </Link>
            </h3>
            <address className="not-italic text-gray-600 dark:text-gray-300 text-sm space-y-1">
              <div>
                <a
                  href={`mailto:${TCV_EMAIL_CONTACT}`}
                  className="underline hover:text-gray-800 dark:hover:text-gray-100"
                >
                  {TCV_EMAIL_CONTACT}
                </a>
              </div>
              <div>
                <a
                  href={TCV_X_PROFILE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-800 dark:hover:text-gray-100"
                  aria-label={`Follow ${nameApp} on X`}
                >
                  {TCV_X_AT}
                </a>
              </div>
              <div>Remote-first 🌍</div>
            </address>
            <Link
              href="/contact"
              className="inline-block px-4 py-1 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-transform transform hover:scale-105"
              aria-label="Send us a message"
            >
              Send us a message
            </Link>
          </section>

          {/* Legal */}
          <nav aria-labelledby="footer-legal">
            <h3
              id="footer-legal"
              className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2"
            >
              Legal
            </h3>
            <ul className="text-gray-600 dark:text-gray-300 text-sm space-y-1">
              <li>
                <Link href={TCV_SUBDOMAIN_PRIVACY_POLICY} className="underline hover:text-gray-800 dark:hover:text-gray-100">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href={TCV_SUBDOMAIN_COOKIE_POLICY} className="underline hover:text-gray-800 dark:hover:text-gray-100">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href={TCV_SUBDOMAIN_TERMS_OF_USE} className="underline hover:text-gray-800 dark:hover:text-gray-100">
                  Terms of Use
                </Link>
              </li>
            </ul>
          </nav>

          {/* Social */}
          <section aria-labelledby="footer-social">
            <h3
              id="footer-social"
              className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2"
            >
              Follow Us
            </h3>
            <div className="flex space-x-4">
              {iconLink(TCV_X_PROFILE, `Follow us on X`, XIcon)}
              {iconLink(TCV_LINKEDIN_PROFILE, `Follow us on LinkedIn`, LinkedinIcon)}
              {iconLink(TCV_TIKTOK_PROFILE, `Follow us on TikTok`, TikTokIcon)}
              {iconLink(TCV_INST_PROFILE, `Follow us on Instagram`, InstagramIcon)}
            </div>
          </section>
        </div>
      </footer>
    </MotionSection>
  )
}
