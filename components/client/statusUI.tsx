'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Loader2, CheckCircle2, UploadCloud, FileWarning } from 'lucide-react'

// 🎨 Status-based UI
export const statusUI = {
  idle: (
    <section
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Preparing upload"
    >
      <Alert>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <div>
          <AlertTitle>Preparing upload...</AlertTitle>
          <AlertDescription>Getting things ready.</AlertDescription>
        </div>
      </Alert>
    </section>
  ),
  reading: (
    <section
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Reading file metadata"
    >
      <Alert>
        <Loader2
          className="h-5 w-5 animate-spin text-blue-500"
          aria-hidden="true"
        />
        <div>
          <AlertTitle>Reading file metadata</AlertTitle>
          <AlertDescription>
            Analyzing the file and metadata before upload.
          </AlertDescription>
        </div>
      </Alert>
    </section>
  ),
  uploading: (
    <section
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Uploading"
    >
      <Alert>
        <UploadCloud
          className="h-5 w-5 text-indigo-500 animate-pulse"
          aria-hidden="true"
        />
        <div>
          <AlertTitle>Uploading</AlertTitle>
          <AlertDescription>
            Your file is being uploaded to cloud storage.
          </AlertDescription>
        </div>
      </Alert>
    </section>
  ),
  success: (
    <section
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Upload successful"
    >
      <Alert>
        <CheckCircle2
          className="h-5 w-5 text-green-600"
          aria-hidden="true"
        />
        <div>
          <AlertTitle>Upload successful!</AlertTitle>
          <AlertDescription>Redirecting to your dashboard…</AlertDescription>
        </div>
      </Alert>
    </section>
  ),
  error: (
    <section
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      aria-label="Upload failed"
    >
      <Alert variant="destructive">
        <FileWarning
          className="h-5 w-5 text-red-600"
          aria-hidden="true"
        />
        <div>
          <AlertTitle>Upload failed</AlertTitle>
          <AlertDescription>
            Something went wrong. Please try again.
          </AlertDescription>
        </div>
      </Alert>
    </section>
  ),
};
/*
interface Update {
  id: string;
  title: string;
  description?: string;
  step: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress?: number; // 0 to 100
}
*/
/*
interface ProcessStatusLayoutProps {
  updates: Update[];
}
*/

/*
const getBadgeVariant = (step: Update['step']) => {
    switch (step) {
      case 'pending':
        return 'outline';
      case 'in-progress':
        return 'secondary';
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };
*/