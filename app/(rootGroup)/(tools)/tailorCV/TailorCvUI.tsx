'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function TailorCvUI({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="container mx-auto px-4 sm:px-6 lg:px-8 py-4"
    >
      <Card
        className={cn(
          'flex flex-col space-y-6 rounded-3xl border bg-background/80 shadow-lg backdrop-blur',
          'p-4 md:p-6'
        )}
      >
        {children}
      </Card>
    </motion.div>
  );
}