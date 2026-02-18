"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import {
  EmailVerificationFlow,
  WalletAuthFlow,
  BiometricLinkingPrompt,
} from "@/components/auth";
import { useBiometric } from "@/hooks/useBiometric";
import {
  Fingerprint,
  Mail,
  Chrome,
  Wallet,
  Loader2,
  CheckCircle,
  XCircle,
  Shield,
  ArrowRight,
  Zap,
} from "lucide-react";
import { QGPageEntrance } from "@/components/previews/quantum-grid/primitives";

type LocalStep =
  | "select-method"
  | "email-input"
  | "email-verify"
  | "wallet-connect"
  | "wallet-sign"
  | "biometric-prompt";

/* ─── Passkey button state ─── */
type PasskeyState = "idle" | "authenticating" | "success" | "error";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    login,
    authStep,
    setAuthStep,
    pendingEmail,
    setPendingEmail,
    setIsNewUser,
  } = useAuthStore();

  const {
    isLoading: biometricLoading,
    error: biometricError,
    authenticate,
    clearError,
  } = useBiometric();

  const [localStep, setLocalStep] = useState<LocalStep>(
    authStep === "authenticated" ? "select-method" : (authStep as LocalStep)
  );
  const [localEmail, setLocalEmail] = useState(pendingEmail || "");
  const [passkeyState, setPasskeyState] = useState<PasskeyState>("idle");
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);

  // Handle OAuth callback and biometric prompt
  useEffect(() => {
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    const isNew = searchParams.get("isNewUser");
    const needsBiometricPrompt = searchParams.get("needsBiometricPrompt");

    if (success === "true") {
      toast.success("Signed in successfully!");
      if (isNew === "true" || needsBiometricPrompt === "true") {
        setLocalStep("biometric-prompt");
        setIsNewUser(isNew === "true");
      } else {
        router.push("/portfolio");
      }
    } else if (isNew === "true" || needsBiometricPrompt === "true") {
      setLocalStep("biometric-prompt");
      setIsNewUser(isNew === "true");
    } else if (error) {
      toast.error(decodeURIComponent(error));
      setLocalStep("select-method");
    }
  }, [searchParams, router, setIsNewUser]);

  // Sync local state with store
  useEffect(() => {
    if (authStep !== "authenticated" && authStep !== "google-pending") {
      setLocalStep(authStep as LocalStep);
    }
    setLocalEmail(pendingEmail || "");
  }, [authStep, pendingEmail]);

  /* ─── Handlers ─── */
  const handlePasskeyAuth = async () => {
    clearError();
    setPasskeyState("authenticating");
    const result = await authenticate();
    if (result.success && result.user && result.csrfToken) {
      setPasskeyState("success");
      setTimeout(() => {
        login(
          {
            id: result.user!.id,
            email: result.user!.email,
            walletAddress: result.user!.walletAddress,
            displayName: result.user!.email?.split("@")[0] || null,
            authProvider: "EMAIL",
          },
          result.csrfToken!,
          false, // not a new user
          true   // has biometrics — they just authenticated with a passkey
        );
        router.push("/portfolio");
      }, 800);
    } else {
      setPasskeyState("error");
    }
  };

  const handleSelectEmail = () => {
    setLocalStep("email-input");
    setAuthStep("email-input");
  };

  const handleSelectGoogle = () => {
    window.location.href = authApi.getGoogleAuthUrl();
  };

  const handleSelectWallet = () => {
    setLocalStep("wallet-connect");
    setAuthStep("wallet-connect");
  };

  const handleBack = () => {
    setLocalStep("select-method");
    setAuthStep("select-method");
    setPendingEmail(null);
    setLocalEmail("");
  };

  const handleEmailChange = (email: string) => setLocalEmail(email);

  const handleEmailStepChange = (step: "email-input" | "email-verify") => {
    setLocalStep(step);
    setAuthStep(step);
    if (step === "email-verify") setPendingEmail(localEmail);
  };

  const handleEmailVerified = (
    user: { id: string; email: string; walletAddress: string; authProvider: string },
    csrfToken: string,
    isNew: boolean,
    hasBiometrics: boolean = false
  ) => {
    login(
      {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        displayName: user.email?.split("@")[0] || null,
        authProvider: user.authProvider as "EMAIL" | "GOOGLE" | "WALLET",
      },
      csrfToken,
      isNew,
      hasBiometrics
    );
    if (isNew || !hasBiometrics) {
      setLocalStep("biometric-prompt");
    } else {
      router.push("/portfolio");
    }
  };

  const handleWalletAuthenticated = (
    user: { id: string; email: string | null; walletAddress: string; authProvider: string },
    csrfToken: string,
    isNew: boolean,
    hasBiometrics: boolean = false
  ) => {
    login(
      {
        id: user.id,
        email: user.email,
        walletAddress: user.walletAddress,
        displayName: user.walletAddress
          ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
          : null,
        authProvider: user.authProvider as "EMAIL" | "GOOGLE" | "WALLET",
      },
      csrfToken,
      isNew,
      hasBiometrics
    );
    router.push("/portfolio");
  };

  const handleBiometricComplete = () => {
    setAuthStep("authenticated");
    router.push("/portfolio");
  };
  const handleBiometricSkip = () => {
    setAuthStep("authenticated");
    router.push("/portfolio");
  };

  /* ─── Sub-flow renders ─── */
  switch (localStep) {
    case "email-input":
    case "email-verify":
      return (
        <EmailVerificationFlow
          step={localStep}
          email={localEmail}
          onEmailChange={handleEmailChange}
          onCodeVerified={handleEmailVerified}
          onBack={handleBack}
          onStepChange={handleEmailStepChange}
        />
      );
    case "wallet-connect":
    case "wallet-sign":
      return (
        <WalletAuthFlow
          step={localStep}
          onAuthenticated={handleWalletAuthenticated}
          onBack={handleBack}
        />
      );
    case "biometric-prompt":
      return (
        <BiometricLinkingPrompt
          onComplete={handleBiometricComplete}
          onSkip={handleBiometricSkip}
        />
      );
  }

  /* ─── Main Login Screen ─── */
  return (
    <div style={{ width: "100%", maxWidth: 420, margin: "0 auto" }}>
      {/* ─── Logo & Branding ─── */}
      <QGPageEntrance staggerIndex={0}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        {/* App icon */}
        <img
          src="/icon-192.png"
          alt="DeepRock"
          style={{
            width: 48,
            height: 48,
            margin: "0 auto 20px",
            borderRadius: 12,
            objectFit: "cover",
          }}
        />
        <h1
          style={{
            fontFamily: "var(--font-serif), 'Playfair Display', serif",
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: "#F0EBE0",
            margin: "0 0 8px",
          }}
        >
          Welcome Back
        </h1>
        <p style={{ fontSize: 14, color: "#5A5347", margin: 0, lineHeight: 1.5 }}>
          Sign in to your Deeprock account
        </p>
      </div>
      </QGPageEntrance>

      {/* ─── Passkey (Primary CTA) ─── */}
      <QGPageEntrance staggerIndex={1}>
      <button
        onClick={passkeyState === "error" ? () => { setPasskeyState("idle"); clearError(); } : handlePasskeyAuth}
        disabled={passkeyState === "authenticating" || passkeyState === "success"}
        style={{
          width: "100%",
          height: 56,
          borderRadius: 12,
          border: "none",
          cursor: passkeyState === "authenticating" ? "wait" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          fontSize: 16,
          fontWeight: 500,
          fontFamily: "var(--font-sans), 'Outfit', sans-serif",
          color: "#fff",
          backgroundImage: passkeyState === "error"
            ? "linear-gradient(135deg, #EB5757, #8B3A30)"
            : passkeyState === "success"
              ? "linear-gradient(135deg, #D4A853, #CD7F32)"
              : "linear-gradient(135deg, rgba(232,180,184,0.6) 0%, rgba(196,162,101,0.5) 40%, rgba(212,168,83,0.55) 70%, rgba(205,127,50,0.6) 100%)",
          backgroundSize: "300% 100%",
          animationName: passkeyState === "idle" ? "forgeGradientShift" : "none",
          animationDuration: "8s",
          animationTimingFunction: "ease",
          animationIterationCount: "infinite",
          transition: "all 0.3s ease, transform 0.2s ease",
          boxShadow: passkeyState === "error"
            ? "0 4px 24px rgba(235,87,87,0.25)"
            : passkeyState === "success"
              ? "0 4px 24px rgba(111,207,151,0.25)"
              : "0 4px 24px rgba(232,180,184,0.2)",
          transform: passkeyState === "authenticating" ? "scale(0.98)" : "scale(1)",
        }}
      >
        {passkeyState === "authenticating" ? (
          <>
            <Loader2 size={20} style={{ animation: "forgeSpin 0.8s linear infinite" }} />
            Verifying identity...
          </>
        ) : passkeyState === "success" ? (
          <>
            <CheckCircle size={20} />
            Authenticated
          </>
        ) : passkeyState === "error" ? (
          <>
            <XCircle size={20} />
            Passkey failed — Tap to retry
          </>
        ) : (
          <>
            <Fingerprint size={20} />
            Sign in with Passkey
          </>
        )}
      </button>

      {/* Recovery link */}
      <div style={{ textAlign: "center", marginTop: 12, marginBottom: 32 }}>
        <a
          href="/recover"
          style={{
            fontSize: 13,
            color: "#5A5347",
            textDecoration: "none",
            transition: "color 0.2s",
          }}
          className="forge-back-link"
        >
          Lost your passkey? Recover account
        </a>
      </div>
      </QGPageEntrance>

      {/* ─── Divider ─── */}
      <QGPageEntrance staggerIndex={2}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
        <div style={{ flex: 1, height: 1, background: "rgba(232,180,184,0.1)" }} />
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5A5347" }}>
          or continue with
        </span>
        <div style={{ flex: 1, height: 1, background: "rgba(232,180,184,0.1)" }} />
      </div>

      {/* ─── Auth Methods ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {[
          { id: "email", icon: Mail, label: "Email", desc: "OTP verification", onClick: handleSelectEmail, accent: "#E8B4B8" },
          { id: "google", icon: Chrome, label: "Google", desc: "Quick sign-in", onClick: handleSelectGoogle, accent: "#C4A265" },
          { id: "wallet", icon: Wallet, label: "MetaMask", desc: "Web3 wallet", onClick: handleSelectWallet, accent: "#D4A853" },
        ].map((method) => (
          <button
            key={method.id}
            onClick={method.onClick}
            onMouseEnter={() => setHoveredMethod(method.id)}
            onMouseLeave={() => setHoveredMethod(null)}
            style={{
              width: "100%",
              height: 52,
              borderRadius: 10,
              border: `1px solid ${hoveredMethod === method.id ? `${method.accent}40` : "rgba(232,180,184,0.08)"}`,
              background: hoveredMethod === method.id ? "rgba(232,180,184,0.04)" : "#14120E",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              gap: 14,
              transition: "all 0.25s ease",
              transform: hoveredMethod === method.id ? "translateX(2px)" : "none",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: `${method.accent}12`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <method.icon size={16} style={{ color: method.accent }} />
            </div>
            <div style={{ textAlign: "left", flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "#F0EBE0", fontFamily: "var(--font-sans), 'Outfit', sans-serif" }}>
                {method.label}
              </div>
              <div style={{ fontSize: 12, color: "#5A5347" }}>
                {method.desc}
              </div>
            </div>
            <ArrowRight
              size={14}
              style={{
                color: hoveredMethod === method.id ? method.accent : "#5A5347",
                transition: "all 0.25s ease",
                opacity: hoveredMethod === method.id ? 1 : 0.4,
                transform: hoveredMethod === method.id ? "translateX(2px)" : "none",
              }}
            />
          </button>
        ))}
      </div>
      </QGPageEntrance>

      {/* ─── Footer ─── */}
      <QGPageEntrance staggerIndex={3}>
      <div style={{ marginTop: 32, textAlign: "center" }}>
        <p style={{ fontSize: 12, color: "#5A5347", lineHeight: 1.6 }}>
          By continuing, you agree to our{" "}
          <span style={{ color: "#B8A99A" }}>Terms of Service</span>{" "}
          and{" "}
          <span style={{ color: "#B8A99A" }}>Privacy Policy</span>
        </p>
      </div>

      {/* ─── Trust badges ─── */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 24,
          marginTop: 28,
          paddingTop: 22,
          borderTop: "1px solid rgba(232,180,184,0.06)",
        }}
      >
        {[
          { icon: Shield, text: "Bank-grade", sub: "security" },
          { icon: Zap, text: "Zero gas", sub: "fees" },
          { icon: Fingerprint, text: "Biometric", sub: "auth" },
        ].map((badge) => (
          <div
            key={badge.text}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(232,180,184,0.06)",
                border: "1px solid rgba(232,180,184,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <badge.icon size={16} style={{ color: "#E8B4B8", opacity: 0.7 }} />
            </div>
            <div style={{ textAlign: "center", lineHeight: 1.3 }}>
              <div style={{ fontSize: 11, color: "#B8A99A", fontWeight: 500 }}>{badge.text}</div>
              <div style={{ fontSize: 10, color: "#5A5347" }}>{badge.sub}</div>
            </div>
          </div>
        ))}
      </div>
      </QGPageEntrance>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "2px solid rgba(232,180,184,0.15)",
              borderTopColor: "#E8B4B8",
              animation: "forgeSpin 0.8s linear infinite",
            }}
          />
        </div>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
