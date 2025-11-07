"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { confirmSignUp, resendSignUpCode, autoSignIn } from "@aws-amplify/auth";
import type { ResendSignUpCodeOutput } from "@aws-amplify/auth";
import { toast } from 'sonner';

export default function ConfirmSignUpPage() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [maskedTarget, setMaskedTarget] = useState("");
  const [resendTimer, setResendTimer] = useState(10);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resendFailAttempts, setResendFailAttempts] = useState(0);
  const [resendSuccessAttempts, setResendSuccessAttempts] = useState(0);

  //const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const emailParam = sessionStorage.getItem("username") ?? "";
    const cameFromSignUp = sessionStorage.getItem("cameFromSignUp") === "true";

    setEmail(emailParam);

    if (emailParam.includes("@")) {
      const [user, domain] = emailParam.split("@");
      setMaskedTarget(`${user[0]}***@${domain}`);
    } else if (emailParam.length >= 4) {
      setMaskedTarget(`${emailParam.slice(0, 3)}***`);
    }

    if (emailParam && !cameFromSignUp) {
      const sentKey = `code-sent-${emailParam}`;
      const alreadySent = sessionStorage.getItem(sentKey);

      if (!alreadySent) {
        handleResend();
        sessionStorage.setItem(sentKey, "true");
      }

      sessionStorage.removeItem("cameFromSignUp"); // ✅ Clear after first use
    }
  }, []);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  async function handleConfirm() {
    setError("");
    setSuccess("");
    try {
      const response = await confirmSignUp({ username: email, confirmationCode: code });

      const { isSignUpComplete, nextStep } = response;

      console.debug("confirmSignUp →", { isSignUpComplete, nextStep });

      switch (nextStep?.signUpStep) {
        case "DONE":
            toast.success('Sign-up confirmed!');
            sessionStorage.clear();
            setTimeout(() => router.replace("/auth/signin"), 1500);
            break;

        case "COMPLETE_AUTO_SIGN_IN":
        case undefined:
            await autoSignIn();
            toast.success('Signed in automatically!');
            sessionStorage.clear();
            setTimeout(() => router.replace("/api/auth"), 1500);
            break;

        default:
            throw new Error(`Unsupported signUpStep: ${nextStep.signUpStep}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid code.";
      setError(message);
    }
  }

  async function handleResend() {
    setError("");
    setSuccess("");
    setIsResending(true);

    if (resendFailAttempts >= 5) {
      setError("Too many failed attempts. Please try again later.");
      setIsResending(false);
      return;
    }

    if (resendSuccessAttempts >= 3) {
      setError("You've used all your resend attempts. Please try again later.");
      setIsResending(false);
      return;
    }

    try {
      const result: ResendSignUpCodeOutput = await resendSignUpCode({ username: email });
      const { deliveryMedium, destination } = result ?? {};

      if (deliveryMedium === "EMAIL" && destination) {
        const [user, domain] = destination.split("@");
        setMaskedTarget(`${user?.[0] ?? "*"}***@${domain}`);
      } else if (deliveryMedium === "SMS" && destination) {
        setMaskedTarget(`${destination.slice(0, 2)}***${destination.slice(-2)}`);
      }

      setSuccess(`New code sent via ${deliveryMedium?.toLowerCase()} to ${maskedTarget}`);
      setResendTimer(10);
      setResendSuccessAttempts((prev) => prev + 1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not resend code.";
      setError(message);
      setResendFailAttempts((prev) => prev + 1);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-4">
        <CardContent>
          <h2 className="text-xl font-semibold mb-4">Confirm your account</h2>
          <p className="mb-4 text-sm text-gray-600">
            We&rsquo;ve sent a code to: <strong>{maskedTarget}</strong>
          </p>

          <Input
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mb-4"
          />

          <Button onClick={handleConfirm} className="w-full mb-2">
            Confirm
          </Button>

          <Button
            variant="secondary"
            onClick={handleResend}
            disabled={resendTimer > 0 || isResending}
            className="w-full"
          >
            {isResending
              ? "Sending..."
              : resendTimer > 0
              ? `Resend in ${resendTimer}s`
              : "Resend code"}
          </Button>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-4 text-sm text-red-500"
              >
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-4 text-sm text-green-600"
              >
                {success}
              </motion.p>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}


