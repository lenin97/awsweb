// app/auth/reset/confirm/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { confirmResetPassword } from "@aws-amplify/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle } from "lucide-react";

export default function ConfirmResetPasswordPage() {
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [passwordChecks, setPasswordChecks] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    symbol: false,
  });

  useEffect(() => {
    const stored = sessionStorage.getItem("reset-username") ?? "";
    setEmail(stored);
  }, []);

  useEffect(() => {
    setPasswordChecks({
      length: newPassword.length >= 8,
      lowercase: /[a-z]/.test(newPassword),
      uppercase: /[A-Z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      symbol: /[^A-Za-z0-9]/.test(newPassword),
    });
  }, [newPassword]);

  const allValid = Object.values(passwordChecks).every(Boolean);

  async function handleConfirmReset() {
    setError("");
    setIsLoading(true);
    try {
      if (!allValid) {
        throw new Error("Password does not meet the requirements.");
      }

      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });

      toast.success("Password updated!");
      sessionStorage.clear();
      setTimeout(() => router.replace("/auth/signin"), 1500);
    } catch (err: unknown) {
        const error = err as { name?: string; message?: string };
        switch (error.name) {
            case "CodeMismatchException":
            setError("Incorrect verification code.");
            break;
            case "ExpiredCodeException":
            setError("Your code has expired. Please request a new one.");
            break;
            case "LimitExceededException":
            setError("Too many attempts. Please try again later.");
            break;
            case "UserNotFoundException":
            setError("User not found.");
            break;
            default:
            setError(error.message || "Could not reset password. Please try again.");
            break;
        }
        setTimeout(() => router.replace("/auth/forgot"), 2000);
    

    } finally {
      setIsLoading(false);
    }
  }

  const CheckItem = ({ label, valid }: { label: string; valid: boolean }) => (
    <motion.div
      className={`flex items-center text-sm gap-2 ${
        valid ? "text-green-500" : "text-muted-foreground"
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md p-6 sm:p-8 shadow-2xl rounded-2xl">
        <CardContent>
          <h2 className="text-2xl font-semibold mb-6 text-center">Set new password</h2>
          <Input
            placeholder="Enter verification code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="mb-4"
          />
          <Input
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mb-4"
          />

          <div className="mb-4 space-y-1">
            <CheckItem label="Minimum 8 characters" valid={passwordChecks.length} />
            <CheckItem label="At least 1 lowercase letter" valid={passwordChecks.lowercase} />
            <CheckItem label="At least 1 uppercase letter" valid={passwordChecks.uppercase} />
            <CheckItem label="At least 1 number" valid={passwordChecks.number} />
            <CheckItem label="At least 1 symbol" valid={passwordChecks.symbol} />
          </div>

          {allValid && (
            <motion.p
              className="text-sm text-green-500 mb-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              ✅ Password meets all requirements!
            </motion.p>
          )}

          <Button onClick={handleConfirmReset} className="w-full" disabled={isLoading}>
            {isLoading ? "Resetting..." : "Confirm password reset"}
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
