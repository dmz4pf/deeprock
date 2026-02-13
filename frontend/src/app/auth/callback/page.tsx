"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { validateSession, setIsNewUser, setAuthStep, setHasBiometrics } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      const success = searchParams.get("success");
      const error = searchParams.get("error");
      const isNewUser = searchParams.get("isNewUser") === "true";
      const hasBiometrics = searchParams.get("hasBiometrics") === "true";

      if (error) {
        toast.error(decodeURIComponent(error));
        router.push("/login");
        return;
      }

      if (success === "true") {
        // Validate the session (cookie should be set)
        const isValid = await validateSession();

        if (isValid) {
          // Show biometric prompt if user is new OR doesn't have biometrics
          const needsBiometricPrompt = isNewUser || !hasBiometrics;

          if (needsBiometricPrompt) {
            setIsNewUser(isNewUser);
            setHasBiometrics(hasBiometrics);
            setAuthStep("biometric-prompt");
            // Pass params via URL since authStep isn't persisted
            router.push(`/login?needsBiometricPrompt=true`);
          } else {
            router.push("/portfolio");
          }
        } else {
          toast.error("Session validation failed");
          router.push("/login");
        }
      } else {
        // No success param - redirect to login
        router.push("/login");
      }
    };

    handleCallback();
  }, [searchParams, router, validateSession, setIsNewUser, setAuthStep, setHasBiometrics]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-4 text-muted-foreground">Completing sign in...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Completing sign in...</p>
      </div>
    }>
      <AuthCallbackInner />
    </Suspense>
  );
}
