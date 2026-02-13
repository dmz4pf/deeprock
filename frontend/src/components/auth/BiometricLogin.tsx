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

interface BiometricLoginProps {
  // SEC-002: onSuccess now includes csrfToken for API requests
  onSuccess?: (user: { id: string; email: string; walletAddress: string }, csrfToken: string) => void;
  onRegisterClick?: () => void;
  defaultEmail?: string;
  /** Render as compact inline button instead of full card */
  compact?: boolean;
  /** Render as prominent large button (only with compact) */
  prominent?: boolean;
}

type Step = "email" | "authenticating" | "success" | "error";

export function BiometricLogin({ onSuccess, onRegisterClick, defaultEmail, compact = false, prominent = false }: BiometricLoginProps) {
  const [email, setEmail] = useState(defaultEmail || "");
  const [step, setStep] = useState<Step>("email");
  const [pendingAuth, setPendingAuth] = useState<{ user: { id: string; email: string; walletAddress: string }; csrfToken: string } | null>(null);
  const [capabilities, setCapabilities] = useState<{
    webAuthnSupported: boolean;
    platformAuthenticatorAvailable: boolean;
  } | null>(null);

  const {
    isLoading,
    error,
    authenticate,
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

    // Check if registered
    const isRegistered = await checkEmail(email);
    if (!isRegistered) {
      onRegisterClick?.();
      return;
    }

    setStep("authenticating");

    const result = await authenticate(email);

    if (result.success && result.user && result.csrfToken) {
      // SEC-002: Store auth data for callback after success animation
      setPendingAuth({ user: result.user, csrfToken: result.csrfToken });
      setStep("success");
      setTimeout(() => {
        onSuccess?.(result.user!, result.csrfToken!);
      }, 1000);
    } else {
      setStep("error");
    }
  };

  /**
   * Handle passkey authentication in compact mode
   * Uses discoverable credentials - no email required
   */
  const handleCompactAuth = async () => {
    clearError();
    setStep("authenticating");

    // Authenticate without email - uses discoverable credentials (passkey)
    const result = await authenticate();

    if (result.success && result.user && result.csrfToken) {
      setPendingAuth({ user: result.user, csrfToken: result.csrfToken });
      setStep("success");
      setTimeout(() => {
        onSuccess?.(result.user!, result.csrfToken!);
      }, 1000);
    } else {
      setStep("error");
    }
  };

  // Not supported state
  if (capabilities && !capabilities.webAuthnSupported) {
    if (compact) {
      return null; // Hide compact button if not supported
    }
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

  // Compact mode rendering
  if (compact) {
    const buttonSize = prominent ? "lg" : "sm";
    const buttonClass = prominent ? "w-full h-14 text-base" : "";
    const iconClass = prominent ? "mr-3 h-5 w-5" : "mr-2 h-4 w-4";

    if (step === "authenticating") {
      return (
        <Button variant={prominent ? "default" : "outline"} size={buttonSize} disabled className={buttonClass}>
          <Loader2 className={`${iconClass} animate-spin`} />
          {prominent ? "Authenticating with passkey..." : "Authenticating..."}
        </Button>
      );
    }

    if (step === "success") {
      return (
        <Button variant={prominent ? "default" : "outline"} size={buttonSize} disabled className={`${buttonClass} text-forge-success`}>
          <CheckCircle className={iconClass} />
          Success
        </Button>
      );
    }

    if (step === "error") {
      return (
        <Button
          variant={prominent ? "default" : "outline"}
          size={buttonSize}
          onClick={() => {
            setStep("email");
            clearError();
          }}
          className={`${buttonClass} ${prominent ? "" : "text-forge-danger"}`}
        >
          <XCircle className={iconClass} />
          {prominent ? "Passkey failed - Try again" : "Try again"}
        </Button>
      );
    }

    return (
      <Button
        variant={prominent ? "default" : "outline"}
        size={buttonSize}
        onClick={handleCompactAuth}
        disabled={isLoading}
        className={buttonClass}
      >
        <Fingerprint className={iconClass} />
        {prominent ? "Sign in with Passkey" : "Sign in with passkey"}
      </Button>
    );
  }

  // Success state
  if (step === "success") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-forge-success">
            <CheckCircle className="h-5 w-5" />
            Authentication Successful
          </CardTitle>
          <CardDescription>
            You have been securely authenticated. Redirecting...
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
            Authentication Failed
          </CardTitle>
          <CardDescription>
            {error || "Unable to verify your identity. Please try again."}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setStep("email");
              clearError();
            }}
          >
            Try Again
          </Button>
          {onRegisterClick && (
            <Button variant="link" onClick={onRegisterClick}>
              Register New Device
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  }

  // Authenticating state
  if (step === "authenticating") {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 animate-pulse text-primary" />
            Verify Your Identity
          </CardTitle>
          <CardDescription>
            Use your fingerprint or face to authenticate. Follow your device&apos;s
            instructions.
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
          Sign In with Biometrics
        </CardTitle>
        <CardDescription>
          Sign in securely using your fingerprint or face. No password required.
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
              autoFocus
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
                Authenticating...
              </>
            ) : (
              <>
                <Fingerprint className="mr-2 h-4 w-4" />
                Sign In
              </>
            )}
          </Button>
          {onRegisterClick && (
            <Button
              type="button"
              variant="link"
              onClick={onRegisterClick}
              className="text-sm"
            >
              Don&apos;t have an account? Register
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

export default BiometricLogin;
