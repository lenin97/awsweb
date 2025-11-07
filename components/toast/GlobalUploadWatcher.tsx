// app/layout.tsx or a toast/notification component
import { useUploadStatusStore } from '@/lib/stores/uploadStatusStore'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'

export function GlobalUploadWatcher() {
  const { status } = useUploadStatusStore()

  useEffect(() => {
    if (status === 'uploading') {
      toast.loading('Uploading your file...')
    } else if (status === 'success') {
      toast.success('Upload successful!')
    } else if (status === 'error') {
      toast.error('Upload failed!')
    }
  }, [status])

  return null
}
