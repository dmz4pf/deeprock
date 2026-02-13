"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { authApi, type AuthUser } from "@/lib/api";
import { toast } from "sonner";

interface EmailVerificationFlowProps {
  step: "email-input" | "email-verify";
  email: string;
  onEmailChange: (email: string) => void;
  onCodeVerified: (
    user: AuthUser & { authProvider: string },
    csrfToken: string,
    isNewUser: boolean,
    hasBiometrics: boolean
  ) => void;
  onBack: () => void;
  onStepChange: (step: "email-input" | "email-verify") => void;
}

export function EmailVerificationFlow({
  step,
  email,
  onEmailChange,
  onCodeVerified,
  onBack,
  onStepChange,
}: EmailVerificationFlowProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === "email-verify" && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [step]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await authApi.sendCode(email);
      toast.success("Verification code sent to your email");
      onStepChange("email-verify");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send code";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5) {
      const fullCode = newCode.join("");
      if (fullCode.length === 6) {
        handleVerifyCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split("");
      setCode(newCode);
      handleVerifyCode(pasted);
    }
  };

  const handleVerifyCode = async (fullCode: string) => {
    setIsLoading(true);
    try {
      const result = await authApi.verifyCode(email, fullCode);
      onCodeVerified(result.user, result.csrfToken, result.isNewUser, result.hasBiometrics);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid code";
      toast.error(message);
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      await authApi.sendCode(email);
      setCode(["", "", "", "", "", ""]);
      toast.success("New code sent");
      inputRefs.current[0]?.focus();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to resend code";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "email-input") {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit -ml-2 mb-2"
            onClick={onBack}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <CardTitle className="text-2xl">Enter your email</CardTitle>
          <CardDescription>
            We&apos;ll send you a verification code to sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => onEmailChange(e.target.value)}
                disabled={isLoading}
                autoFocus
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending code...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send verification code
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <Button
          variant="ghost"
          size="sm"
          className="w-fit -ml-2 mb-2"
          onClick={onBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Change email
        </Button>
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription>
          We sent a 6-digit code to <strong>{email}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={isLoading}
              className="w-12 h-14 text-center text-2xl font-mono"
            />
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </div>
        )}

        <div className="text-center">
          <Button
            variant="link"
            onClick={handleResendCode}
            disabled={isLoading}
            className="text-sm"
          >
            Didn&apos;t receive a code? Resend
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
