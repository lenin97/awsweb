'use client'

import { useEffect,useState } from 'react'
import { useUploadFormStore } from '@/lib/stores/uploadFormStore'
import { useRouter } from 'next/navigation'
//import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
//import { Loader2, CheckCircle2, UploadCloud, FileWarning } from 'lucide-react'
//import { uploadData } from 'aws-amplify/storage'//statusUI
import { statusUI } from '@/components/client/statusUI'
import Head from 'next/head';
//import { getCurrentUser } from 'aws-amplify/auth';
//import { fetchAuthSession } from 'aws-amplify/auth';
//import { useUploadController } from '@/lib/hooks/useUploadController'
import {useUploadStatusStore} from '@/lib/stores/uploadStatusStore'
import { Button } from '@/components/ui/button' // Add this import if not yet present
import {useProgressStore} from '@/lib/stores/progressStore'
import {FormValue} from '@/lib/types/form'//isFormValue
import {isFormValue} from '@/lib/types/form'
import { AnimatePresence, motion } from 'framer-motion';
import {updates_Submitting} from '@/lib/constants/stepsBackendProcess'
import { Update } from '@/lib/interfaces/updates';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RotateCw } from 'lucide-react';
import { ProcessStatusUI } from '@/components/client/ProcessStatusUI'

//type StatusType = 'idle' | 'reading' | 'uploading' | 'success' | 'error'

const SESSION_KEY = 'upload-form-data'

export default function ConfirmUpload() {
 
  const { formData, setBulkFormData } = useUploadFormStore()
  const router = useRouter()
  const status = useUploadStatusStore((s) => s.status)
  const idUn = useProgressStore((s) => s.idUn)
 
  const fromhome = useUploadStatusStore((s) => s.fromHome);

  const setfromhome = useUploadStatusStore((state) => state.setFromHome)
  const startUpload = useUploadStatusStore((s) => s.startUpload)
  // Initialize current update to 'reading' step so UI shows immediately
  const [currentUpdate, setCurrentUpdate] = useState<Update | null>(() => {
    return updates_Submitting.find((u) => u.step === 'reading') || null;
  });
 

  // 🔁 Restore form data from sessionStorage (ONCE)
 useEffect(() => {

      if (!fromhome) return  
      setfromhome(false)
      // 1. Restore metadata from sessionStorage
      const saved = sessionStorage.getItem(SESSION_KEY)
      let metadataFromSession: Record<string, FormValue> = {}

      if (saved) {
        try {
          metadataFromSession = JSON.parse(saved)
        } catch (e) {
          console.warn('⚠️ Failed to parse saved metadata:', e)
        }
      }

      // 2. Extract file from Zustand (in-memory only)
      const fileFieldId = Object.keys(formData).find(
        key => formData[key] instanceof File
      )
      const file = fileFieldId ? formData[fileFieldId] : null

      // 3. Merge metadata (from session) + file (from Zustand) into one formData object
      const merged: Record<string, FormValue> = {
        ...Object.fromEntries(
          Object.entries(metadataFromSession).filter(([_, v]) => isFormValue(v))
        ),
        ...Object.fromEntries(
          Object.entries(formData).filter(([_, v]) => v instanceof File)
        ),
      }

      setBulkFormData(merged)

      console.log('📦 Upload metadataFromSession (non-File fields):', metadataFromSession);

      console.log('🧾 File object (ConfirmUpload):', file);
      // 4. Early exit if no valid file
      if (!file || !(file instanceof File)) {
        alert('❌ No valid file found. Please re-upload your file.')
        return
      }

      // 5. Extract metadata again from merged Zustand state after update
      const metadata = Object.fromEntries(
        Object.entries(merged).filter(([_, v]) => !(v instanceof File))
      )

      console.log('📦 Upload metadata (non-File fields):', metadataFromSession);

      startUpload({ file, metadata })

}, [])

  useEffect(() => {
    return () => {
      if (status === 'error') {
        console.log('[ConfirmUpload] cleanup: status error, resetting');
        useUploadStatusStore.getState().reset()
      }
    };
  }, [status]);

  // redirect on success when idUn is available
  useEffect(() => {
    if (!status) return

    const info = updates_Submitting.find((u) => u.step === status) || currentUpdate;
    setCurrentUpdate(info);

    if (status === 'success' && idUn) {
      console.log('[ConfirmUpload]::success::idUn::', idUn)
      router.replace(`/tailorCV/processInfo/${idUn}`)
    }

  }, [status,idUn])
 // ✅ One-time effect

 // ✅ Retry logic when error
  const handleRetry = () => {
    //resetUpdStr()
    router.replace('/tailorCV/home') // Navigate back to start of upload flow
  }

  return (
    <ProcessStatusUI
      currentUpdate={currentUpdate}
      status={status}
      handleRetry={handleRetry}
    />
  )
}
