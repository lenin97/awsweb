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
import {CustomButton} from "@/components/client/CustomButton"
//import { cn } from "@/lib/utils" // adjust path to your project structure

const SESSION_KEY = 'upload-form-data'

interface UploadFormDynProps {
  fields: InputFormType[]
}

// Define this before using it
type FormValue = string | number | boolean | File | null

const isFormValue = (value: unknown): value is FormValue => {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value instanceof File ||
    value === null
  )
}

export default function UploadFormDyn({ fields }: UploadFormDynProps) {
  
  const router = useRouter()
  const { formData, setFormData, setBulkFormData } = useUploadFormStore()
  const restoredRef = useRef(false)
  //const setfromhome = useUploadStatusStore((state) => state.setFromHome)

  console.log("🔥 UPDATED UploadFormPage IS BEING USED***************tailorCV/content/home/UploadFormDyn");

  useEffect(() => {
    if (restoredRef.current) return

    try {
      const saved = sessionStorage.getItem(SESSION_KEY)
      if (!saved) return

      const parsed = JSON.parse(saved)
      const defaults = Object.fromEntries(fields.map(f => [f.nickname, f.value || '']))
      setBulkFormData({ ...defaults, ...parsed })

      restoredRef.current = true
      sessionStorage.removeItem(SESSION_KEY)
    } catch (err) {
      console.warn('Failed to restore upload form data:', err)
    }
  }, [fields, setBulkFormData])

  const handleChange = (field: string, value: unknown) => {
    if (isFormValue(value)) {
      setFormData(field, value)
    } else {
      console.error(`Invalid form value for field "${field}"`, value)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const safeData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) =>
        value instanceof File
          ? [key, { name: value.name, type: value.type }]
          : [key, value]
      )
    )

    // ✅ Log what's going into sessionStorage (no files)
    console.log('🗃 sessionStorage data (safeData):', safeData)

    sessionStorage.setItem(SESSION_KEY, JSON.stringify(safeData))

     // ✅ Log Zustand state (may include File objects)
    console.log('🧠 Zustand full formData state:', formData)
    Object.entries(formData).forEach(([key, val]) => {
      console.log(`🔎 ${key}:`, val, val instanceof File ? '📄 File object' : typeof val)
    })
    // Let the browser flush storage—then navigate
    setTimeout(() => {
      useUploadStatusStore.getState().setFromHome(true);
      useProgressStore.getState().setfromUpload(true)
      router.replace('/tailorCV/submitInfo');
    }, 0);
  }

  // ✅ Check that all fields are filled
  const isFormComplete = fields.every(f => {
    const val = formData[f.nickname]
    if (f.type === 'file') return val instanceof File
    return typeof val === 'string' && val.trim().length > 0
  })

  // 🔄 Sort fields by `num` so input.num = 1 renders first, then 2, etc.
  const sortedFields = [...fields].sort(
    (a, b) => (a.num ?? 0) - (b.num ?? 0)
  ); // uses JS sort comparator :contentReference[oaicite:1]{index=1}

  return (
    <>
      <motion.h1
        id="upload-title"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-[clamp(1.5rem,4vw,2.5rem)] font-bold mb-6 text-center sm:text-left text-gray-800 dark:text-white"
      >
        Upload a File
      </motion.h1>  

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full"
      >
        <p id="form-desc" className="sr-only">
          Fill out all fields below and press Submit to upload your file
        </p>

        {sortedFields.map((input) => {
          const span2 = input.type === 'textarea' || input.type === 'file'
          return (
            <div
              key={input.nickname}
              className={span2 ? 'md:col-span-2' : ''}
            >
              <UploadInput
                key={input.nickname}
                input={input}
                value={formData[input.nickname]}
                onChange={handleChange}
              />
            </div>
          )
        })}

        <CustomButton
          //href="#"                         // not used for navigation here
          label="Submit"                   // your button text
          type="submit"                    // still submits the form
          disabled={!isFormComplete}       // same disabled logic
          size="lg"                        // keeps your large padding/text
        />

      </motion.form>
    </>
  )
}