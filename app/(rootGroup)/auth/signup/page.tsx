'use client';

import { useState, useEffect } from 'react';
import { signUp, autoSignIn } from '@aws-amplify/auth'; // ✅ updated
import { useRouter } from 'next/navigation'; // ✅ added
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';


export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    symbol: false,
  });

  const router = useRouter(); // ✅ added

  useEffect(() => {
    setPasswordChecks({
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const allValid = Object.values(passwordChecks).every(Boolean);

  const handleSignUp = async () => {
    if (!allValid) {
      setError('Password does not meet the requirements.');
      return;
    }

    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password,
        options: { userAttributes: { email },autoSignIn: { enabled: true } },
      });

      console.debug('signUp result:', { isSignUpComplete, userId, nextStep });

      switch (nextStep.signUpStep) {
        case 'CONFIRM_SIGN_UP':
          sessionStorage.setItem("cameFromSignUp", "true"); // coming from sign-in, not sign-up
          sessionStorage.setItem("username", email);
          router.replace('/auth/confirm');
          break;

        case 'DONE':
          sessionStorage.clear();
          router.replace('/signin');
          break;

        case 'COMPLETE_AUTO_SIGN_IN':
          sessionStorage.clear();
          await autoSignIn();
          router.replace('/api/auth');
          break;

        default:
          throw new Error(`Unsupported signUpStep: `);
      }

      setSuccess(true);
      setError('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      console.error(message);
      setError(message);
    }
  };

  const CheckItem = ({ label, valid }: { label: string; valid: boolean }) => (
    <motion.div
      className={`flex items-center text-sm gap-2 ${
        valid ? 'text-green-500' : 'text-muted-foreground'
      }`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {valid ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <XCircle className="w-4 h-4" />
      )}
      {label}
    </motion.div>
  );

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-background text-foreground">
      <motion.div
        className="w-full max-w-md bg-card border border-border shadow-xl rounded-2xl p-8 space-y-6"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="text-3xl font-semibold text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Sign Up
        </motion.h1>

        {/* Email Input */}
        <div className="relative">
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="peer block w-full appearance-none rounded-md border border-border bg-input px-3 pt-6 pb-2 text-sm text-foreground placeholder-transparent focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Email"
            autoComplete="email"
          />
          <label
            htmlFor="email"
            className="absolute left-3 top-2 text-sm text-muted-foreground transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm peer-focus:text-muted-foreground"
          >
            Email
          </label>
        </div>

        {/* Password Input + Toggle */}
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="peer block w-full appearance-none rounded-md border border-border bg-input px-3 pt-6 pb-2 pr-10 text-sm text-foreground placeholder-transparent focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            placeholder="Password"
            autoComplete="new-password"
          />
          <label
            htmlFor="password"
            className="absolute left-3 top-2 text-sm text-muted-foreground transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm peer-focus:text-muted-foreground"
          >
            Password
          </label>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>

          {/* Password Criteria */}
          <div className="mt-3 space-y-1">
            <CheckItem label="Minimum 8 characters" valid={passwordChecks.length} />
            <CheckItem label="At least 1 lowercase letter" valid={passwordChecks.lowercase} />
            <CheckItem label="At least 1 uppercase letter" valid={passwordChecks.uppercase} />
            <CheckItem label="At least 1 number" valid={passwordChecks.number} />
            <CheckItem label="At least 1 symbol" valid={passwordChecks.symbol} />
          </div>
        </div>

        {/* Success Message */}
        {allValid && !success && (
          <motion.p
            className="text-sm text-green-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            ✅ Password meets all requirements!
          </motion.p>
        )}

        {/* Error / Confirmation Feedback */}
        {error && (
          <motion.p
            className="text-sm text-destructive-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}
        {success && (
          <motion.p
            className="text-sm text-green-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            Check your email to confirm!
          </motion.p>
        )}

        {/* Submit Button */}
        <Button
          className="w-full py-3 text-base font-medium"
          onClick={handleSignUp}
        >
          Sign Up
        </Button>
      </motion.div>
    </div>
  );
}
