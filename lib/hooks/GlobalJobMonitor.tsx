/* lib/components/GlobalJobMonitor.tsx */
'use client'
import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useUploadStatusStore } from '@/lib/stores/uploadStatusStore'
import { useProgressStore } from '@/lib/stores/progressStore'
//import { useUploadFormStore } from '@/lib/stores/uploadFormStore'

type Nullable<T> = T | null
//const SESSION_KEY = 'upload-form-data'

export function GlobalJobMonitor() {
  const router = useRouter()
  const pathname = usePathname()
  // at the top of GlobalJobMonitor.tsx
  //console.log('[GlobalJobMonitor] store hook →', useProgressStore)
  // Phase 1: Upload
  const UPD_ID = 'upload-progress'
  const uploadStatus = useUploadStatusStore((s) => s.status)
  const idUn = useProgressStore((s) => s.idUn)
  const hasStartedupd = useUploadStatusStore((s) => s.hasStarted)
  const lastUploadStatus = useRef<Nullable<string>>(null)
  const uploadPage = `/tailorCV/submitInfo`  

  useEffect(() => {
    
    const onUploadPage = pathname === uploadPage
    console.log('[UploadMonitor]', { pathname, onUploadPage, uploadStatus,hasStartedupd })

    // Dismiss any upload toasts when on upload page
    if (onUploadPage) {
      toast.dismiss(UPD_ID)
      console.log('[UploadMonitor] dismissed upload toast (on page)')
      /*
      setTimeout(() => {
        toast.dismiss(UPD_ID)
        console.log('[UploadMonitor] dismissed upload toast (on page)')
      }, 3000)
      */
      lastUploadStatus.current = null
      return
    }

    if(hasStartedupd){

      // Show loading toasts off-page when status changes
      if (uploadStatus !== 'success' && uploadStatus !== lastUploadStatus.current) {
        console.log('[UploadMonitor] toast.loading:', uploadStatus)
        toast.loading(`Upload status: ${uploadStatus}`, { id: UPD_ID, dismissible: false })
        lastUploadStatus.current = uploadStatus
      }

      // Final success
      if (uploadStatus === 'success' && idUn) {
        console.log('[UploadMonitor] upload complete, showing success toast')
        toast.success('Finalizing upload...', { id: UPD_ID, duration: 8000 })
        // preserve toast post-nav
        //useProgressStore.getState().setcontinueAsToast(true)
        //useProgressStore.getState().setnextPath(pathname)
        
        if(!useUploadStatusStore.getState().isCalledRoute){
          console.log('[UploadMonitor] useUploadStatusStore::next')
          useUploadStatusStore.getState().setisCalledRoute(true)
          const progressPageInUpd=`/tailorCV/processInfo/${idUn}`
          if(pathname!=progressPageInUpd && pathname!=uploadPage){
              useProgressStore.getState().setnextPath(pathname)
              console.log('[UploadMonitor] useUploadStatusStore::true')
              router.replace(progressPageInUpd)          
          }
          
        }        
      }

      // Error
      if (uploadStatus === 'error') {
        console.error('[UploadMonitor] upload error')
        toast.error('Error, try again', { id: UPD_ID, duration: 8000 })
        useUploadStatusStore.getState().reset()
      }

    }
    
  }, [uploadStatus,hasStartedupd,idUn,pathname])

  // Phase 2: Progress
  const PGR_ID = 'progress-update'
  const progressStep = useProgressStore((s) => s.step)
  const progressStatus = useProgressStore((s) => s.status)
  const hasStartedprg = useProgressStore((s) => s.hasStarted)
  
  const lastProgressStep = useRef<Nullable<string>>(null)
  

  useEffect(() => {
    
    //const progressPage = `/tailorCV/processInfo/${idUn}`
    const onProgressPage = pathname === `/tailorCV/processInfo/${idUn}`
    console.log('[ProgressMonitor]', { pathname, onProgressPage, progressStep,hasStartedprg })

    // Dismiss any progress toasts when on progress page
    if (onProgressPage) {
      console.log('[ProgressMonitor] dismissed progress toast (on page)')
      toast.dismiss(PGR_ID)
      /*
      setTimeout(() => {
        toast.dismiss(PGR_ID)
        console.log('[ProgressMonitor] dismissed progress toast (on page) after timeout')
      }, 3000)
      */
      lastProgressStep.current = null
      return
    }

    if(hasStartedprg){
        if (progressStatus !== 'success' && progressStatus !== lastProgressStep.current) {
          console.log('[ProgressMonitor] toast.loading:', progressStatus)
          toast.loading(`Progress: ${progressStep}`, { id: PGR_ID, dismissible: false })
          lastProgressStep.current = progressStatus
        }

        // Final done
        if (progressStatus === 'success') {
          console.log('[ProgressMonitor] progress done, showing success toast')
          toast.success('Finalizing CV', { id: PGR_ID, duration: 8000 })
          router.replace(`/tailorCV/downloadTrack/${idUn}`)
        }

        // Error
        if (progressStatus === 'error') {
          console.error('[ProgressMonitor] progress error')
          toast.error('Error, try again', { id: PGR_ID, duration: 8000 })
          useProgressStore.getState().reset()
        }

    }
    // Show loading off-page when step changes
    
  }, [progressStatus,hasStartedprg,pathname])

  // Cleanup
  useEffect(() => {
    return () => {
      console.log('[GlobalJobMonitor] cleanup, dismissing toasts')
      toast.dismiss(UPD_ID)
      toast.dismiss(PGR_ID)
    }
  }, [])

  return null
}
