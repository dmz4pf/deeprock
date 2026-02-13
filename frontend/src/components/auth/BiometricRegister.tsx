"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useBiometric } from "@/hooks/useBiometric";
import { Fingerprint, Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface BiometricRegisterProps {
  onSuccess?: (user: { id: string; email: string; walletAddress: string }) => void;
  onLoginClick?: () => void;
}

type Step = "email" | "registering" | "success" | "error";

export function BiometricRegister({ onSuccess, onLoginClick }: BiometricRegisterProps) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [step, setStep] = useState<Step>("email");
  const [capabilities, setCapabilities] = useState<{
    webAuthnSupported: boolean;
    platformAuthenticatorAvailable: boolean;
  } | null>(null);

  const {
    isLoading,
    error,
    register,
    checkCapabilities,
    checkEmail,
    clearError,
  } = useBiometric();

  // Check biometric capabilities on mount
  useEffect(() => {
    checkCapabilities().then(setCapabilities);
  }, [checkCapabilities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Validate email
    if (!email || !email.includes("@")) {
      return;
    }

    // Check if already registered
    const isRegistered = await checkEmail(email);
    if (isRegistered) {
      onLoginClick?.();
      return;
    }

    setStep("registering");

    const result = await register(email, displayName || undefined);

    if (result.success && result.user) {
      setStep("success");
      setTimeout(() => {
        onSuccess?.(result.user!);
      }, 1500);
    } else {
      setStep("error");
    }
  };

  // Not supported state
  if (capabilities && !capabilities.webAuthnSupported) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-forge-warning" />
            Browser Not Supported
          </CardTitle>
          <CardDescription>
            Your browser does not support WebAuthn biometric authentication.
            Please use a modern browser like Chrome, Firefox, Safari, or Edge.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // No platform authenticator available
  if (capabilities && !capabilities.platformAuthenticatorAvailable) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-forge-warning" />
            Biometrics Not Available
          </CardTitle>
          <CardDescription>
            Your device does not have a built-in biometric authenticator.
            Please enable Touch ID, Face ID, or Windows Hello, or use a device
            with biometric support.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Success state
  if (step === "success") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-forge-success">
            <CheckCircle className="h-5 w-5" />
            Registration Successful
          </CardTitle>
          <CardDescription>
            Your biometric identity has been registered. You can now
            authenticate using your fingerprint or face.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Error state
  if (step === "error") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-forge-danger">
            <XCircle className="h-5 w-5" />
            Registration Failed
          </CardTitle>
          <CardDescription>
            {error || "Something went wrong. Please try again."}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            variant="outline"
            onClick={() => {
              setStep("email");
              clearError();
            }}
          >
            Try Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Registering state
  if (step === "registering") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 animate-pulse text-primary" />
            Complete Biometric Registration
          </CardTitle>
          <CardDescription>
            Follow your device&apos;s instructions to register your fingerprint
            or face. This will be used to securely authenticate your
            transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">
            Waiting for biometric verification...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Email input state
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5 text-primary" />
          Register with Biometrics
        </CardTitle>
        <CardDescription>
          Create your Deeprock account using secure biometric authentication.
          Your fingerprint or face will be used to sign transactions.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name (Optional)</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="Your Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {error && (
            <p className="text-sm text-forge-danger">{error}</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button type="submit" className="w-full" disabled={isLoading || !email}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                Register with Biometrics
              </>
            )}
          </Button>
          {onLoginClick && (
            <Button
              type="button"
              variant="link"
              onClick={onLoginClick}
              className="text-sm"
            >
              Already registered? Sign in
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

export default BiometricRegister;
