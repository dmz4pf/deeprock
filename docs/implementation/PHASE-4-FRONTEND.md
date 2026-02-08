# Phase 4: Frontend Core (Days 22-28)


**Goal:** Build the Next.js 14 frontend with WebAuthn integration, pool browsing, and investment flows.

**Architecture:** Next.js 14 App Router, Zustand state management, TanStack Query for server state, shadcn/ui components.

**Tech Stack:** Next.js 14, TypeScript, TailwindCSS, shadcn/ui, SimpleWebAuthn Browser, ethers.js 6.x

---

## Objectives

1. WebAuthn registration and authentication UI
2. Dashboard with portfolio overview
3. Pool listing and detail pages
4. Investment flow with biometric signing
5. State management (Zustand + TanStack Query)
6. Responsive mobile-first design

## Deliverables

- [ ] Registration flow (email → biometric → confirmation)
- [ ] Login flow with biometric prompt
- [ ] Dashboard (portfolio value, yield, recent activity)
- [ ] Pool listing with filters
- [ ] Pool detail with investment form
- [ ] Investment flow (amount → review → sign → pending → success)
- [ ] Settings page
- [ ] Mobile responsive design
- [ ] Loading and error states

## Dependencies

- Phase 3 complete (backend APIs available)
- SimpleWebAuthn Browser library
- shadcn/ui components installed

---

## Task 4.1: Project Structure and State Management

**Complexity:** Medium | **Time:** 3-4 hours

**Files:**
- Create: `frontend/stores/authStore.ts`
- Create: `frontend/stores/uiStore.ts`
- Create: `frontend/stores/transactionStore.ts`
- Create: `frontend/lib/api.ts`
- Create: `frontend/types/index.ts`

### Step 1: Create Zustand stores

**frontend/stores/authStore.ts:**
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  walletAddress: string;
  displayName?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  expiresAt: string | null;

  // Actions
  login: (user: User, token: string, expiresAt: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      expiresAt: null,

      login: (user, token, expiresAt) =>
        set({
          isAuthenticated: true,
          user,
          token,
          expiresAt,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          expiresAt: null,
        }),

      setUser: (user) => set({ user }),
    }),
    {
      name: "rwa-auth",
      partialize: (state) => ({
        token: state.token,
        expiresAt: state.expiresAt,
      }),
    }
  )
);
```

**frontend/stores/uiStore.ts:**
```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";

type ModalType = "invest" | "redeem" | "biometric" | "confirm" | null;

interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

interface UIState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  theme: "light" | "dark" | "system";
  activeModal: ModalType;
  modalData: any;
  notifications: Notification[];

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  openModal: (modal: ModalType, data?: any) => void;
  closeModal: () => void;
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: "system",
      activeModal: null,
      modalData: null,
      notifications: [],

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => set({ theme }),
      openModal: (modal, data) => set({ activeModal: modal, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),

      addNotification: (notification) =>
        set((s) => ({
          notifications: [
            ...s.notifications,
            { ...notification, id: crypto.randomUUID() },
          ],
        })),

      removeNotification: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),
    }),
    {
      name: "rwa-ui",
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
```

### Step 2: Create API client

**frontend/lib/api.ts:**
```typescript
import { useAuthStore } from "@/stores/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    const token = useAuthStore.getState().token;
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    return headers;
  }

  async get<T>(path: string): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Request failed");
    }

    return res.json();
  }

  async post<T>(path: string, body?: any): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Request failed");
    }

    return res.json();
  }
}

export const api = new ApiClient();

// Auth API
export const authApi = {
  registerOptions: (email: string, displayName?: string) =>
    api.post<{ options: any; challengeId: string }>("/auth/register-options", {
      email,
      displayName,
    }),

  registerVerify: (challengeId: string, response: any) =>
    api.post<{ success: boolean; user: any; publicKey: any }>(
      "/auth/register-verify",
      { challengeId, response }
    ),

  loginOptions: (email: string) =>
    api.post<{ options: any; challengeId: string }>("/auth/login-options", {
      email,
    }),

  loginVerify: (challengeId: string, response: any) =>
    api.post<{ success: boolean; token: string; expiresAt: string; user: any }>(
      "/auth/login-verify",
      { challengeId, response }
    ),

  logout: () => api.post("/auth/logout"),
  session: () => api.get<{ session: any }>("/auth/session"),
};

// Pool API
export const poolApi = {
  list: (params?: { assetClass?: string; status?: string }) =>
    api.get<{ pools: any[] }>(`/pools?${new URLSearchParams(params as any)}`),

  get: (id: string) => api.get<{ pool: any }>(`/pools/${id}`),

  invest: (poolId: string, amount: string, signature: any) =>
    api.post(`/pools/${poolId}/invest`, { amount, ...signature }),

  redeem: (poolId: string, shares: string, signature: any) =>
    api.post(`/pools/${poolId}/redeem`, { shares, ...signature }),
};

// Portfolio API
export const portfolioApi = {
  get: () => api.get<{ portfolio: any }>("/portfolio"),
  yield: () => api.get<{ yield: any[] }>("/portfolio/yield"),
  transactions: () => api.get<{ transactions: any[] }>("/portfolio/transactions"),
};
```

---

## Task 4.2: WebAuthn Integration Hook

**Complexity:** High | **Time:** 4-5 hours

**Files:**
- Create: `frontend/hooks/useWebAuthn.ts`
- Create: `frontend/components/features/auth/BiometricButton.tsx`
- Create: `frontend/components/features/auth/RegistrationFlow.tsx`

### Step 1: Create WebAuthn hook

**frontend/hooks/useWebAuthn.ts:**
```typescript
"use client";

import { useState, useCallback } from "react";
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";

interface WebAuthnError {
  code: string;
  message: string;
  recoverable: boolean;
}

export function useWebAuthn() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<WebAuthnError | null>(null);
  const login = useAuthStore((s) => s.login);

  const isSupported = browserSupportsWebAuthn();

  const register = useCallback(async (email: string, displayName?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get registration options from server
      const { options, challengeId } = await authApi.registerOptions(
        email,
        displayName
      );

      // Step 2: Create credentials using WebAuthn API
      const attestation = await startRegistration(options);

      // Step 3: Verify with server and create user
      const result = await authApi.registerVerify(challengeId, attestation);

      return {
        success: true,
        user: result.user,
        publicKey: result.publicKey,
      };
    } catch (err: any) {
      const webAuthnError = parseWebAuthnError(err);
      setError(webAuthnError);
      throw webAuthnError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const authenticate = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get authentication options
      const { options, challengeId } = await authApi.loginOptions(email);

      // Step 2: Authenticate using WebAuthn
      const assertion = await startAuthentication(options);

      // Step 3: Verify with server and get JWT
      const result = await authApi.loginVerify(challengeId, assertion);

      // Step 4: Store auth state
      login(result.user, result.token, result.expiresAt);

      return { success: true, user: result.user };
    } catch (err: any) {
      const webAuthnError = parseWebAuthnError(err);
      setError(webAuthnError);
      throw webAuthnError;
    } finally {
      setIsLoading(false);
    }
  }, [login]);

  const sign = useCallback(async (challenge: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Create authentication options for signing
      const options = {
        challenge: challenge,
        timeout: 60000,
        rpId: process.env.NEXT_PUBLIC_WEBAUTHN_RP_ID || "localhost",
        userVerification: "required" as const,
      };

      const assertion = await startAuthentication(options);

      return {
        success: true,
        signature: {
          authenticatorData: assertion.response.authenticatorData,
          clientDataJSON: assertion.response.clientDataJSON,
          signature: assertion.response.signature,
        },
      };
    } catch (err: any) {
      const webAuthnError = parseWebAuthnError(err);
      setError(webAuthnError);
      throw webAuthnError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    isLoading,
    error,
    register,
    authenticate,
    sign,
    clearError: () => setError(null),
  };
}

function parseWebAuthnError(error: any): WebAuthnError {
  // Map WebAuthn errors to user-friendly messages
  if (error.name === "NotAllowedError") {
    return {
      code: "CANCELLED",
      message: "Authentication was cancelled. Please try again.",
      recoverable: true,
    };
  }

  if (error.name === "NotSupportedError") {
    return {
      code: "NOT_SUPPORTED",
      message: "Your device doesn't support biometric authentication.",
      recoverable: false,
    };
  }

  if (error.message?.includes("timeout")) {
    return {
      code: "TIMEOUT",
      message: "Authentication timed out. Please try again.",
      recoverable: true,
    };
  }

  return {
    code: "UNKNOWN",
    message: error.message || "An unexpected error occurred.",
    recoverable: true,
  };
}
```

### Step 2: Create BiometricButton component

**frontend/components/features/auth/BiometricButton.tsx:**
```tsx
"use client";

import { Button } from "@/components/ui/button";
import { Fingerprint, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface BiometricButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  children?: React.ReactNode;
  className?: string;
}

export function BiometricButton({
  onClick,
  isLoading,
  disabled,
  variant = "default",
  size = "default",
  children,
  className,
}: BiometricButtonProps) {
  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Fingerprint className="h-4 w-4" />
      )}
      {children || "Authenticate with Biometrics"}
    </Button>
  );
}
```

### Step 3: Create RegistrationFlow component

**frontend/components/features/auth/RegistrationFlow.tsx:**
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWebAuthn } from "@/hooks/useWebAuthn";
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
import { BiometricButton } from "./BiometricButton";
import { CheckCircle, AlertCircle, Mail, User, Fingerprint } from "lucide-react";

type Step = "email" | "biometric" | "confirming" | "success" | "error";

export function RegistrationFlow() {
  const router = useRouter();
  const { register, isLoading, error, isSupported } = useWebAuthn();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [registeredUser, setRegisteredUser] = useState<any>(null);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && isSupported) {
      setStep("biometric");
    }
  };

  const handleBiometricRegister = async () => {
    try {
      setStep("confirming");
      const result = await register(email, displayName);
      setRegisteredUser(result.user);
      setStep("success");
    } catch (err) {
      setStep("error");
    }
  };

  const handleContinue = () => {
    router.push("/dashboard");
  };

  if (!isSupported) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Biometrics Not Supported
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Your device or browser doesn't support biometric authentication.
            Please try a different device or use a supported browser (Chrome, Safari, Firefox).
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Your Account</CardTitle>
        <CardDescription>
          Register with your email and biometrics for secure, passwordless access.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {["email", "biometric", "success"].map((s, i) => (
            <div
              key={s}
              className={cn(
                "w-3 h-3 rounded-full",
                step === s || (step === "confirming" && s === "biometric") || (step === "error" && s === "biometric")
                  ? "bg-primary"
                  : i < ["email", "biometric", "success"].indexOf(step)
                  ? "bg-primary/50"
                  : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Step: Email */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Display Name (Optional)</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Button type="submit" className="w-full">
              Continue
            </Button>
          </form>
        )}

        {/* Step: Biometric */}
        {step === "biometric" && (
          <div className="text-center space-y-6">
            <div className="p-6 bg-muted rounded-full w-24 h-24 mx-auto flex items-center justify-center">
              <Fingerprint className="h-12 w-12 text-primary" />
            </div>

            <div>
              <h3 className="font-medium mb-1">Set Up Biometrics</h3>
              <p className="text-sm text-muted-foreground">
                When prompted, use Face ID, Touch ID, or your device's biometric sensor.
              </p>
            </div>

            <BiometricButton
              onClick={handleBiometricRegister}
              isLoading={isLoading}
              className="w-full"
            >
              Register Biometrics
            </BiometricButton>

            <Button
              variant="ghost"
              onClick={() => setStep("email")}
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}

        {/* Step: Confirming */}
        {step === "confirming" && (
          <div className="text-center space-y-4 py-6">
            <div className="animate-pulse">
              <Fingerprint className="h-12 w-12 mx-auto text-primary" />
            </div>
            <p className="text-muted-foreground">
              Verifying your biometrics and creating your account...
            </p>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="text-center space-y-6">
            <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>

            <div>
              <h3 className="font-medium text-lg mb-1">Registration Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Your account has been created with biometric authentication.
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg text-left">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-mono text-sm">{registeredUser?.email}</p>
              <p className="text-sm text-muted-foreground mt-2">Wallet Address</p>
              <p className="font-mono text-xs break-all">{registeredUser?.walletAddress}</p>
            </div>

            <Button onClick={handleContinue} className="w-full">
              Go to Dashboard
            </Button>
          </div>
        )}

        {/* Step: Error */}
        {step === "error" && (
          <div className="text-center space-y-6">
            <div className="p-4 bg-red-100 dark:bg-red-900/20 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>

            <div>
              <h3 className="font-medium text-lg mb-1">Registration Failed</h3>
              <p className="text-sm text-muted-foreground">
                {error?.message || "Something went wrong. Please try again."}
              </p>
            </div>

            <Button onClick={() => setStep("biometric")} className="w-full">
              Try Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
```

---

## Task 4.3: Dashboard Page

**Complexity:** Medium | **Time:** 4-5 hours

**Files:**
- Create: `frontend/app/(app)/dashboard/page.tsx`
- Create: `frontend/components/features/portfolio/PortfolioSummary.tsx`
- Create: `frontend/components/features/portfolio/RecentActivity.tsx`

### Key Components

```tsx
// frontend/app/(app)/dashboard/page.tsx

import { PortfolioSummary } from "@/components/features/portfolio/PortfolioSummary";
import { RecentActivity } from "@/components/features/portfolio/RecentActivity";
import { YieldCard } from "@/components/features/portfolio/YieldCard";

export default function DashboardPage() {
  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Portfolio Overview */}
      <PortfolioSummary />

      {/* Yield and Activity Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        <YieldCard />
        <RecentActivity />
      </div>
    </div>
  );
}
```

---

## Task 4.4: Pool Listing and Investment Flow

**Complexity:** High | **Time:** 6-8 hours

**Files:**
- Create: `frontend/app/(app)/pools/page.tsx`
- Create: `frontend/app/(app)/pools/[id]/page.tsx`
- Create: `frontend/components/features/pools/PoolCard.tsx`
- Create: `frontend/components/features/pools/PoolFilters.tsx`
- Create: `frontend/components/features/pools/InvestmentForm.tsx`

### Investment Flow Component

**frontend/components/features/pools/InvestmentForm.tsx:**
```tsx
"use client";

import { useState } from "react";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { poolApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BiometricButton } from "@/components/features/auth/BiometricButton";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";

type Step = "amount" | "review" | "signing" | "pending" | "success";

interface InvestmentFormProps {
  pool: {
    id: string;
    name: string;
    minInvestment: string;
    maxInvestment: string;
    yieldRate: number;
  };
  onComplete?: () => void;
}

export function InvestmentForm({ pool, onComplete }: InvestmentFormProps) {
  const { sign, isLoading } = useWebAuthn();
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState("");
  const [txHash, setTxHash] = useState("");

  const handleAmountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    const min = parseFloat(pool.minInvestment);
    const max = parseFloat(pool.maxInvestment);

    if (value >= min && value <= max) {
      setStep("review");
    }
  };

  const handleSign = async () => {
    try {
      setStep("signing");

      // Create signing challenge
      const deadline = Math.floor(Date.now() / 1000) + 300; // 5 min
      const challenge = `INVEST:${pool.id}:${amount}:${deadline}`;

      // Sign with biometrics
      const { signature } = await sign(challenge);

      setStep("pending");

      // Submit to backend
      const result = await poolApi.invest(pool.id, amount, {
        deadline,
        ...signature,
      });

      setTxHash(result.txHash);
      setStep("success");
    } catch (err) {
      setStep("review");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invest in {pool.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Step: Amount */}
        {step === "amount" && (
          <form onSubmit={handleAmountSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Investment Amount (USDC)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min={pool.minInvestment}
                max={pool.maxInvestment}
                step="0.01"
              />
              <p className="text-xs text-muted-foreground">
                Min: ${pool.minInvestment} • Max: ${pool.maxInvestment}
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={!amount}>
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <div className="space-y-6">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">${amount} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expected Yield</span>
                <span className="font-medium">{pool.yieldRate}% APY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gas Fee</span>
                <span className="font-medium text-green-600">Free (Relayed)</span>
              </div>
            </div>

            <BiometricButton
              onClick={handleSign}
              isLoading={isLoading}
              className="w-full"
            >
              Confirm with Biometrics
            </BiometricButton>

            <Button
              variant="ghost"
              onClick={() => setStep("amount")}
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}

        {/* Step: Signing */}
        {step === "signing" && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">
              Complete biometric authentication on your device...
            </p>
          </div>
        )}

        {/* Step: Pending */}
        {step === "pending" && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
            <p className="mt-4 font-medium">Submitting transaction...</p>
            <p className="text-sm text-muted-foreground">
              Waiting for blockchain confirmation
            </p>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="text-center space-y-4 py-4">
            <div className="p-4 bg-green-100 dark:bg-green-900/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>

            <div>
              <h3 className="font-medium text-lg">Investment Successful!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                You invested ${amount} USDC in {pool.name}
              </p>
            </div>

            {txHash && (
              <a
                href={`https://testnet.snowtrace.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                View on Snowtrace →
              </a>
            )}

            <Button onClick={onComplete} className="w-full">
              Done
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Phase 4 Definition of Done

- [ ] Registration flow works end-to-end
- [ ] Login flow works with biometrics
- [ ] Dashboard shows portfolio data
- [ ] Pool listing with filters
- [ ] Pool detail page
- [ ] Investment flow with biometric signing
- [ ] All pages mobile responsive
- [ ] Loading and error states handled
- [ ] Navigation and routing complete
- [ ] TanStack Query caching working

## Estimated Total Time: 35-45 hours

## Next Phase

Continue to [PHASE-5-INTEGRATION.md](./PHASE-5-INTEGRATION.md) for end-to-end testing and polish.
