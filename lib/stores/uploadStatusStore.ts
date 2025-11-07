// lib/stores/uploadStatusStore.ts
//'use client'
import { create } from 'zustand'
import { uploadData } from 'aws-amplify/storage'
import { useProgressStore } from '@/lib/stores/progressStore'

/**
 * Zustand store for managing file upload and triggering progress tracking.
 * Embeds upload logic (start/cancel) and exposes reactive state.
 */

//console.log('[UploadStatusState.ts] INIT store instance', Math.random()) // ✅ put this here

type StatusType = 'idle' | 'reading' | 'uploading' | 'success' | 'error'

interface UploadStatusState {
  // State
  status: StatusType
  hasStarted: boolean
  fromHome: boolean
  toastId: string
  isUploadPageActive: boolean
  isJobFinishedInMain: boolean
  isCalledRoute: boolean

  // Actions
  startUpload: (payload: { file: File; metadata: Record<string, unknown> }) => Promise<void>
  cancelUpload: () => void
  setFromHome: (val: boolean) => void
  setisCalledRoute: (val: boolean) => void
  reset: () => void
}

export const useUploadStatusStore = create<UploadStatusState>((set, get) => {
  let abortController: AbortController | null = null

  return {
    // initial state
    status: 'idle',
    hasStarted: false,
    fromHome: false,
    isCalledRoute: false,
    toastId: 'upload-progress',
    isUploadPageActive: true,
    isJobFinishedInMain: false,

    // start file upload and initiate progress monitoring
    startUpload: async ({ file, metadata }) => {
      const state = get()
      if (state.hasStarted) return
      set({ hasStarted: true, isUploadPageActive: true, status: 'reading' })

      try {
        abortController = new AbortController()
        const signal = abortController.signal

        // request signed URL
        const resp = await fetch('/api/get-signed-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: `tools/tailorcv/${file.name}`,
            fileType: file.type,
            ...metadata,
          }),
          signal,
        })
        const json = await resp.json()
        if (!resp.ok || !json?.id_un || !json?.int_path) {
          throw new Error(json?.error || 'Upload init failed')
        }

        // upload file
        set({ status: 'uploading' })
        await uploadData({ 
          path: json.int_path, 
          data: file, 
          options: { 
            contentType: file.type,
            metadata: {
              jobid: json.id_un
            }
          } 
        })

        // success: trigger progress tracking
        
        console.log('[uploadStatusStore]::id_un::',json.id_un)
        useProgressStore.getState().setIdUn(json.id_un)
        set({ status: 'success' })
        //setTimeout(() => set({ isJobFinishedInMain: true }), 4000)
        //useProgressStore.getState().start(json.id_un)
      } catch (err) {
        console.error('[uploadStatusStore] upload error', err)
        set({ status: 'error' })
      } finally {
        abortController = null
        // optional cleanup: mark finished after delay
        //setTimeout(() => set({ isJobFinishedInMain: true }), 4000)
      }
    },

    // cancel ongoing upload
    cancelUpload: () => {
      if (abortController) {
        abortController.abort()
        abortController = null
        console.log('[uploadStatusStore] upload cancelled')
        set({ status: 'idle', hasStarted: false })
      }
    },

    setFromHome: (val) => set({ fromHome: val }),

    setisCalledRoute:(val) => set({ isCalledRoute: val }),

    reset: () => {
      if (abortController) {
        abortController.abort()
        abortController = null
      }
      set({
        status: 'idle',
        hasStarted: false,
        fromHome: false,
        isUploadPageActive: true,
        isJobFinishedInMain: false,
        isCalledRoute:false,
      })
    },
  }
})
