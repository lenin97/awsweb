"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { resetPassword } from "@aws-amplify/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleReset() {
    setError("");
    setIsLoading(true);
    try {
      const { nextStep } = await resetPassword({ username: email });
      console.debug("resetPassword →", nextStep);

      switch (nextStep.resetPasswordStep) {
        case "CONFIRM_RESET_PASSWORD_WITH_CODE":
          sessionStorage.setItem("reset-username", email);
          toast.success("Verification code sent!");
          router.replace("/auth/confirmResetPassword");
          break;

        default:
          throw new Error(`Unsupported resetPasswordStep: ${nextStep.resetPasswordStep}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to send reset code.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md p-6 sm:p-8 shadow-2xl rounded-2xl">
        <CardContent>
          <h2 className="text-2xl font-semibold mb-6 text-center">Reset your password</h2>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mb-4"
          />
          <Button onClick={handleReset} className="w-full" disabled={isLoading}>
            {isLoading ? "Sending..." : "Send reset code"}
          </Button>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="mt-4 text-sm text-red-500 text-center"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}