import { Update } from '@/lib/interfaces/updates';

export const stepVariant = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

export const updates_Submitting: Update[] = [
  {
    id: '1',
    title: 'Reading form data',
    description: 'Uploading your job specification details...',
    step: 'reading',
    getBadgeVariant: 'outline'
    //progress: 45
  },
  {
    id: '2',
    title: 'Uploading your CV',
    description: 'Receiving your resume securely...',
    step: 'uploading',
    getBadgeVariant: 'secondary'
  },
  {
    id: '3',
    title: 'Submission complete',
    description: 'Your CV and job details are now ready for processing.',
    step: 'success',
    getBadgeVariant: 'secondary'
  },
  {
    id: '4',
    title: 'Error',
    description: 'Please try again',
    step: 'error',
    getBadgeVariant: 'destructive'
  }
];

export const updates_ProcessingCV: Update[] = [
  {
    id: '1',
    title: 'Analyzing your CV',
    description: 'Reviewing your experience, skills, and education.',
    step: 'idle',
    getBadgeVariant: 'outline'
    //progress: 45
  },
  {
    id: '2',
    title: 'Extracting skills',
    description: 'Identifying and matching your skills to the job description.',
    step: 'Starting',
    getBadgeVariant: 'secondary'
  },
  {
    id: '3',
    title: 'Tailoring your CV',
    description: 'Adjusting your CV content to highlight relevant strengths.',
    step: 'Fetching user info',
    getBadgeVariant: 'secondary'
  },
  {
    id: '4',
    title: 'Refining CV content',
    description: 'Improving clarity and emphasizing job-specific keywords.',
    step: 'Matching with job spec',
    getBadgeVariant: 'secondary'
  },
  {
    id: '5',
    title: 'Finalizing tailored CV',
    description: 'Polishing formatting and structure for the final version.',
    step: 'Saving tailored CV',
    getBadgeVariant: 'secondary'
  },
  {
    id: '6',
    title: 'CV ready',
    description: 'Your tailored resume has been generated successfully.',
    step: 'Done',
    getBadgeVariant: 'secondary'
  },
  {
    id: '7',
    title: 'Error',
    description: 'Please try again',
    step: 'error',
    getBadgeVariant: 'destructive'
  }
];
