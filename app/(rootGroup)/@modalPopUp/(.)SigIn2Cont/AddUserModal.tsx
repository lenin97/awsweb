'use client';

import { useRouter,useSearchParams  } from 'next/navigation';
import { useEffect, useState  } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnimatePresence, motion } from 'framer-motion'

export default function AddUserModal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);

  const redirectTo = searchParams.get('redirectTo');

  const close = () => router.back();

  const navigateAndClose = (path: string) => {
    setIsMounted(false); // triggers unmount animation
    setTimeout(() => router.replace(path), 100); // wait for exit animation
  };

  const goToSignIn = () => {
    const path = redirectTo ? `/auth/signin?redirectTo=${encodeURIComponent(redirectTo)}` : '/auth/signin';
    navigateAndClose(path);
  };

  const goToSignUp = () => {
    const path = redirectTo ? `/auth/signup?redirectTo=${encodeURIComponent(redirectTo)}` : '/auth/signup';
    navigateAndClose(path);
  };
  useEffect(() => {
    setIsMounted(true);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isMounted) return null;

  return (
  <div>
    <AnimatePresence>
      <motion.div
        key="modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="absolute inset-0 bg-black/50" style={{ pointerEvents: 'none' }} />

        <motion.div
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.98, opacity: 0 }}
          className="relative z-10"
          style={{ pointerEvents: 'auto' }}
        >
          <Dialog open onOpenChange={(open) => !open && close()}>
            <DialogContent className="sm:max-w-md overflow-auto">
              <DialogHeader>
                <DialogTitle>Welcome</DialogTitle>
                <DialogDescription>
                  Choose how you want to continue.
                </DialogDescription>
              </DialogHeader>

              <div className="text-sm text-muted-foreground pb-2">
                Choose how you want to continue.
              </div>

              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 justify-end">
                <Button variant="outline" onClick={close}>
                  Cancel
                </Button>
                <Button variant="secondary" onClick={goToSignUp}>
                  Create Account
                </Button>
                <Button onClick={goToSignIn}>
                  Sign In
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  </div>
  );
}


/*
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function AddUserModal() {

  console.log("Rendering app/@signin2cont AddUserModal************+++++++++++++AddUserModal++++++++++++++********");

  const router = useRouter();

  const close = () => router.back();
  const goToSignIn = () => router.push('/auth/signin');
  const goToSignUp = () => router.push('/auth/signup');

  // Prevent background scroll while modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Dialog open onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground pb-2">
          Choose how you want to continue.
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-4 justify-end">
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={goToSignUp}>
            Create Account
          </Button>
          <Button onClick={goToSignIn}>
            Sign In
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
*/
/*
'use client'

import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function AddUserModal() {
  const router = useRouter()
  const close = () => router.back()

  return (
    <Dialog open onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This modal appears on top of any route.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button onClick={close}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
*/