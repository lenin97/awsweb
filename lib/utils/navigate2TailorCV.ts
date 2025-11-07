import {useProgressStore} from '@/lib/stores/progressStore'
import {useUploadStatusStore} from '@/lib/stores/uploadStatusStore'

export function navigate2TailorCV() {
  
  return useUploadStatusStore.getState().hasStarted? 
            '/tailorCV/submitInfo': 
            useProgressStore.getState().hasStarted?
                    `/tailorCV/processInfo/${useProgressStore.getState().idUn}`:
                    '/tailorCV/home'
                      
}