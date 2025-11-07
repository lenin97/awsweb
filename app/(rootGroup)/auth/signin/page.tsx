'use client';

import { useState } from 'react';
import { signIn } from '@aws-amplify/auth';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignIn = async () => {
    try {
      const { nextStep } = await signIn({ username: email, password });

      switch (nextStep.signInStep) {
        case 'CONFIRM_SIGN_UP':
          sessionStorage.setItem('cameFromSignUp', 'false');
          sessionStorage.setItem('username', email);
          toast.success('Confirm sign up!');
          router.replace('/auth/confirm');
          break;

        case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
        case 'RESET_PASSWORD':
          toast.success('Update password!');
          router.replace('/auth/change-password');
          break;

        case 'DONE':
          //router.refresh()
          //window.location.reload()
          router.replace('/api/auth');  
          //revalidatePath('/', 'layout') 
          //window.location.href = '/api/auth';
          //window.location.replace('/api/auth');
                 
          break;

        default:
          throw new Error(`Unexpected signIn step:`);
      }
    } catch (err) {
      console.error('Sign-in error:', err);

      if (
        typeof err === 'object' &&
        err !== null &&
        'name' in err &&
        typeof err.name === 'string'
      ) {
        switch (err.name) {
          case 'UserNotFoundException':
            setError('User does not exist');
            break;
          case 'NotAuthorizedException':
            setError('Incorrect username or password');
            break;
          case 'UserNotConfirmedException':
            setError('Account not confirmed. Check your email.');
            break;
          default:
            setError('Failed to sign in');
        }
      } else {
        setError('Failed to sign in');
      }
    }
  };

  const handleForgotPassword = () => {
    //sessionStorage.setItem('reset-username', email);
    router.push('/auth/forgot');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm bg-card p-6 rounded-2xl shadow-lg space-y-4"
      >
        <h1 className="text-3xl font-bold text-center">Sign In</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 rounded-md border border-border bg-input text-foreground placeholder:text-muted-foreground"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 rounded-md border border-border bg-input text-foreground placeholder:text-muted-foreground"
        />
        {error && <p className="text-sm text-destructive-foreground text-center">{error}</p>}
        <Button className="w-full" onClick={handleSignIn}>
          Sign In
        </Button>
        <Button
          variant="ghost"
          className="w-full text-sm text-muted-foreground hover:text-foreground"
          onClick={handleForgotPassword}
        >
          Forgot password?
        </Button>
      </motion.div>
    </div>
  );
}
