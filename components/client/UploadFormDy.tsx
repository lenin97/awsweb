'use client';/////////------------------------------outside app

import { ReactNode, useState } from 'react';
import type { InputFormType } from '@/lib/types/input-form';

interface UploadFormProps {
  children: ReactNode;
  fields: InputFormType[];
  onSubmit: (data: Record<string, unknown>) => void;
}

export default function UploadForm({ children, fields, onSubmit }: UploadFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});

  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filtered = Object.fromEntries(
      fields.map(field => [field.id, formData[field.id] ?? null])
    );
    onSubmit(filtered);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {children}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Submit
      </button>
    </form>
  );
}
