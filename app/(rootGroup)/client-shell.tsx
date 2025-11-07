'use client'

import { GlobalJobMonitor } from '@/lib/hooks/GlobalJobMonitor'
//import { useProgressStore } from '@/lib/stores/progressStore'
//import { useUploadStatusStore } from '@/lib/stores/uploadStatusStore'

export function ClientShell() {
  // ⚙️ Bootstrap both stores exactly once
  //console.log("ClientShell call>>>>>>>><<<<<<<<<<<<<>>>>>>>>>><<<<<<<<<<<<>>>>>>>>>>>")
 // useProgressStore()
 // useUploadStatusStore()

  // Mount your global monitor, then render the rest of the tree:
  return <GlobalJobMonitor />
  
}
