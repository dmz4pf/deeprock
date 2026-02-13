"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recoveryApi, authApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Key,
  Fingerprint,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";

type Step = "email" | "codes" | "passkey" | "success" | "error";

export function RecoveryFlow() {
  const router = useRouter();
  const { login } = useAuthStore();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      setError(null);
      setIsLoading(true);

      await recoveryApi.startRecovery(email);
      setEmailSent(true);
    } catch (err) {
      console.error("Failed to send recovery email:", err);
      setError(err instanceof Error ? err.message : "Failed to send verification email");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailCode || !recoveryCode) return;

    try {
      setError(null);
      setIsLoading(true);

      const result = await recoveryApi.verifyRecovery(email, emailCode, recoveryCode);

      if (result.success && result.options) {
        // Store the challenge info and proceed to passkey registration
        setStep("passkey");

        // Start WebAuthn registration
        try {
          const credential = await startRegistration({ optionsJSON: result.options });

          // Complete registration
          const verifyResult = await authApi.registerVerify(result.challengeId, credential);

          if (verifyResult.success) {
            setStep("success");
          } else {
            throw new Error("Failed to register passkey");
          }
        } catch (webauthnError) {
          console.error("WebAuthn error:", webauthnError);
          setError("Failed to register passkey. Please try again.");
          setStep("codes");
        }
      }
    } catch (err) {
      console.error("Verification failed:", err);
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    router.push("/login");
  };

  const handleBack = () => {
    if (step === "codes") {
      setStep("email");
      setEmailCode("");
      setRecoveryCode("");
      setEmailSent(false);
    } else {
      router.push("/login");
    }
  };

  // Progress indicator
  const stepNum = step === "email" ? 1 : step === "codes" ? 2 : step === "passkey" ? 3 : 4;

  return (
    <Card className="w-full max-w-md border-[rgba(232,180,184,0.08)]" style={{ background: "rgba(232,180,184,0.03)" }}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-forge-text-1">
          Account Recovery
        </CardTitle>
        <CardDescription className="text-forge-text-3">
          Recover access to your account using a recovery code
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  num < stepNum
                    ? "bg-forge-success text-forge-text-1"
                    : num === stepNum
                    ? "bg-forge-warning text-forge-text-1"
                    : "bg-[rgba(232,180,184,0.04)] text-forge-text-3"
                )}
              >
                {num < stepNum ? <CheckCircle className="h-4 w-4" /> : num}
              </div>
              {num < 3 && (
                <div
                  className={cn(
                    "h-0.5 w-8",
                    num < stepNum ? "bg-forge-success" : "bg-[rgba(232,180,184,0.04)]"
                  )}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step: Email */}
        {step === "email" && (
          <form onSubmit={emailSent ? () => setStep("codes") : handleSendEmail} className="space-y-4">
            <div className="rounded-lg p-4 mb-4 border border-[rgba(232,180,184,0.08)]" style={{ background: "rgba(232,180,184,0.03)" }}>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-forge-copper" />
                <div>
                  <p className="font-medium text-forge-text-1">Step 1: Verify Email</p>
                  <p className="text-sm text-forge-text-3">
                    We'll send a verification code to your email
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-forge-text-2">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-[rgba(232,180,184,0.04)] border-[rgba(232,180,184,0.08)] text-forge-text-1 placeholder:text-forge-text-3"
                disabled={emailSent}
                required
              />
            </div>

            {emailSent && (
              <div className="bg-forge-success/10 border border-forge-success/20 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-forge-success" />
                  <p className="text-sm text-forge-success">
                    Verification email sent! Check your inbox.
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-forge-danger/10 border border-forge-danger/20 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-forge-danger" />
                  <p className="text-sm text-forge-danger">{error}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="submit"
                variant="glow"
                className="flex-1"
                disabled={isLoading || !email}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : emailSent ? (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Send Code
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step: Codes */}
        {step === "codes" && (
          <form onSubmit={handleVerifyCodes} className="space-y-4">
            <div className="rounded-lg p-4 mb-4 border border-[rgba(232,180,184,0.08)]" style={{ background: "rgba(232,180,184,0.03)" }}>
              <div className="flex items-center gap-3">
                <Key className="h-5 w-5 text-forge-warning" />
                <div>
                  <p className="font-medium text-forge-text-1">Step 2: Enter Codes</p>
                  <p className="text-sm text-forge-text-3">
                    Enter your email code and one recovery code
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailCode" className="text-forge-text-2">
                Email Verification Code
              </Label>
              <Input
                id="emailCode"
                type="text"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value)}
                placeholder="123456"
                className="bg-[rgba(232,180,184,0.04)] border-[rgba(232,180,184,0.08)] text-forge-text-1 placeholder:text-forge-text-3 font-mono text-center text-lg tracking-widest"
                maxLength={6}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recoveryCode" className="text-forge-text-2">
                Recovery Code
              </Label>
              <Input
                id="recoveryCode"
                type="text"
                value={recoveryCode}
                onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                placeholder="XXXX-XXXX"
                className="bg-[rgba(232,180,184,0.04)] border-[rgba(232,180,184,0.08)] text-forge-text-1 placeholder:text-forge-text-3 font-mono text-center text-lg tracking-widest"
                maxLength={9}
                required
              />
              <p className="text-xs text-forge-text-3">
                One of the 10 recovery codes you saved when setting up your account
              </p>
            </div>

            {error && (
              <div className="bg-forge-danger/10 border border-forge-danger/20 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-forge-danger" />
                  <p className="text-sm text-forge-danger">{error}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="submit"
                variant="glow"
                className="flex-1"
                disabled={isLoading || !emailCode || !recoveryCode}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Step: Passkey */}
        {step === "passkey" && (
          <div className="py-8 space-y-6 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-forge-copper/10">
              <Fingerprint className="h-8 w-8 text-forge-copper animate-pulse" />
            </div>
            <div>
              <p className="text-lg font-medium text-forge-text-1 mb-1">
                Register New Passkey
              </p>
              <p className="text-sm text-forge-text-3">
                Follow the prompts to register a new passkey for your account
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-forge-text-3" />
              <span className="text-sm text-forge-text-3">Waiting for passkey...</span>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="py-8 space-y-6 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-forge-success/10">
              <CheckCircle className="h-8 w-8 text-forge-success" />
            </div>
            <div>
              <p className="text-lg font-medium text-forge-text-1 mb-1">
                Account Recovered!
              </p>
              <p className="text-sm text-forge-text-3">
                Your new passkey has been registered. You can now sign in with it.
              </p>
            </div>
            <Button
              variant="glow"
              className="w-full"
              onClick={handleComplete}
            >
              Go to Login
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Step: Error */}
        {step === "error" && (
          <div className="py-8 space-y-6 text-center">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-forge-danger/10">
              <AlertCircle className="h-8 w-8 text-forge-danger" />
            </div>
            <div>
              <p className="text-lg font-medium text-forge-text-1 mb-1">
                Recovery Failed
              </p>
              <p className="text-sm text-forge-text-3">
                {error || "Something went wrong. Please try again."}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/login")}
              >
                Back to Login
              </Button>
              <Button
                variant="glow"
                className="flex-1"
                onClick={() => {
                  setStep("email");
                  setError(null);
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
