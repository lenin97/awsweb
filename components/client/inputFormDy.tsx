'use client'///////-------------outside app

import { useState } from 'react'
import type { InputFormType } from '@/lib/types/input-form';

export type InputConfig = {
  type: string
  defaultValue: string
  onChangeType: 'value' | 'file' // Determines how to handle the onChange
}

export default function InputFillerClient({ inputs }: { inputs: InputFormType[] }) {
  const [values, setValues] = useState<string[]>(inputs.map(input => input.value))

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newValues = [...values]

    if (inputs[index].onChange === 'file') {
      newValues[index] = e.target.files?.[0]?.name ?? ''
    } else {
      newValues[index] = e.target.value
    }

    setValues(newValues)
  }

  return (
    <>
      {inputs.map((input, index) => (
        <input
          key={index}
          type={input.type}
          value={input.type === 'file' ? undefined : values[index]}
          onChange={(e) => handleChange(index, e)}
        />
      ))}
    </>
  )
}