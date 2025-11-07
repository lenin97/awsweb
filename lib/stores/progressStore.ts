// lib/stores/progressStore.ts
//'use client'
import { create } from 'zustand'
import { getClient } from '@/lib/clientAuth4IAM'

/**
 * Zustand store managing job progress and download readiness.
 * Singleton across routes.
 */
//let hasLoggedInit = false
//console.log('[progressStore.ts] INIT store instance', Math.random()) // ✅ put this here

type ProgressStatus = string | null

interface ProgressState {
  // Data
  jobId: string | null
  idUn: string | null
  step: string
  status: ProgressStatus
  hasStarted: boolean
  isActive: boolean
  continueAsToast: boolean
  nextPath: string | null
  fromUpload:boolean

  // Actions
  setIdUn: (idUn: string) => void
  setcontinueAsToast: (val: boolean) => void
  setfromUpload: (val: boolean) => void
  setnextPath: (val: string) => void
  start: (jobId: string) => void
  stop: () => void
  reset: () => void
}

export const useProgressStore = create<ProgressState>((set, get) => {
  console.log('[progressStore.ts] INIT store instance', Math.random())

  let observeRef: { unsubscribe: () => void } | null = null
  let updateRef: { unsubscribe: () => void } | null = null

  return {
    // initial state
    jobId: null,
    idUn: null,
    step: 'Starting...',
    status: 'Loading Status',
    hasStarted: false,
    isActive: false,
    continueAsToast: false,
    nextPath: 'dnk',
    fromUpload:false,

    // store idUn for correlating upload → progress
    setIdUn: (idUn: string) => set({ idUn }),
    setcontinueAsToast: (val) => set({ continueAsToast: val }),
    setfromUpload: (val) => set({ fromUpload: val }),
    setnextPath: (val) => set({ nextPath: val }),

    start: (jobId: string) => {
      const state = get()
      if (state.hasStarted && state.jobId === jobId) return
      console.log('[progressStore] start called', jobId)
      set({ hasStarted: true, jobId, isActive: true })
      const client = getClient()

      observeRef = client.models.JobProgress.observeQuery({ filter: { id: { eq: jobId } } })
        .subscribe({
          next: ({ items }) => {
            if (!items.length) return
            const rec = items[0]
            set({ step: rec.step, status: rec.status })
            if (!updateRef) {
              updateRef = client.models.JobProgress.onUpdate({ filter: { id: { eq: jobId } } })
                .subscribe({ 
                next: async (updated) => {
                    
                    console.log('[progressStore]::updated::status::',updated.status,"::signedUrl::",updated.signedUrl)
                    if (updated.status === 'success' || updated.status === 'error') {
                      set({ isActive: false })
                      set({ step: updated.step, status: updated.status })
                      console.log('[progressStore]::End::')
                      get().stop()
                    }else{
                      set({ step: updated.step, status: updated.status })
                    }                    
                }, 
                error: err => { 
                    console.error(err); set({ status: 'error' }); 
                    get().stop() 
                  }, 
                complete: () => get().stop() 
              })
            }
          },
          error: err => { 
            console.error(err); 
            set({ status: 'error' }); 
            get().stop() 
          }
        })
    },

    stop: () => {
      console.log('[progressStore] stop')
      observeRef?.unsubscribe()
      updateRef?.unsubscribe()
      observeRef = null; updateRef = null
      //set({ isActive: false })
      //setTimeout(() => get().reset(), 4000)
    },

    reset: () => {
      console.log('[progressStore] reset')
      observeRef?.unsubscribe()
      updateRef?.unsubscribe()
      observeRef = null; updateRef = null
      set({ 
        jobId: null,
        idUn: null, 
        step: 'Starting...', 
        status: 'Loading Status', 
        hasStarted: false, 
        isActive: false, 
        fromUpload:false,
        nextPath: 'dnk',
     })
    }
  }
})
