"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Fingerprint, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { startRegistration } from "@simplewebauthn/browser";
import { authApi } from "@/lib/api";

interface BiometricLinkingPromptProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function BiometricLinkingPrompt({
  onComplete,
  onSkip,
}: BiometricLinkingPromptProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSetupBiometric = async () => {
    setIsLoading(true);
    try {
      // Use authenticated endpoint to add passkey to existing account
      const optionsResult = await authApi.addPasskeyOptions();

      const attestation = await startRegistration({
        optionsJSON: optionsResult.options,
      });

      await authApi.registerVerify(optionsResult.challengeId, attestation);

      toast.success("Biometric authentication enabled!");
      onComplete();
    } catch (error: unknown) {
      console.error("Biometric setup error:", error);

      const webAuthnError = error as { name?: string; message?: string };

      if (webAuthnError.name === "NotAllowedError") {
        toast.error("Biometric setup was cancelled");
      } else if (webAuthnError.name === "InvalidStateError") {
        toast.error("This device is already registered");
        onComplete();
      } else {
        toast.error(webAuthnError.message || "Failed to set up biometric authentication");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Fingerprint className="h-8 w-8 text-primary" />
        </div>
        <CardTitle className="text-2xl">Enable Passkey Login</CardTitle>
        <CardDescription>
          Set up Face ID, Touch ID, or Windows Hello for faster, more secure
          logins
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-primary">1</span>
            </div>
            <p className="text-muted-foreground">
              Your biometric data never leaves your device
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-primary">2</span>
            </div>
            <p className="text-muted-foreground">
              Sign transactions instantly without passwords
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-primary">3</span>
            </div>
            <p className="text-muted-foreground">
              Phishing-resistant authentication for maximum security
            </p>
          </div>
        </div>

        <Button
          className="w-full h-12"
          onClick={handleSetupBiometric}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              <Fingerprint className="mr-2 h-5 w-5" />
              Set up Passkey
            </>
          )}
        </Button>

        <Button
          variant="ghost"
          className="w-full"
          onClick={onSkip}
          disabled={isLoading}
        >
          Skip for now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          You can always enable this later in Settings
        </p>
      </CardContent>
    </Card>
  );
}
