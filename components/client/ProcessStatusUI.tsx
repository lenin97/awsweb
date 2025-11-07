'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RotateCw } from 'lucide-react'
import { stepVariant } from '@/lib/constants/stepsBackendProcess'
import { Update } from '@/lib/interfaces/updates'

interface ProcessStatusUIProps {
  currentUpdate: Update | null
  status: string
  handleRetry: () => void
}

export function ProcessStatusUI({ currentUpdate, status, handleRetry }: ProcessStatusUIProps) {
  const showSpinner = currentUpdate !== null && !['success', 'error'].includes(status)

  return (
    <main
      id="main-content"
      role="main"
      className="
        bg-gray-50 dark:bg-gray-900 transition-colors
        py-2 sm:py-4 md:py-6 lg:py-8
        px-4 sm:px-6 md:px-8 lg:px-10
      "
    >
      <section
        aria-live="polite"
        aria-relevant="additions text"
        className="
          w-full max-w-3xl mx-auto
          my-4 sm:my-6 md:my-8
        "
      >
        <Card className="w-full mb-4 sm:mb-6 md:mb-8">
          <CardContent className="p-4 sm:p-6 md:p-8 lg:p-6">
            <AnimatePresence>
              {currentUpdate && (
                <motion.div
                  key={currentUpdate.id}
                  variants={stepVariant}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.3 }}
                  className="
                    flex flex-col items-center gap-4
                    p-4 sm:p-6 md:p-8 lg:p-6
                    my-2 sm:my-4 md:my-6
                    border border-gray-200 sm:border-2 md:border-4
                    rounded-lg sm:rounded-xl md:rounded-2xl
                    dark:border-gray-700
                    bg-white dark:bg-gray-800
                    shadow-sm
                    text-center
                  "
                >
                  <div className="flex flex-col items-center gap-2">
                    {showSpinner && (
                      <RotateCw
                        className="animate-spin w-8 h-8"
                        aria-hidden="true"
                        style={{ minWidth: 32, minHeight: 32 }}
                      />
                    )}
                    <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-100">
                      {currentUpdate.title}
                    </h2>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
                    <Badge variant={currentUpdate.getBadgeVariant ?? 'outline'}>
                      {currentUpdate.step.replace('-', ' ')}
                    </Badge>
                    {typeof currentUpdate.progress === 'number' && (
                      <div
                        className="w-full sm:w-40 md:w-48"
                        role="progressbar"
                        aria-valuenow={currentUpdate.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <Progress value={currentUpdate.progress} />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {status === 'error' && (
              <div className="mt-4 sm:mt-6 md:mt-8 text-center">
                <p className="text-sm sm:text-base text-red-600 dark:text-red-400">
                  An error occurred. Please try again.
                </p>
                <button
                  onClick={handleRetry}
                  className="
                    mt-2 sm:mt-3 md:mt-4
                    inline-block px-4 sm:px-5 md:px-6
                    py-1 sm:py-2 md:py-3
                    text-sm sm:text-base font-medium
                    bg-blue-600 text-white
                    rounded-lg sm:rounded-xl
                    focus:outline-none focus:ring-2 focus:ring-blue-300
                    transition
                  "
                >
                  Retry
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
