// lib/utils/stepMatcher.ts
import { stepMap } from '@/lib/constants/stepConstants'

export function getStepFromPath(pathname: string): string | null {

  if (!pathname.startsWith('/tailorCV')){
    return null
  } 
  if (/^\/tailorCV\/processInfo\/[^/]+$/.test(pathname)){
    return 'prsid'
  } 
  
  return stepMap[pathname] ?? null
  
}

  