'use client'

import { useEffect ,useState} from 'react'
import { useRouter,usePathname } from 'next/navigation'
//import client from '@/lib/clientAuth4IAM'
import Head from 'next/head';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button'
//import { useProgressController } from '@/lib/hooks/useProgressController'
import {useProgressStore} from '@/lib/stores/progressStore'
import { useUploadFormStore } from '@/lib/stores/uploadFormStore'
import {useUploadStatusStore} from '@/lib/stores/uploadStatusStore'
import {updates_ProcessingCV} from '@/lib/constants/stepsBackendProcess'
import { Update } from '@/lib/interfaces/updates';
import { ProcessStatusUI } from '@/components/client/ProcessStatusUI'

export default function ProgressTracker({ jobId }: { jobId: string }) {

  const router = useRouter()
  const pathname = usePathname()
  const step = useProgressStore((s) => s.step)
  const status = useProgressStore((s) => s.status)

  const nextPath = useProgressStore((s) => s.nextPath);
  //const continueAsToast = useProgressStore((s) => s.continueAsToast);
  const fromUpload = useProgressStore((s) => s.fromUpload);
    
  const { reset: resetForm } = useUploadFormStore()
  const [currentUpdate, setCurrentUpdate] = useState<Update | null>(() => {
      return updates_ProcessingCV.find((u) => u.step === 'idle') || null;
    });

  const SESSION_KEY = 'upload-form-data'
/*  
  useEffect(() => {
    resetForm()
    sessionStorage.removeItem(SESSION_KEY)
    useUploadStatusStore.getState().reset()////useUploadStatusStore.getState().reset()
  }, [])
*/
  useEffect(() => {
    return () => {
      if (status === 'error') {
        console.log('[ProgressTracker] cleanup: status error, resetting');
        useProgressStore.getState().reset();
      }
    };
  }, [status]);

  useEffect(() => {

    if (jobId == undefined || jobId == null) {
      return
    }

    if(fromUpload){
      console.log("[ProgressTracker]::reset::done::jobId::",jobId)
      useProgressStore.getState().start(jobId)
      useProgressStore.getState().setfromUpload(false)
      resetForm()
      sessionStorage.removeItem(SESSION_KEY)
      useUploadStatusStore.getState().reset()////useUploadStatusStore.getState().reset()      
    }

    //if (nextPath! && !status) return

    const info = updates_ProcessingCV.find((u) => u.step === step) || currentUpdate;
    setCurrentUpdate(info);

    if (status === 'success') {
        console.log("[ProgressTracker]::status::done")
        router.replace(`/tailorCV/downloadTrack/${jobId}`)//`/tailorCV/processInfo/${idUn}`
    }

    if (status === 'error') {
        console.log("[ProgressTracker]::status::error::Reset::status[",status,"]::jobId[",jobId,']')
        //useProgressStore.getState().reset()
    }

    if (nextPath!) {
      console.log("[ProgressTracker]::nextPath::",nextPath)
      if(pathname!=nextPath && nextPath!='dnk') {
        console.log("[ProgressTracker]::nextPath::true")
        router.push(nextPath)
      }
    }

  }, [status,nextPath,fromUpload,jobId])
  
  // 🔁 Retry button handler
  const handleRetry = () => {
   
    router.replace('/tailorCV/home') // Navigate back to start of upload flow
  }

  return (
    <ProcessStatusUI
      currentUpdate={currentUpdate}
      status={status!}
      handleRetry={handleRetry}
    />  
  )
}
