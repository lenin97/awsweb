'use client';

//import React from 'react';
import type { InputFormType } from '@/lib/types/input-form';
import { cn } from "@/lib/utils" // adjust path to your project structure
import { motion } from "framer-motion"
import { Label } from "@/components/ui/label";
import { Textarea as ShadTextarea } from "@/components/ui/textarea";
import React, { useState, useEffect } from "react";

interface UploadInputProps {
  input: InputFormType;
  value: unknown;
  onChange: (fieldId: string, value: unknown) => void;
}

const UploadInput = ({ input, value, onChange }: UploadInputProps) => {

  const isFile = input.type === "file";
  const isTextarea = input.type === "textarea";

  const [textValue, setTextValue] = useState(isTextarea ? (value as string) || "" : "");
  const [wordCount, setWordCount] = useState(0);
  const MAX_WORDS = 700;

  useEffect(() => {
    if (isTextarea) {
      const count = textValue.trim().split(/\s+/).filter(Boolean).length;
      setWordCount(count);
      onChange(input.nickname, textValue);
    }
  }, [textValue]);

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="flex flex-col gap-2 transition-all"
    >
      <Label
        htmlFor={input.nickname}
        className="text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {input.label}
      </Label>

      {isTextarea ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative"
          >
            <ShadTextarea
              id={input.nickname}
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder={input.placeholder}
              className="h-40 resize-none"
            />
          </motion.div>
          <motion.div
            key={wordCount > MAX_WORDS ? "exceeded" : "normal"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={`text-sm ${
              wordCount > MAX_WORDS ? "text-red-600" : "text-gray-600"
            }`}
          >
            {wordCount} / {MAX_WORDS} words
          </motion.div>
        </>
      ) : (
        <input
          id={input.nickname}
          type={input.type}
          {...(!isFile && { value: (value as string) ?? "" })}
          onChange={(e) =>
            onChange(
              input.nickname,
              isFile ? e.target.files?.[0] ?? null : e.target.value
            )
          }
          placeholder={input.placeholder}
          accept={input.accept}
          className={cn(
            "w-full rounded-xl border p-3 text-sm shadow-sm transition-all duration-200 ease-in-out",
            "placeholder:text-gray-400 focus-visible:outline-none",
            "bg-background text-foreground border-input",
            "dark:bg-background dark:text-foreground dark:border-input",
            "hover:border-primary hover:shadow-md",
            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            !isFile && value
              ? "border-primary ring-2 ring-primary/40 ring-offset-1"
              : "",
            "file:mr-4 file:rounded-md file:border-0 file:px-4 file:py-2 file:text-sm file:font-medium",
            "file:bg-primary file:text-primary-foreground",
            "hover:file:bg-primary/90 active:file:bg-primary/80",
            "file:hover:shadow-md file:transition-all file:duration-200"
          )}
        />
      )}
    </motion.div>
  );
};

// ✅ Prevents unnecessary re-renders if input props haven't changed
export default React.memo(UploadInput);
/*
<label htmlFor={input.id} className="text-sm font-medium text-gray-700">
  {input.label}
</label>
*/