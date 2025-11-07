/* lib/stores/progressStore.ts */
import { create } from 'zustand'

type StepType = string

interface GlobalState {
  jobId: string | null
  step: StepType
  setJob: (jobId: string) => void
  setStep: (step: StepType) => void
  reset: () => void
  isProcessPageActive: boolean
  setIsProcessPageActive: (active: boolean) => void
}

export const useGlobalStore = create<GlobalState>((set) => ({
  jobId: null,
  step: 'Starting...',
  setJob: (jobId) => set({ jobId }),
  setStep: (step) => set({ step }),
  reset: () => set({ jobId: null, step: 'Starting...' }),
  isProcessPageActive: false,
  setIsProcessPageActive: (active) => set({ isProcessPageActive: active }),
}))