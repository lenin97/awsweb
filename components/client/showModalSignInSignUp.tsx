'use client'

import Link from 'next/link'
import { FC } from 'react'

interface AuthModalProps {
  showModal: boolean
  signInHref: string
  signUpHref: string
}

const AuthModal: FC<AuthModalProps> = ({ showModal, signInHref, signUpHref }) => {
  if (!showModal) return null

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white text-black p-6 rounded-xl shadow-lg w-80 text-center">
        <p className="mb-4 font-semibold">⚠️ Please sign in or sign up to continue.</p>
        <div className="flex justify-between space-x-4">
          <Link
            href={signInHref}
            className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
          >
            Sign In
          </Link>
          <Link
            href={signUpHref}
            className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}

export default AuthModal

/* 
<AuthModal
  showModal={!userIsAuthenticated}
  signInHref="/auth/sign-in"
  signUpHref="/auth/sign-up"
/>

'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function UploadForm() {
  const [filePath, setFilePath] = useState<string | null>(null)
  const [jobDesc, setJobDesc] = useState('')
  const [showModal, setShowModal] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowModal(true) // Trigger modal instead of error message
    console.log('File selected:', filePath)
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="p-4 bg-white/10 backdrop-blur-md rounded-xl text-white">
        <input
          type="text"
          placeholder="Job Description"
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
          className="block w-full mb-4 p-2 bg-transparent border border-white/30 rounded"
        />
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFilePath(e.target.files?.[0]?.name ?? null)}
          className="block w-full mb-4"
        />
        <button
          type="submit"
          className="w-full bg-white/20 py-2 rounded hover:bg-white/30"
        >
          Submit
        </button>
      </form>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white text-black p-6 rounded-xl shadow-lg w-80 text-center">
            <p className="mb-4 font-semibold">⚠️ Please sign in or sign up to continue.</p>
            <div className="flex justify-between space-x-4">
              <Link
                href="/auth/sign-in"
                className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-center"
              >
                Sign In
              </Link>
              <Link
                href="/auth/sign-up"
                className="flex-1 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-center"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

*/