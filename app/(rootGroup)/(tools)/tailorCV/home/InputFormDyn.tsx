'use client'

import { useRouter } from 'next/navigation'
import { useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import UploadInput from '@/components/client/UploadInput'
import { useUploadFormStore } from '@/lib/stores/uploadFormStore'
import type { InputFormType } from '@/lib/types/input-form'
import { motion } from "framer-motion"
import {useUploadStatusStore} from '@/lib/stores/uploadStatusStore'
import {useProgressStore} from '@/lib/stores/progressStore'
import { Card, CardContent } from '@/components/ui/card'
import UploadFormDyn from './UploadFormDyn';//StructuredDataTool
//import { cn } from "@/lib/utils" // adjust path to your project structure

const SESSION_KEY = 'upload-form-data'

interface UploadFormDynProps {
  fields: InputFormType[]
}

export default function InputFormDyn({ fields }: UploadFormDynProps) {

    return (
        <>
      <main className="py-8 sm:py-12 lg:py-16 bg-background text-foreground transition-colors duration-300">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="max-w-4xl mx-auto space-y-8"
        >
          {/* Intro Section */}
        <div className="space-y-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-[clamp(1.875rem,5vw,3rem)] font-bold tracking-tight"
          >
            Tailor Your Resume with AI
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-base sm:text-lg text-muted-foreground mx-auto max-w-2xl"
          >
            Enter your resume and job description. Our AI will instantly rewrite your resume to match the job posting.
          </motion.p>
        </div>

          {/* Upload Form Card */}
          <Card className="w-full sm:max-w-xl md:max-w-2xl mx-auto bg-card border border-muted rounded-2xl shadow-xl">
            <CardContent className="p-6 sm:p-8">
              <UploadFormDyn fields={fields} />
            </CardContent>
          </Card>
        </motion.div>
    </main>

      {/* Structured data for SEO, deferred after hydration */}
    </>
  );
}