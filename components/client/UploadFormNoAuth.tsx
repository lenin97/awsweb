'use client' // At the top
import { useState } from 'react'


function UploadForm01({ onSubmit }: { onSubmit: (filePath: string | null, jobDesc: string) => void }) {
  const [filePath, setFilePath] = useState<string | null>(null)
  const [jobDesc, setJobDesc] = useState('')

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(filePath, jobDesc) // Call the parent's handler
  }

  return (
    <form onSubmit={handleFormSubmit}>
      <input
        type="file"
        onChange={(e) => setFilePath(e.target.files?.[0]?.name ?? null)}
      />
      <input
        type="text"
        value={jobDesc}
        onChange={(e) => setJobDesc(e.target.value)}
      />
      <button type="submit">Submit</button>
    </form>
  )
}

