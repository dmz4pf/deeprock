"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

function AuthLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      const needsBiometricPrompt = searchParams.get("needsBiometricPrompt") === "true";
      if (needsBiometricPrompt) {
        setIsChecking(false);
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 100));

      const currentUser = useAuthStore.getState().user;
      const currentIsAuth = useAuthStore.getState().isAuthenticated;

      if (currentUser || currentIsAuth) {
        const isValid = await useAuthStore.getState().validateSession();
        if (isValid) {
          router.replace("/portfolio");
          return;
        }
      }
      setIsChecking(false);
    };
    check();
  }, [router, searchParams]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100dvh' }}>
        <div className="w-10 h-10 rounded-full border-2 border-[rgba(232,180,184,0.15)] border-t-[#E8B4B8] animate-[forgeSpin_0.8s_linear_infinite]" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-3 lg:p-5" style={{ height: '100dvh' }}>
      <div className="app-shell flex flex-col items-center justify-center w-full h-full rounded-none lg:rounded-[20px] lg:max-w-[520px] overflow-hidden bg-[var(--elevation-0)] lg:border lg:border-[rgba(232,180,184,0.06)] relative px-5 py-10"
        style={{ color: "#F0EBE0" }}
      >
        <div className="relative z-[1] w-full max-w-[440px]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function AuthLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center" style={{ height: '100dvh' }}>
        <div className="w-10 h-10 rounded-full border-2 border-[rgba(232,180,184,0.15)] border-t-[#E8B4B8] animate-[forgeSpin_0.8s_linear_infinite]" />
      </div>
    }>
      <AuthLayoutInner>{children}</AuthLayoutInner>
    </Suspense>
  );
}
