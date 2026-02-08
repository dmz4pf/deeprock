# RWA Gateway Architecture Document
## Phase 3: Frontend Architecture

**Version:** 1.1
**Date:** February 5, 2026
**Status:** DRAFT
**Project:** RWA Gateway - Biometric Real-World Asset Tokenization on Avalanche

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Frontend Architecture Overview](#2-frontend-architecture-overview)
3. [Directory Structure](#3-directory-structure)
4. [Page Architecture](#4-page-architecture)
5. [Component Architecture](#5-component-architecture)
6. [State Management](#6-state-management)
7. [WebAuthn Integration Architecture](#7-webauthn-integration-architecture)
8. [Web3 Integration](#8-web3-integration)
9. [API Integration Layer](#9-api-integration-layer)
10. [Styling Architecture](#10-styling-architecture)
11. [Performance Optimization](#11-performance-optimization)
12. [Testing Strategy](#12-testing-strategy)

---

## 1. Executive Summary

The RWA Gateway frontend is a Next.js 14 application built with the App Router, designed to provide a seamless biometric-first experience for investing in tokenized real-world assets. The architecture prioritizes three key objectives: (1) frictionless WebAuthn authentication that feels native, (2) real-time portfolio visibility with optimistic updates, and (3) progressive disclosure of complexity to serve both crypto-native and traditional investors.

The frontend acts as an orchestration layer between the user's biometric-capable device and the Avalanche blockchain, abstracting away wallet management, gas fees, and cryptographic operations while maintaining full transparency through Snowtrace links and verification hashes.

---

## 2. Frontend Architecture Overview

### 2.1 Application Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                              BROWSER ENVIRONMENT                                    |
+-----------------------------------------------------------------------------------+
|                                                                                     |
|  +-----------------------------------------------------------------------------+   |
|  |                           Next.js 14 App Router                              |   |
|  |                                                                              |   |
|  |  +------------------+  +------------------+  +------------------+            |   |
|  |  |   Layout Shell   |  |   Route Groups   |  |   API Routes     |            |   |
|  |  |   (RootLayout)   |  |   (auth)/(app)   |  |   /api/*         |            |   |
|  |  +--------+---------+  +--------+---------+  +--------+---------+            |   |
|  |           |                     |                     |                      |   |
|  +-----------+---------------------+---------------------+----------------------+   |
|              |                     |                     |                          |
|  +-----------v---------------------v---------------------v----------------------+   |
|  |                           PRESENTATION LAYER                                 |   |
|  |                                                                              |   |
|  |  +------------------+  +------------------+  +------------------+            |   |
|  |  |    Pages         |  |   Components     |  |    Layouts       |            |   |
|  |  |    (Views)       |  |   (UI Library)   |  |    (Shells)      |            |   |
|  |  +--------+---------+  +--------+---------+  +--------+---------+            |   |
|  |           |                     |                     |                      |   |
|  +-----------+---------------------+---------------------+----------------------+   |
|              |                     |                     |                          |
|  +-----------v---------------------v---------------------v----------------------+   |
|  |                           APPLICATION LAYER                                  |   |
|  |                                                                              |   |
|  |  +------------------+  +------------------+  +------------------+            |   |
|  |  |   TanStack       |  |    Zustand       |  |    Custom        |            |   |
|  |  |   Query          |  |    Stores        |  |    Hooks         |            |   |
|  |  |   (Server State) |  |   (Client State) |  |   (Logic)        |            |   |
|  |  +--------+---------+  +--------+---------+  +--------+---------+            |   |
|  |           |                     |                     |                      |   |
|  +-----------+---------------------+---------------------+----------------------+   |
|              |                     |                     |                          |
|  +-----------v---------------------v---------------------v----------------------+   |
|  |                           INTEGRATION LAYER                                  |   |
|  |                                                                              |   |
|  |  +------------------+  +------------------+  +------------------+            |   |
|  |  |   API Client     |  |   Web3 Provider  |  |   WebAuthn       |            |   |
|  |  |   (fetch/axios)  |  |   (ethers.js)    |  |   (SimpleWebAut) |            |   |
|  |  +--------+---------+  +--------+---------+  +--------+---------+            |   |
|  |           |                     |                     |                      |   |
|  +-----------+---------------------+---------------------+----------------------+   |
|              |                     |                     |                          |
+-----------------------------------------------------------------------------------+
               |                     |                     |
               v                     v                     v
        +-------------+       +-------------+       +-------------+
        |   Backend   |       |  Avalanche  |       |   Device    |
        |   API       |       |  C-Chain    |       |   Secure    |
        |             |       |             |       |   Enclave   |
        +-------------+       +-------------+       +-------------+
```

### 2.2 Technology Stack Summary

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14 (App Router) | SSR, routing, API routes |
| Language | TypeScript 5.x | Type safety |
| Styling | TailwindCSS 3.4 + shadcn/ui | Utility CSS + accessible components |
| Client State | Zustand 4.x | UI state, user preferences |
| Server State | TanStack Query 5.x | API caching, background sync |
| Forms | React Hook Form + Zod | Validation, submission |
| Web3 | ethers.js 6.x | Blockchain interaction |
| WebAuthn | SimpleWebAuthn 10.x | Biometric authentication |
| Charts | Recharts 2.x | Portfolio visualization |
| Animation | Framer Motion 11.x | Micro-interactions |
| Icons | Lucide React | Consistent iconography |

---

## 3. Directory Structure

```
frontend/
|-- app/                          # Next.js App Router
|   |-- (auth)/                   # Public routes (no auth required)
|   |   |-- page.tsx              # Landing page (/)
|   |   |-- register/
|   |   |   |-- page.tsx          # Biometric registration
|   |   |-- layout.tsx            # Auth layout (minimal chrome)
|   |
|   |-- (app)/                    # Protected routes (auth required)
|   |   |-- dashboard/
|   |   |   |-- page.tsx          # Main dashboard
|   |   |-- pools/
|   |   |   |-- page.tsx          # Pool listing
|   |   |   |-- [id]/
|   |   |       |-- page.tsx      # Pool detail + invest
|   |   |-- portfolio/
|   |   |   |-- page.tsx          # Holdings view
|   |   |-- credentials/
|   |   |   |-- page.tsx          # KYC status
|   |   |-- documents/
|   |   |   |-- page.tsx          # Document signing
|   |   |-- settings/
|   |   |   |-- page.tsx          # User preferences
|   |   |-- layout.tsx            # App layout (sidebar, header)
|   |
|   |-- api/                      # API routes
|   |   |-- webauthn/
|   |   |   |-- register-options/route.ts
|   |   |   |-- register-verify/route.ts
|   |   |   |-- auth-options/route.ts
|   |   |   |-- auth-verify/route.ts
|   |   |-- pools/
|   |   |   |-- route.ts
|   |   |   |-- [id]/
|   |   |       |-- route.ts
|   |   |       |-- invest/route.ts
|   |   |-- user/
|   |       |-- route.ts
|   |       |-- credentials/route.ts
|   |
|   |-- layout.tsx                # Root layout
|   |-- globals.css               # Global styles
|   |-- providers.tsx             # Client providers wrapper
|
|-- components/
|   |-- ui/                       # shadcn/ui primitives
|   |   |-- button.tsx
|   |   |-- card.tsx
|   |   |-- dialog.tsx
|   |   |-- input.tsx
|   |   |-- ... (40+ components)
|   |
|   |-- features/                 # Feature-specific components
|   |   |-- auth/
|   |   |   |-- BiometricButton.tsx
|   |   |   |-- BiometricPrompt.tsx
|   |   |   |-- RegistrationFlow.tsx
|   |   |-- pools/
|   |   |   |-- PoolCard.tsx
|   |   |   |-- PoolList.tsx
|   |   |   |-- PoolFilters.tsx
|   |   |   |-- InvestmentForm.tsx
|   |   |-- portfolio/
|   |   |   |-- HoldingsTable.tsx
|   |   |   |-- YieldChart.tsx
|   |   |   |-- AllocationPie.tsx
|   |   |   |-- TransactionHistory.tsx
|   |   |-- credentials/
|   |   |   |-- CredentialBadge.tsx
|   |   |   |-- KYCStatus.tsx
|   |   |   |-- VerificationFlow.tsx
|   |   |-- documents/
|   |       |-- DocumentCard.tsx
|   |       |-- SignatureFlow.tsx
|   |
|   |-- layout/                   # Layout components
|   |   |-- Header.tsx
|   |   |-- Sidebar.tsx
|   |   |-- Footer.tsx
|   |   |-- MobileNav.tsx
|   |
|   |-- shared/                   # Shared components
|       |-- LoadingSpinner.tsx
|       |-- ErrorBoundary.tsx
|       |-- EmptyState.tsx
|       |-- ConfirmDialog.tsx
|       |-- TrustBadge.tsx
|       |-- SnowtraceLink.tsx
|
|-- hooks/                        # Custom React hooks
|   |-- useWebAuthn.ts            # WebAuthn registration/auth
|   |-- useContract.ts            # Contract interactions
|   |-- usePool.ts                # Pool data fetching
|   |-- usePortfolio.ts           # Portfolio aggregation
|   |-- useCredentials.ts         # Credential status
|   |-- useTransaction.ts         # Transaction lifecycle
|   |-- useToast.ts               # Toast notifications
|
|-- stores/                       # Zustand stores
|   |-- authStore.ts              # Auth state
|   |-- uiStore.ts                # UI preferences
|   |-- transactionStore.ts       # Pending transactions
|
|-- lib/                          # Utilities and configurations
|   |-- api/
|   |   |-- client.ts             # API client setup
|   |   |-- endpoints.ts          # Endpoint definitions
|   |   |-- types.ts              # API response types
|   |-- web3/
|   |   |-- provider.ts           # ethers.js provider
|   |   |-- contracts.ts          # Contract instances
|   |   |-- abis/                 # Contract ABIs
|   |       |-- BiometricRegistry.json
|   |       |-- CredentialVerifier.json
|   |       |-- RWAGateway.json
|   |       |-- RWAToken.json
|   |-- webauthn/
|   |   |-- client.ts             # WebAuthn client helpers
|   |   |-- encoding.ts           # Base64/buffer utilities
|   |-- utils/
|   |   |-- format.ts             # Number/date formatting
|   |   |-- validation.ts         # Zod schemas
|   |   |-- constants.ts          # App constants
|   |-- config.ts                 # Environment config
|
|-- types/                        # TypeScript types
|   |-- api.ts                    # API types
|   |-- web3.ts                   # Blockchain types
|   |-- webauthn.ts               # WebAuthn types
|   |-- pool.ts                   # Pool domain types
|   |-- user.ts                   # User domain types
|
|-- public/                       # Static assets
|   |-- images/
|   |-- icons/
|
|-- tests/                        # Test files
    |-- unit/
    |-- integration/
    |-- e2e/
```

---

## 4. Page Architecture

### 4.1 Route Overview

| Route | Page | Auth | Layout | Description |
|-------|------|------|--------|-------------|
| `/` | Landing | No | Auth | Hero, features, CTA |
| `/register` | Registration | No | Auth | Biometric onboarding |
| `/dashboard` | Dashboard | Yes | App | Portfolio summary |
| `/pools` | Pool List | Yes | App | Browse RWA pools |
| `/pools/[id]` | Pool Detail | Yes | App | Invest/redeem |
| `/portfolio` | Portfolio | Yes | App | Holdings detail |
| `/credentials` | Credentials | Yes | App | KYC management |
| `/documents` | Documents | Yes | App | Document signing |
| `/settings` | Settings | Yes | App | Preferences |

### 4.2 Page Specifications

#### 4.2.1 Landing Page (`/`)

```typescript
// app/(auth)/page.tsx

interface LandingPageData {
  stats: {
    tvl: string;           // "$2.4M"
    pools: number;         // 5
    investors: number;     // 847
    avgYield: string;      // "4.5%"
  };
  featuredPools: PoolSummary[];
}

// Data Requirements:
// - GET /api/stats (public, cached 5min)
// - GET /api/pools?featured=true (public, cached 5min)

// State Management:
// - No auth state required
// - TanStack Query for data fetching

// Key Components:
// - HeroSection: Value proposition + CTA
// - StatsBar: TVL, pools, investors
// - FeatureGrid: 3-column feature highlights
// - FeaturedPools: Top 3 pool cards
// - SecuritySection: Trust signals
// - CTASection: Registration prompt

// Loading State:
// - Skeleton loaders for stats and pools
// - Static content renders immediately

// Error State:
// - Fallback static content if API fails
// - Stats show "---" placeholders
```

#### 4.2.2 Login/Registration Page (`/login`)

The unified auth page supports three authentication methods:
1. **Email + Biometric** (primary) - Email verification + passkey setup
2. **Google Sign-In** - OAuth with biometric linking
3. **Connect Wallet** - SIWE authentication

```typescript
// app/(auth)/login/page.tsx

type AuthMethod = 'email' | 'google' | 'wallet';

type AuthStep =
  | 'choose'          // Choose auth method
  | 'email_input'     // Enter email
  | 'email_verify'    // Verify code
  | 'google_redirect' // Redirecting to Google
  | 'google_linking'  // Link biometric after Google auth
  | 'wallet_connect'  // Connect wallet
  | 'wallet_sign'     // Sign SIWE message
  | 'biometric'       // Setup/verify passkey
  | 'confirming'      // On-chain registration
  | 'success';        // Complete

interface AuthState {
  method: AuthMethod | null;
  step: AuthStep;
  email: string;
  verificationCode: string;
  walletAddress: string | null;
  needsBiometricSetup: boolean;
  publicKey: { x: string; y: string } | null;
  txHash: string | null;
  error: string | null;
}

// Data Requirements:
// Email flow:
// - POST /api/auth/email/send-code
// - POST /api/auth/email/verify-code
// - POST /api/webauthn/register-options
// - POST /api/webauthn/register-verify

// Google flow:
// - GET /api/auth/google (redirect)
// - GET /api/auth/google/callback (callback)
// - POST /api/auth/link-biometric

// Wallet flow:
// - POST /api/auth/wallet/message
// - POST /api/auth/wallet/verify

// State Management:
// - Local useState for step progression
// - Zustand authStore for final auth state

// Key Components:
// - AuthMethodSelector: Three option cards
// - EmailForm: Email input + validation
// - VerificationCodeInput: 6-digit code entry
// - GoogleButton: OAuth initiation
// - WalletConnectButton: RainbowKit trigger
// - SIWEPrompt: Signature request UI
// - BiometricPrompt: Fingerprint/Face ID trigger
// - BiometricLinkingPrompt: Post-OAuth biometric setup
// - RegistrationPending: Transaction status
// - AuthSuccess: Redirect to dashboard
```

**Auth Method Selection UI:**

```typescript
// components/features/auth/AuthMethodSelector.tsx

interface AuthMethodOption {
  id: AuthMethod;
  title: string;
  description: string;
  icon: React.ComponentType;
  recommended?: boolean;
}

const AUTH_OPTIONS: AuthMethodOption[] = [
  {
    id: 'email',
    title: 'Email + Passkey',
    description: 'Most secure. Uses biometric verification.',
    icon: Fingerprint,
    recommended: true,
  },
  {
    id: 'google',
    title: 'Continue with Google',
    description: 'Quick sign-in, then add biometric.',
    icon: GoogleIcon,
  },
  {
    id: 'wallet',
    title: 'Connect Wallet',
    description: 'Use your existing Web3 wallet.',
    icon: Wallet,
  },
];

export function AuthMethodSelector({ onSelect }: { onSelect: (method: AuthMethod) => void }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-center">Get Started</h2>
      <p className="text-muted-foreground text-center">
        Choose how you'd like to sign in
      </p>

      <div className="space-y-3">
        {AUTH_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className={cn(
              "w-full p-4 rounded-lg border-2 text-left transition-all",
              "hover:border-primary hover:bg-primary/5",
              option.recommended && "border-primary bg-primary/5"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-full bg-muted">
                <option.icon className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{option.title}</span>
                  {option.recommended && (
                    <Badge variant="secondary" className="text-xs">
                      Recommended
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Email Verification Flow:**

```typescript
// components/features/auth/EmailVerificationFlow.tsx

export function EmailVerificationFlow({
  email,
  onVerified,
  onBack,
}: {
  email: string;
  onVerified: (token: string) => void;
  onBack: () => void;
}) {
  const [code, setCode] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const { mutate: sendCode, isPending: isSending } = useMutation({
    mutationFn: () => api.auth.sendVerificationCode(email),
    onSuccess: (data) => {
      if (data.cooldownRemaining) {
        setCooldown(data.cooldownRemaining);
      }
    },
  });

  const { mutate: verifyCode } = useMutation({
    mutationFn: () => api.auth.verifyCode(email, code),
    onSuccess: (data) => {
      if (data.verified && data.token) {
        onVerified(data.token);
      }
    },
  });

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>

      <div className="text-center">
        <h2 className="text-2xl font-bold">Check your email</h2>
        <p className="text-muted-foreground mt-2">
          We sent a 6-digit code to <strong>{email}</strong>
        </p>
      </div>

      <InputOTP
        value={code}
        onChange={setCode}
        maxLength={6}
        className="justify-center"
      />

      <Button
        onClick={() => verifyCode()}
        disabled={code.length !== 6 || isVerifying}
        className="w-full"
      >
        {isVerifying ? <Loader2 className="animate-spin" /> : 'Verify Code'}
      </Button>

      <Button
        variant="link"
        onClick={() => sendCode()}
        disabled={cooldown > 0 || isSending}
      >
        {cooldown > 0
          ? `Resend code in ${cooldown}s`
          : "Didn't receive a code? Resend"}
      </Button>
    </div>
  );
}
```

**Google OAuth Button:**

```typescript
// components/features/auth/GoogleAuthButton.tsx

export function GoogleAuthButton() {
  const handleGoogleAuth = () => {
    // Redirect to backend OAuth endpoint
    window.location.href = '/api/auth/google';
  };

  return (
    <Button
      variant="outline"
      onClick={handleGoogleAuth}
      className="w-full gap-2"
    >
      <GoogleIcon className="h-5 w-5" />
      Continue with Google
    </Button>
  );
}
```

**Wallet Connect Flow:**

```typescript
// components/features/auth/WalletAuthFlow.tsx

import { useAccount, useSignMessage } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function WalletAuthFlow({ onSuccess }: { onSuccess: (token: string) => void }) {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [siweMessage, setSiweMessage] = useState<string | null>(null);

  // Get SIWE message when connected
  const { mutate: getSiweMessage } = useMutation({
    mutationFn: (addr: string) => api.auth.getWalletMessage(addr, 43114), // Avalanche chainId
    onSuccess: (data) => setSiweMessage(data.message),
  });

  // Verify signature
  const { mutate: verifySignature, isPending } = useMutation({
    mutationFn: async (signature: string) => {
      return api.auth.verifyWalletSignature(siweMessage!, signature);
    },
    onSuccess: (data) => onSuccess(data.token),
  });

  useEffect(() => {
    if (isConnected && address) {
      getSiweMessage(address);
    }
  }, [isConnected, address]);

  const handleSign = async () => {
    if (!siweMessage) return;
    const signature = await signMessageAsync({ message: siweMessage });
    verifySignature(signature);
  };

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <p className="text-center text-muted-foreground">
          Connect your wallet to continue
        </p>
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm font-mono break-all">{address}</p>
      </div>

      <Button onClick={handleSign} disabled={isPending || !siweMessage} className="w-full">
        {isPending ? <Loader2 className="animate-spin" /> : 'Sign to Continue'}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        This signature verifies wallet ownership. No transaction required.
      </p>
    </div>
  );
}
```

**Biometric Linking Prompt (after OAuth/Wallet):**

```typescript
// components/features/auth/BiometricLinkingPrompt.tsx

export function BiometricLinkingPrompt({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const { register, isRegistering } = useBiometric();

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
        <Fingerprint className="h-8 w-8 text-primary" />
      </div>

      <div>
        <h2 className="text-2xl font-bold">Add Biometric Security</h2>
        <p className="text-muted-foreground mt-2">
          Use Face ID or fingerprint for secure, one-tap transactions
        </p>
      </div>

      <div className="space-y-3">
        <Button onClick={register} disabled={isRegistering} className="w-full">
          {isRegistering ? (
            <Loader2 className="animate-spin mr-2" />
          ) : (
            <Fingerprint className="mr-2 h-5 w-5" />
          )}
          Set Up Biometric
        </Button>

        <Button variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Biometric authentication is required for investing.
        You can set it up later from Settings.
      </p>
    </div>
  );
}
```

**Auth Flows State Machine:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AUTH FLOW STATE MACHINE                           │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   CHOOSE     │
                              │   METHOD     │
                              └──────┬───────┘
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
           ┌──────────────┐ ┌──────────┐ ┌──────────────┐
           │    EMAIL     │ │  GOOGLE  │ │   WALLET     │
           │    INPUT     │ │ REDIRECT │ │   CONNECT    │
           └──────┬───────┘ └────┬─────┘ └──────┬───────┘
                  │              │              │
                  ▼              │              ▼
           ┌──────────────┐     │       ┌──────────────┐
           │    EMAIL     │     │       │   WALLET     │
           │    VERIFY    │     │       │    SIGN      │
           └──────┬───────┘     │       └──────┬───────┘
                  │              │              │
                  │              ▼              │
                  │       ┌───────────────┐    │
                  │       │ GOOGLE        │    │
                  │       │ CALLBACK      │    │
                  │       │ (has passkey?)│    │
                  │       └───────┬───────┘    │
                  │     ┌────────┼────────┐   │
                  │     │ Yes    │ No     │   │
                  │     │        ▼        │   │
                  │     │  ┌───────────┐  │   │
                  │     │  │ BIOMETRIC │  │   │
                  │     │  │ LINKING   │  │   │
                  │     │  └─────┬─────┘  │   │
                  │     │        │        │   │
                  ▼     ▼        ▼        │   │
           ┌──────────────────────────────┼───┼──┐
           │         BIOMETRIC            │   │  │
           │         SETUP                │   │  │
           └──────────────┬───────────────┘   │  │
                          │                   │  │
                          ▼                   │  │
                   ┌────────────┐            │  │
                   │ CONFIRMING │            │  │
                   │ (on-chain) │            │  │
                   └──────┬─────┘            │  │
                          │                   │  │
                          ▼                   ▼  ▼
                   ┌────────────────────────────────┐
                   │           SUCCESS              │
                   │     (redirect to dashboard)    │
                   └────────────────────────────────┘
```

#### 4.2.3 Dashboard Page (`/dashboard`)

```typescript
// app/(app)/dashboard/page.tsx

interface DashboardData {
  portfolio: {
    totalValue: bigint;
    totalYieldEarned: bigint;
    pendingYield: bigint;
    holdings: Holding[];
  };
  recentTransactions: Transaction[];
  credentialStatus: CredentialStatus;
}

// Data Requirements:
// - GET /api/user/portfolio
// - GET /api/user/transactions?limit=5
// - GET /api/user/credentials
// - Contract reads for real-time balances

// State Management:
// - TanStack Query with 30s refetch
// - Zustand for UI preferences (chart type)

// Key Components:
// - PortfolioSummaryCard: Total value + change
// - YieldEarningsCard: Earned + pending
// - QuickActions: Invest, Redeem buttons
// - HoldingsPreview: Top 3 holdings
// - RecentActivity: Last 5 transactions
// - CredentialAlert: If KYC pending/expired

// Loading State:
// - Card skeletons preserve layout
// - Staggered animation on load

// Error State:
// - Individual card error states
// - Retry buttons per section
```

#### 4.2.4 Pool List Page (`/pools`)

```typescript
// app/(app)/pools/page.tsx

interface PoolListFilters {
  assetClass: 'all' | 'treasury' | 'realestate' | 'credit';
  minYield: number;
  maxMinInvestment: number;
  sortBy: 'yield' | 'tvl' | 'newest';
}

interface PoolListData {
  pools: Pool[];
  totalCount: number;
  page: number;
  hasMore: boolean;
}

// Data Requirements:
// - GET /api/pools?filters...&page=N
// - Contract reads for real-time TVL

// State Management:
// - URL search params for filters (shareable)
// - TanStack Query with infinite scroll

// Key Components:
// - PoolFilters: Asset class, yield, investment range
// - PoolGrid: Responsive card grid
// - PoolCard: Summary with CTA
// - LoadMoreButton: Pagination trigger
// - EmptyState: No pools match filters

// Loading State:
// - 6 skeleton cards on initial load
// - Inline spinner on load more

// Error State:
// - Full page error with retry
// - Filter reset suggestion
```

#### 4.2.5 Pool Detail Page (`/pools/[id]`)

```typescript
// app/(app)/pools/[id]/page.tsx

interface PoolDetailData {
  pool: Pool;
  userPosition: UserPosition | null;
  yieldHistory: YieldDataPoint[];
  recentInvestors: number;
  documents: PoolDocument[];
}

interface InvestmentFormState {
  step: 'amount' | 'review' | 'biometric' | 'pending' | 'success';
  amount: string;
  estimatedShares: bigint;
  signature: string | null;
  txHash: string | null;
}

// Data Requirements:
// - GET /api/pools/[id]
// - GET /api/pools/[id]/yield-history
// - GET /api/user/positions/[poolId]
// - Contract reads for precise data

// State Management:
// - TanStack Query for pool data
// - Local useState for investment form
// - Zustand transactionStore for pending tx

// Key Components:
// - PoolHeader: Name, asset class, badges
// - PoolStats: TVL, yield, min/max investment
// - YieldChart: Historical yield line chart
// - ComplianceRequirements: Required credentials
// - InvestmentForm: Multi-step investment flow
// - UserPosition: Current holdings (if any)
// - DocumentList: Pool documents

// Loading State:
// - Header skeleton + stats skeleton
// - Chart placeholder with shimmer

// Error State:
// - Pool not found: 404 page
// - Data fetch error: Retry prompt
```

---

## 5. Component Architecture

### 5.1 Component Hierarchy

```
App
|-- RootLayout
    |-- Providers (QueryClient, Web3, Theme)
    |-- AuthLayout (public pages)
    |   |-- Header (minimal)
    |   |-- main
    |   |-- Footer
    |
    |-- AppLayout (protected pages)
        |-- Sidebar
        |   |-- Logo
        |   |-- NavLinks
        |   |-- UserMenu
        |-- Header
        |   |-- Breadcrumbs
        |   |-- QuickSearch
        |   |-- NotificationBell
        |   |-- BiometricStatus
        |-- main
        |   |-- PageContent
        |-- MobileNav (< md breakpoint)
```

### 5.2 Core Component Specifications

#### 5.2.1 BiometricButton

```typescript
// components/features/auth/BiometricButton.tsx

interface BiometricButtonProps {
  /** Action type determines the operation */
  action: 'register' | 'authenticate' | 'sign';

  /** Called when biometric operation succeeds */
  onSuccess: (result: BiometricResult) => void;

  /** Called when biometric operation fails */
  onError: (error: BiometricError) => void;

  /** Optional challenge for signing operations */
  challenge?: string;

  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';

  /** Button size */
  size?: 'sm' | 'md' | 'lg';

  /** Disabled state */
  disabled?: boolean;

  /** Custom className */
  className?: string;

  /** Child content (overrides default) */
  children?: React.ReactNode;
}

interface BiometricResult {
  type: 'registration' | 'authentication' | 'signature';
  publicKey?: { x: string; y: string };
  signature?: string;
  credentialId?: string;
  counter?: number;
}

interface BiometricError {
  code: 'NOT_SUPPORTED' | 'CANCELLED' | 'TIMEOUT' | 'INVALID' | 'UNKNOWN';
  message: string;
}

type BiometricState = 'idle' | 'prompting' | 'processing' | 'success' | 'error';

// Internal state machine:
// idle -> prompting (user clicks)
// prompting -> processing (biometric captured)
// processing -> success | error
// success/error -> idle (after timeout)

// Visual states:
// idle: Fingerprint icon + text
// prompting: Pulsing fingerprint animation
// processing: Spinner
// success: Checkmark + green
// error: X icon + red + shake animation

// Implementation notes:
// - Uses useWebAuthn hook internally
// - Touch target minimum 44px
// - Haptic feedback on mobile (if supported)
// - Auto-focus on mount if primary CTA
```

#### 5.2.2 PoolCard

```typescript
// components/features/pools/PoolCard.tsx

interface PoolCardProps {
  pool: Pool;
  userPosition?: UserPosition;
  variant?: 'default' | 'compact' | 'featured';
  showActions?: boolean;
  onClick?: () => void;
}

interface Pool {
  id: string;
  name: string;
  assetClass: AssetClass;
  description: string;
  yieldRate: number;           // basis points (450 = 4.5%)
  tvl: bigint;
  minInvestment: bigint;
  maxInvestment: bigint;
  requiredCredential: CredentialType;
  allowedJurisdictions: string[];
  status: 'active' | 'paused' | 'closed';
  tokenAddress: string;
  createdAt: Date;
}

// Layout (default variant):
// +------------------------------------------+
// | [Asset Icon]  Pool Name                  |
// |              Asset Class Badge           |
// +------------------------------------------+
// |  4.50%         $2.4M         $100        |
// |  APY           TVL           Min         |
// +------------------------------------------+
// | [Credential Badge]  [Jurisdiction Flags] |
// +------------------------------------------+
// |        [View Details Button]             |
// +------------------------------------------+

// Responsive behavior:
// - Desktop: 3 columns
// - Tablet: 2 columns
// - Mobile: 1 column (full width)
```

#### 5.2.3 InvestmentForm

```typescript
// components/features/pools/InvestmentForm.tsx

interface InvestmentFormProps {
  pool: Pool;
  userCredential: Credential | null;
  userBalance: bigint;  // USDC balance
  onSuccess: (txHash: string) => void;
  onCancel: () => void;
}

type InvestmentStep =
  | 'amount'      // Enter investment amount
  | 'review'      // Confirm details
  | 'biometric'   // Authenticate
  | 'pending'     // Transaction processing
  | 'success';    // Complete

interface InvestmentFormState {
  step: InvestmentStep;
  amount: string;
  amountError: string | null;
  estimatedShares: bigint;
  estimatedYield: bigint;
  signature: string | null;
  txHash: string | null;
  error: string | null;
}

// Step 1: Amount Entry
// +------------------------------------------+
// | Investment Amount                        |
// | +--------------------------------------+ |
// | | $ |  10,000.00              | USDC | | |
// | +--------------------------------------+ |
// | Balance: $50,000.00 USDC    [MAX]       |
// |                                          |
// | Min: $100  |  Max: $500,000             |
// +------------------------------------------+
// | You will receive:                        |
// | ~10,000 RWA-TREAS tokens                |
// | Est. annual yield: $450.00              |
// +------------------------------------------+
// |              [Continue]                  |
// +------------------------------------------+

// Step 2: Review
// +------------------------------------------+
// | Review Investment                        |
// +------------------------------------------+
// | Pool:        Avalanche Treasury Fund    |
// | Amount:      $10,000.00 USDC            |
// | Shares:      10,000 RWA-TREAS           |
// | Yield Rate:  4.50% APY                  |
// | Est. Yield:  $450.00/year               |
// +------------------------------------------+
// | [Trust Badge: Verified on Snowtrace]    |
// +------------------------------------------+
// |    [Back]            [Confirm]          |
// +------------------------------------------+

// Step 3: Biometric
// +------------------------------------------+
// |     [Fingerprint Animation]             |
// |                                          |
// |     Touch to authorize investment       |
// |                                          |
// +------------------------------------------+

// Step 4: Pending
// +------------------------------------------+
// |     [Spinner Animation]                 |
// |                                          |
// |     Processing your investment...       |
// |     This may take a few seconds         |
// |                                          |
// |     [View on Snowtrace]                 |
// +------------------------------------------+

// Step 5: Success
// +------------------------------------------+
// |     [Checkmark Animation]               |
// |                                          |
// |     Investment Successful!              |
// |                                          |
// |     You now own 10,000 RWA-TREAS       |
// |                                          |
// |  [View Portfolio]  [Invest More]        |
// +------------------------------------------+

// Validation rules:
// - Amount >= pool.minInvestment
// - Amount <= pool.maxInvestment
// - Amount <= userBalance
// - User has valid credential for pool
// - User jurisdiction allowed
```

#### 5.2.4 CredentialBadge

```typescript
// components/features/credentials/CredentialBadge.tsx

interface CredentialBadgeProps {
  status: CredentialStatus;
  type?: CredentialType;
  expiresAt?: Date;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onClick?: () => void;
}

type CredentialStatus =
  | 'none'        // No credential
  | 'pending'     // Verification in progress
  | 'verified'    // Active and valid
  | 'expired'     // Was valid, now expired
  | 'rejected';   // Verification failed

type CredentialType =
  | 'accredited'
  | 'qualified'
  | 'institutional'
  | 'retail';

// Visual representations:
// none:     Gray outline, "Not Verified"
// pending:  Yellow, pulsing, "Verifying..."
// verified: Green, checkmark, "Verified"
// expired:  Orange, warning, "Expired"
// rejected: Red, X icon, "Rejected"

// Size specs:
// sm: 20px icon, 12px text
// md: 24px icon, 14px text (default)
// lg: 32px icon, 16px text
```

#### 5.2.5 TransactionHistory

```typescript
// components/features/portfolio/TransactionHistory.tsx

interface TransactionHistoryProps {
  transactions: Transaction[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  filters?: TransactionFilters;
  onFilterChange?: (filters: TransactionFilters) => void;
}

interface Transaction {
  id: string;
  type: 'invest' | 'redeem' | 'yield' | 'transfer_in' | 'transfer_out';
  poolId: string;
  poolName: string;
  amount: bigint;
  shares: bigint;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: Date;
}

interface TransactionFilters {
  type?: Transaction['type'];
  poolId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// Table columns:
// | Date | Type | Pool | Amount | Shares | Status | Tx |

// Mobile: Card layout instead of table
// +------------------------------------------+
// | Invested in Avalanche Treasury    [->]  |
// | $10,000 USDC -> 10,000 RWA-TREAS       |
// | Feb 4, 2026 at 2:30 PM     [Confirmed]  |
// +------------------------------------------+
```

### 5.3 Compound Component Patterns

```typescript
// Example: Pool compound component

// Usage:
<Pool.Root pool={poolData}>
  <Pool.Header />
  <Pool.Stats />
  <Pool.Requirements />
  <Pool.Actions>
    <Pool.InvestButton />
    <Pool.DetailsLink />
  </Pool.Actions>
</Pool.Root>

// Implementation pattern:
const PoolContext = createContext<PoolContextValue | null>(null);

function PoolRoot({ pool, children }: { pool: Pool; children: React.ReactNode }) {
  return (
    <PoolContext.Provider value={{ pool }}>
      <Card>{children}</Card>
    </PoolContext.Provider>
  );
}

function usePoolContext() {
  const ctx = useContext(PoolContext);
  if (!ctx) throw new Error('Must be used within Pool.Root');
  return ctx;
}

function PoolHeader() {
  const { pool } = usePoolContext();
  return (
    <CardHeader>
      <CardTitle>{pool.name}</CardTitle>
      <Badge>{pool.assetClass}</Badge>
    </CardHeader>
  );
}

// Attach subcomponents
const Pool = {
  Root: PoolRoot,
  Header: PoolHeader,
  Stats: PoolStats,
  Requirements: PoolRequirements,
  Actions: PoolActions,
  InvestButton: PoolInvestButton,
  DetailsLink: PoolDetailsLink,
};
```

---

## 6. State Management

### 6.1 State Categories

```
+------------------------------------------------------------------+
|                      STATE ARCHITECTURE                           |
+------------------------------------------------------------------+
|                                                                   |
|  +---------------------+      +---------------------+             |
|  |   SERVER STATE      |      |   CLIENT STATE      |             |
|  |   (TanStack Query)  |      |   (Zustand)         |             |
|  +---------------------+      +---------------------+             |
|  |                     |      |                     |             |
|  | - User profile      |      | - Auth session      |             |
|  | - Pool data         |      | - UI preferences    |             |
|  | - Portfolio data    |      | - Sidebar state     |             |
|  | - Transactions      |      | - Modal state       |             |
|  | - Credentials       |      | - Form drafts       |             |
|  | - Blockchain state  |      | - Pending txs       |             |
|  |                     |      |                     |             |
|  +---------------------+      +---------------------+             |
|           |                            |                          |
|           v                            v                          |
|  +--------------------------------------------------+            |
|  |              DERIVED STATE                        |            |
|  |              (computed from server + client)      |            |
|  +--------------------------------------------------+            |
|  | - canInvest (credential + balance + pool rules)  |            |
|  | - portfolioTotal (sum of holdings)               |            |
|  | - pendingYield (calculated from positions)       |            |
|  +--------------------------------------------------+            |
|                                                                   |
+------------------------------------------------------------------+
```

### 6.2 Zustand Store Design

#### 6.2.1 Auth Store

```typescript
// stores/authStore.ts

interface AuthState {
  // State
  isAuthenticated: boolean;
  user: User | null;
  credentialId: string | null;
  sessionExpiry: Date | null;

  // Actions
  setUser: (user: User) => void;
  setCredentialId: (id: string) => void;
  logout: () => void;
  refreshSession: () => Promise<void>;

  // Computed
  isSessionValid: () => boolean;
}

interface User {
  id: string;
  email: string;
  walletAddress: string;
  publicKey: { x: string; y: string };
  createdAt: Date;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      credentialId: null,
      sessionExpiry: null,

      setUser: (user) => set({
        user,
        isAuthenticated: true,
        sessionExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h
      }),

      setCredentialId: (id) => set({ credentialId: id }),

      logout: () => set({
        isAuthenticated: false,
        user: null,
        credentialId: null,
        sessionExpiry: null
      }),

      refreshSession: async () => {
        // Re-authenticate with biometric
        // Update sessionExpiry
      },

      isSessionValid: () => {
        const { sessionExpiry } = get();
        return sessionExpiry ? new Date() < sessionExpiry : false;
      },
    }),
    {
      name: 'rwa-auth',
      partialize: (state) => ({
        credentialId: state.credentialId,
        // Don't persist sensitive data
      }),
    }
  )
);
```

#### 6.2.2 UI Store

```typescript
// stores/uiStore.ts

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Theme
  theme: 'light' | 'dark' | 'system';

  // Modals
  activeModal: ModalType | null;
  modalData: unknown;

  // Notifications
  notifications: Notification[];

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: UIState['theme']) => void;
  openModal: (type: ModalType, data?: unknown) => void;
  closeModal: () => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

type ModalType =
  | 'invest'
  | 'redeem'
  | 'biometric'
  | 'confirm'
  | 'transaction-status';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      sidebarCollapsed: false,
      theme: 'system',
      activeModal: null,
      modalData: null,
      notifications: [],

      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setTheme: (theme) => set({ theme }),
      openModal: (type, data) => set({ activeModal: type, modalData: data }),
      closeModal: () => set({ activeModal: null, modalData: null }),
      addNotification: (n) => set((s) => ({
        notifications: [...s.notifications, { ...n, id: crypto.randomUUID() }]
      })),
      removeNotification: (id) => set((s) => ({
        notifications: s.notifications.filter((n) => n.id !== id)
      })),
    }),
    {
      name: 'rwa-ui',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
```

#### 6.2.3 Transaction Store

```typescript
// stores/transactionStore.ts

interface TransactionState {
  pending: PendingTransaction[];
  recent: CompletedTransaction[];

  addPending: (tx: Omit<PendingTransaction, 'id' | 'startedAt'>) => string;
  updatePending: (id: string, update: Partial<PendingTransaction>) => void;
  completePending: (id: string, result: TransactionResult) => void;
  removePending: (id: string) => void;
  clearRecent: () => void;
}

interface PendingTransaction {
  id: string;
  type: 'invest' | 'redeem' | 'register';
  poolId?: string;
  amount?: bigint;
  txHash?: string;
  status: 'signing' | 'submitted' | 'confirming';
  startedAt: Date;
}

interface CompletedTransaction {
  id: string;
  type: PendingTransaction['type'];
  txHash: string;
  status: 'confirmed' | 'failed';
  completedAt: Date;
  error?: string;
}

type TransactionResult =
  | { status: 'confirmed'; txHash: string }
  | { status: 'failed'; error: string };
```

### 6.3 TanStack Query Configuration

```typescript
// lib/queryClient.ts

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // 30 seconds
      gcTime: 5 * 60 * 1000,       // 5 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Query key factory
export const queryKeys = {
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    credentials: () => [...queryKeys.user.all, 'credentials'] as const,
    portfolio: () => [...queryKeys.user.all, 'portfolio'] as const,
    transactions: (filters?: TransactionFilters) =>
      [...queryKeys.user.all, 'transactions', filters] as const,
  },
  pools: {
    all: ['pools'] as const,
    list: (filters?: PoolFilters) => [...queryKeys.pools.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.pools.all, 'detail', id] as const,
    yieldHistory: (id: string) => [...queryKeys.pools.all, 'yield', id] as const,
  },
  stats: {
    all: ['stats'] as const,
    global: () => [...queryKeys.stats.all, 'global'] as const,
  },
};
```

### 6.4 Query Hook Examples

```typescript
// hooks/usePool.ts

export function usePool(poolId: string) {
  return useQuery({
    queryKey: queryKeys.pools.detail(poolId),
    queryFn: () => api.pools.getById(poolId),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function usePoolYieldHistory(poolId: string) {
  return useQuery({
    queryKey: queryKeys.pools.yieldHistory(poolId),
    queryFn: () => api.pools.getYieldHistory(poolId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useInvestMutation() {
  const queryClient = useQueryClient();
  const { addPending, completePending } = useTransactionStore();

  return useMutation({
    mutationFn: async (params: InvestParams) => {
      // 1. Add to pending transactions
      const txId = addPending({
        type: 'invest',
        poolId: params.poolId,
        amount: params.amount,
        status: 'signing'
      });

      try {
        // 2. Submit transaction
        const result = await api.pools.invest(params);

        // 3. Complete pending
        completePending(txId, { status: 'confirmed', txHash: result.txHash });

        return result;
      } catch (error) {
        completePending(txId, { status: 'failed', error: error.message });
        throw error;
      }
    },

    // Optimistic update
    onMutate: async (params) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.user.portfolio()
      });

      const previous = queryClient.getQueryData(queryKeys.user.portfolio());

      // Optimistically update portfolio
      queryClient.setQueryData(queryKeys.user.portfolio(), (old: Portfolio) => ({
        ...old,
        totalValue: old.totalValue + params.amount,
        // Add optimistic holding
      }));

      return { previous };
    },

    onError: (err, vars, context) => {
      // Rollback on error
      queryClient.setQueryData(queryKeys.user.portfolio(), context?.previous);
    },

    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.user.portfolio() });
      queryClient.invalidateQueries({ queryKey: queryKeys.pools.all });
    },
  });
}
```

---

## 7. WebAuthn Integration Architecture

### 7.1 Registration Flow

```
+------------------------------------------------------------------+
|                    WEBAUTHN REGISTRATION FLOW                     |
+------------------------------------------------------------------+

   Browser                    Backend                    Blockchain
      |                          |                           |
      |  1. POST /register-options                          |
      |  { email }               |                           |
      |------------------------->|                           |
      |                          |                           |
      |  2. Return challenge     |                           |
      |  { challenge, rp, user } |                           |
      |<-------------------------|                           |
      |                          |                           |
      |  3. navigator.credentials.create()                  |
      |  +-----------------+     |                           |
      |  | Secure Enclave  |     |                           |
      |  | Generate P-256  |     |                           |
      |  | Key Pair        |     |                           |
      |  +-----------------+     |                           |
      |                          |                           |
      |  4. User biometric       |                           |
      |  [Touch ID / Face ID]    |                           |
      |                          |                           |
      |  5. POST /register-verify                           |
      |  { attestation }         |                           |
      |------------------------->|                           |
      |                          |                           |
      |                          |  6. Extract public key    |
      |                          |  (x, y coordinates)       |
      |                          |                           |
      |                          |  7. BiometricRegistry     |
      |                          |     .register(user, x, y) |
      |                          |-------------------------->|
      |                          |                           |
      |                          |  8. Tx confirmed          |
      |                          |<--------------------------|
      |                          |                           |
      |  9. { success, txHash }  |                           |
      |<-------------------------|                           |
      |                          |                           |
```

### 7.2 Authentication Flow

```
+------------------------------------------------------------------+
|                   WEBAUTHN AUTHENTICATION FLOW                    |
+------------------------------------------------------------------+

   Browser                    Backend                    Contract
      |                          |                           |
      |  1. POST /auth-options   |                           |
      |  { credentialId }        |                           |
      |------------------------->|                           |
      |                          |                           |
      |  2. Return challenge     |                           |
      |  { challenge, allowCreds}|                           |
      |<-------------------------|                           |
      |                          |                           |
      |  3. navigator.credentials.get()                     |
      |  +-----------------+     |                           |
      |  | Secure Enclave  |     |                           |
      |  | Sign challenge  |     |                           |
      |  | with private key|     |                           |
      |  +-----------------+     |                           |
      |                          |                           |
      |  4. User biometric       |                           |
      |  [Touch ID / Face ID]    |                           |
      |                          |                           |
      |  5. POST /auth-verify    |                           |
      |  { assertion }           |                           |
      |------------------------->|                           |
      |                          |                           |
      |                          |  6. Verify signature      |
      |                          |     locally (optional)    |
      |                          |                           |
      |  7. { sessionToken }     |                           |
      |<-------------------------|                           |
      |                          |                           |
```

### 7.3 Transaction Signing Flow

```
+------------------------------------------------------------------+
|                   TRANSACTION SIGNING FLOW                        |
+------------------------------------------------------------------+

   Browser                    Backend                    Contract
      |                          |                           |
      |  1. User initiates invest                           |
      |  { poolId, amount }      |                           |
      |------------------------->|                           |
      |                          |                           |
      |  2. Backend prepares     |                           |
      |  transaction data        |                           |
      |  messageHash = keccak256(|                           |
      |    poolId + amount +     |                           |
      |    nonce + deadline      |                           |
      |  )                       |                           |
      |                          |                           |
      |  3. Return signing req   |                           |
      |  { challenge: messageHash}                           |
      |<-------------------------|                           |
      |                          |                           |
      |  4. navigator.credentials.get()                     |
      |  with challenge = messageHash                       |
      |                          |                           |
      |  5. User biometric       |                           |
      |                          |                           |
      |  6. Send signature       |                           |
      |  { r, s, clientData }    |                           |
      |------------------------->|                           |
      |                          |                           |
      |                          |  7. Format signature      |
      |                          |  for ACP-204              |
      |                          |                           |
      |                          |  8. Submit via relayer    |
      |                          |  RWAGateway.invest(       |
      |                          |    poolId, amount,        |
      |                          |    signature              |
      |                          |  )                        |
      |                          |-------------------------->|
      |                          |                           |
      |                          |  9. Contract calls        |
      |                          |  BiometricRegistry.verify |
      |                          |  via ACP-204 precompile   |
      |                          |                           |
      |                          |  10. Tx confirmed         |
      |                          |<--------------------------|
      |                          |                           |
      |  11. { success, txHash } |                           |
      |<-------------------------|                           |
      |                          |                           |
```

### 7.4 WebAuthn Hook Implementation

```typescript
// hooks/useWebAuthn.ts

import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from '@simplewebauthn/browser';

interface UseWebAuthnReturn {
  isSupported: boolean;
  isLoading: boolean;
  error: WebAuthnError | null;

  register: (email: string) => Promise<RegistrationResult>;
  authenticate: (credentialId?: string) => Promise<AuthenticationResult>;
  sign: (challenge: string) => Promise<SignatureResult>;
}

interface RegistrationResult {
  publicKey: { x: string; y: string };
  credentialId: string;
  attestation: AuthenticatorAttestationResponseJSON;
}

interface AuthenticationResult {
  credentialId: string;
  signature: string;
  counter: number;
}

interface SignatureResult {
  signature: { r: string; s: string };
  clientDataJSON: string;
  authenticatorData: string;
}

export function useWebAuthn(): UseWebAuthnReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<WebAuthnError | null>(null);

  const isSupported = useMemo(() => browserSupportsWebAuthn(), []);

  const register = useCallback(async (email: string): Promise<RegistrationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get registration options from server
      const optionsRes = await fetch('/api/webauthn/register-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!optionsRes.ok) {
        throw new WebAuthnError('NETWORK', 'Failed to get registration options');
      }

      const options = await optionsRes.json();

      // 2. Start WebAuthn registration ceremony
      const attestation = await startRegistration(options);

      // 3. Verify with server
      const verifyRes = await fetch('/api/webauthn/register-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attestation }),
      });

      if (!verifyRes.ok) {
        const error = await verifyRes.json();
        throw new WebAuthnError('VERIFICATION', error.message);
      }

      const result = await verifyRes.json();

      return {
        publicKey: result.publicKey,
        credentialId: result.credentialId,
        attestation,
      };

    } catch (err) {
      const webAuthnError = normalizeError(err);
      setError(webAuthnError);
      throw webAuthnError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const authenticate = useCallback(async (credentialId?: string): Promise<AuthenticationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get authentication options
      const optionsRes = await fetch('/api/webauthn/auth-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credentialId }),
      });

      const options = await optionsRes.json();

      // 2. Start authentication ceremony
      const assertion = await startAuthentication(options);

      // 3. Verify with server
      const verifyRes = await fetch('/api/webauthn/auth-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assertion }),
      });

      if (!verifyRes.ok) {
        throw new WebAuthnError('VERIFICATION', 'Authentication failed');
      }

      const result = await verifyRes.json();

      return {
        credentialId: result.credentialId,
        signature: result.signature,
        counter: result.counter,
      };

    } catch (err) {
      const webAuthnError = normalizeError(err);
      setError(webAuthnError);
      throw webAuthnError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sign = useCallback(async (challenge: string): Promise<SignatureResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get signing options with specific challenge
      const optionsRes = await fetch('/api/webauthn/sign-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge }),
      });

      const options = await optionsRes.json();

      // Sign with biometric
      const assertion = await startAuthentication(options);

      // Extract and format signature for ACP-204
      const signature = extractSignatureComponents(assertion);

      return {
        signature,
        clientDataJSON: assertion.response.clientDataJSON,
        authenticatorData: assertion.response.authenticatorData,
      };

    } catch (err) {
      const webAuthnError = normalizeError(err);
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
  };
}

// Helper to extract r,s from DER-encoded signature
function extractSignatureComponents(assertion: AuthenticationResponseJSON): { r: string; s: string } {
  const signature = base64URLToBuffer(assertion.response.signature);

  // WebAuthn uses DER encoding for P-256 signatures
  // Format: 0x30 [total-length] 0x02 [r-length] [r] 0x02 [s-length] [s]

  let offset = 2; // Skip 0x30 and total length

  // Extract r
  if (signature[offset] !== 0x02) throw new Error('Invalid signature format');
  offset++;
  const rLength = signature[offset];
  offset++;
  let r = signature.slice(offset, offset + rLength);
  offset += rLength;

  // Extract s
  if (signature[offset] !== 0x02) throw new Error('Invalid signature format');
  offset++;
  const sLength = signature[offset];
  offset++;
  let s = signature.slice(offset, offset + sLength);

  // Remove leading zero padding if present (DER encoding)
  if (r[0] === 0x00 && r.length === 33) r = r.slice(1);
  if (s[0] === 0x00 && s.length === 33) s = s.slice(1);

  // Pad to 32 bytes if necessary
  r = padTo32Bytes(r);
  s = padTo32Bytes(s);

  return {
    r: '0x' + bufferToHex(r),
    s: '0x' + bufferToHex(s),
  };
}
```

### 7.5 Error Handling and Recovery

```typescript
// lib/webauthn/errors.ts

export class WebAuthnError extends Error {
  constructor(
    public code: WebAuthnErrorCode,
    message: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'WebAuthnError';
  }
}

type WebAuthnErrorCode =
  | 'NOT_SUPPORTED'      // Browser doesn't support WebAuthn
  | 'CANCELLED'          // User cancelled the operation
  | 'TIMEOUT'            // Operation timed out
  | 'INVALID_STATE'      // Credential already registered
  | 'NOT_ALLOWED'        // User denied permission
  | 'CONSTRAINT'         // Authenticator constraint not satisfied
  | 'NETWORK'            // Network error
  | 'VERIFICATION'       // Server verification failed
  | 'UNKNOWN';           // Unknown error

export const ERROR_MESSAGES: Record<WebAuthnErrorCode, string> = {
  NOT_SUPPORTED: 'Your browser does not support biometric authentication. Please use Chrome, Safari, or Edge.',
  CANCELLED: 'Authentication was cancelled. Please try again.',
  TIMEOUT: 'Authentication timed out. Please try again.',
  INVALID_STATE: 'This device is already registered. Try signing in instead.',
  NOT_ALLOWED: 'Biometric permission was denied. Please enable biometric authentication in your browser settings.',
  CONSTRAINT: 'Your device does not meet the security requirements.',
  NETWORK: 'Network error. Please check your connection and try again.',
  VERIFICATION: 'Verification failed. Please try again.',
  UNKNOWN: 'An unexpected error occurred. Please try again.',
};

export const ERROR_RECOVERY: Record<WebAuthnErrorCode, RecoveryAction> = {
  NOT_SUPPORTED: { action: 'show_fallback', message: 'Use wallet connection instead' },
  CANCELLED: { action: 'retry', message: 'Tap to try again' },
  TIMEOUT: { action: 'retry', message: 'Tap to try again' },
  INVALID_STATE: { action: 'redirect', destination: '/login' },
  NOT_ALLOWED: { action: 'show_instructions', message: 'Enable biometrics in settings' },
  CONSTRAINT: { action: 'show_fallback', message: 'Use a different device' },
  NETWORK: { action: 'retry', message: 'Check connection and retry' },
  VERIFICATION: { action: 'retry', message: 'Tap to try again' },
  UNKNOWN: { action: 'contact_support', message: 'Contact support if issue persists' },
};

interface RecoveryAction {
  action: 'retry' | 'redirect' | 'show_fallback' | 'show_instructions' | 'contact_support';
  message: string;
  destination?: string;
}
```

---

## 8. Web3 Integration

### 8.1 Provider Configuration

```typescript
// lib/web3/provider.ts

import { ethers, JsonRpcProvider, BrowserProvider } from 'ethers';

const RPC_URLS = {
  fuji: 'https://api.avax-test.network/ext/bc/C/rpc',
  mainnet: 'https://api.avax.network/ext/bc/C/rpc',
};

const CHAIN_IDS = {
  fuji: 43113,
  mainnet: 43114,
};

class Web3Provider {
  private provider: JsonRpcProvider;
  private network: 'fuji' | 'mainnet';

  constructor(network: 'fuji' | 'mainnet' = 'fuji') {
    this.network = network;
    this.provider = new JsonRpcProvider(RPC_URLS[network], {
      chainId: CHAIN_IDS[network],
      name: network === 'fuji' ? 'Avalanche Fuji' : 'Avalanche Mainnet',
    });
  }

  getProvider(): JsonRpcProvider {
    return this.provider;
  }

  getChainId(): number {
    return CHAIN_IDS[this.network];
  }

  async getBlockNumber(): Promise<number> {
    return this.provider.getBlockNumber();
  }

  async waitForTransaction(
    txHash: string,
    confirmations: number = 1
  ): Promise<ethers.TransactionReceipt> {
    return this.provider.waitForTransaction(txHash, confirmations);
  }
}

// Singleton instance
export const web3Provider = new Web3Provider(
  process.env.NEXT_PUBLIC_NETWORK as 'fuji' | 'mainnet' || 'fuji'
);
```

### 8.2 Contract Instances

```typescript
// lib/web3/contracts.ts

import { Contract, Interface } from 'ethers';
import { web3Provider } from './provider';

import BiometricRegistryABI from './abis/BiometricRegistry.json';
import CredentialVerifierABI from './abis/CredentialVerifier.json';
import RWAGatewayABI from './abis/RWAGateway.json';
import RWATokenABI from './abis/RWAToken.json';
import USDCABI from './abis/USDC.json';

const CONTRACT_ADDRESSES = {
  fuji: {
    BiometricRegistry: '0x...',
    CredentialVerifier: '0x...',
    RWAGateway: '0x...',
    USDC: '0x...',
  },
  mainnet: {
    BiometricRegistry: '0x...',
    CredentialVerifier: '0x...',
    RWAGateway: '0x...',
    USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', // Native USDC
  },
};

const network = process.env.NEXT_PUBLIC_NETWORK as 'fuji' | 'mainnet' || 'fuji';
const addresses = CONTRACT_ADDRESSES[network];

export const contracts = {
  biometricRegistry: new Contract(
    addresses.BiometricRegistry,
    BiometricRegistryABI,
    web3Provider.getProvider()
  ),

  credentialVerifier: new Contract(
    addresses.CredentialVerifier,
    CredentialVerifierABI,
    web3Provider.getProvider()
  ),

  rwAGateway: new Contract(
    addresses.RWAGateway,
    RWAGatewayABI,
    web3Provider.getProvider()
  ),

  usdc: new Contract(
    addresses.USDC,
    USDCABI,
    web3Provider.getProvider()
  ),

  // Factory for pool-specific RWA tokens
  getRWAToken: (address: string) => new Contract(
    address,
    RWATokenABI,
    web3Provider.getProvider()
  ),
};

// Contract interface for encoding/decoding
export const interfaces = {
  biometricRegistry: new Interface(BiometricRegistryABI),
  credentialVerifier: new Interface(CredentialVerifierABI),
  rwAGateway: new Interface(RWAGatewayABI),
  rwAToken: new Interface(RWATokenABI),
  usdc: new Interface(USDCABI),
};
```

### 8.3 Contract Interaction Hooks

```typescript
// hooks/useContract.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contracts, interfaces } from '@/lib/web3/contracts';
import { web3Provider } from '@/lib/web3/provider';
import { queryKeys } from '@/lib/queryClient';

// Read user's biometric registration status
export function useBiometricStatus(address: string | undefined) {
  return useQuery({
    queryKey: ['biometric', 'status', address],
    queryFn: async () => {
      if (!address) return null;

      const isRegistered = await contracts.biometricRegistry.isRegistered(address);

      if (!isRegistered) return { registered: false };

      const publicKey = await contracts.biometricRegistry.getPublicKey(address);
      const counter = await contracts.biometricRegistry.getCounter(address);

      return {
        registered: true,
        publicKey: {
          x: publicKey.x.toString(),
          y: publicKey.y.toString(),
        },
        counter: Number(counter),
      };
    },
    enabled: !!address,
    staleTime: 60 * 1000,
  });
}

// Read user's credential status
export function useCredentialStatus(address: string | undefined) {
  return useQuery({
    queryKey: queryKeys.user.credentials(),
    queryFn: async () => {
      if (!address) return null;

      const hasCredential = await contracts.credentialVerifier.hasValidCredential(address);

      if (!hasCredential) {
        return { status: 'none' as const };
      }

      const credential = await contracts.credentialVerifier.getCredential(address);

      return {
        status: 'verified' as const,
        type: Number(credential.credType),
        jurisdiction: credential.jurisdiction,
        tier: Number(credential.tier),
        expiresAt: new Date(Number(credential.expiresAt) * 1000),
        isExpired: Date.now() / 1000 > Number(credential.expiresAt),
      };
    },
    enabled: !!address,
    staleTime: 5 * 60 * 1000,
  });
}

// Read pool data
export function usePoolContract(poolId: string) {
  return useQuery({
    queryKey: queryKeys.pools.detail(poolId),
    queryFn: async () => {
      const pool = await contracts.rwAGateway.getPool(poolId);
      const token = contracts.getRWAToken(pool.tokenAddress);
      const totalSupply = await token.totalSupply();

      return {
        id: poolId,
        name: pool.name,
        assetClass: pool.assetClass,
        yieldRate: Number(pool.yieldRate),
        tvl: pool.tvl,
        totalSupply,
        minInvestment: pool.minInvestment,
        maxInvestment: pool.maxInvestment,
        requiredCredential: Number(pool.requiredCredential),
        allowedJurisdictions: pool.allowedJurisdictions,
        tokenAddress: pool.tokenAddress,
        status: pool.paused ? 'paused' : 'active',
      };
    },
    staleTime: 30 * 1000,
  });
}

// Read user's position in a pool
export function useUserPosition(poolId: string, userAddress: string | undefined) {
  return useQuery({
    queryKey: ['position', poolId, userAddress],
    queryFn: async () => {
      if (!userAddress) return null;

      const pool = await contracts.rwAGateway.getPool(poolId);
      const token = contracts.getRWAToken(pool.tokenAddress);

      const balance = await token.balanceOf(userAddress);

      if (balance === 0n) return null;

      // Calculate value and yield
      const sharePrice = await contracts.rwAGateway.getSharePrice(poolId);
      const value = (balance * sharePrice) / 10n ** 18n;

      const pendingYield = await contracts.rwAGateway.getPendingYield(poolId, userAddress);

      return {
        poolId,
        shares: balance,
        value,
        pendingYield,
        sharePrice,
      };
    },
    enabled: !!userAddress,
    staleTime: 30 * 1000,
  });
}

// USDC balance
export function useUSDCBalance(address: string | undefined) {
  return useQuery({
    queryKey: ['usdc', 'balance', address],
    queryFn: async () => {
      if (!address) return 0n;
      return contracts.usdc.balanceOf(address);
    },
    enabled: !!address,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}
```

### 8.4 Transaction Lifecycle Handling

```typescript
// hooks/useTransaction.ts

interface TransactionConfig {
  onSubmitted?: (txHash: string) => void;
  onConfirmed?: (receipt: ethers.TransactionReceipt) => void;
  onError?: (error: Error) => void;
  confirmations?: number;
}

interface TransactionState {
  status: 'idle' | 'preparing' | 'signing' | 'submitted' | 'confirming' | 'confirmed' | 'failed';
  txHash: string | null;
  receipt: ethers.TransactionReceipt | null;
  error: Error | null;
  confirmations: number;
}

export function useTransaction(config: TransactionConfig = {}) {
  const [state, setState] = useState<TransactionState>({
    status: 'idle',
    txHash: null,
    receipt: null,
    error: null,
    confirmations: 0,
  });

  const execute = useCallback(async (
    prepareTransaction: () => Promise<{
      to: string;
      data: string;
      signature: { r: string; s: string };
    }>
  ) => {
    try {
      setState(s => ({ ...s, status: 'preparing', error: null }));

      // Prepare transaction data
      const txData = await prepareTransaction();

      setState(s => ({ ...s, status: 'signing' }));

      // Submit to relayer
      const response = await fetch('/api/relayer/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit transaction');
      }

      const { txHash } = await response.json();

      setState(s => ({ ...s, status: 'submitted', txHash }));
      config.onSubmitted?.(txHash);

      // Wait for confirmation
      setState(s => ({ ...s, status: 'confirming' }));

      const receipt = await web3Provider.waitForTransaction(
        txHash,
        config.confirmations || 1
      );

      if (receipt.status === 0) {
        throw new Error('Transaction reverted');
      }

      setState(s => ({
        ...s,
        status: 'confirmed',
        receipt,
        confirmations: config.confirmations || 1
      }));

      config.onConfirmed?.(receipt);

      return receipt;

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState(s => ({ ...s, status: 'failed', error: err }));
      config.onError?.(err);
      throw err;
    }
  }, [config]);

  const reset = useCallback(() => {
    setState({
      status: 'idle',
      txHash: null,
      receipt: null,
      error: null,
      confirmations: 0,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
    isLoading: ['preparing', 'signing', 'submitted', 'confirming'].includes(state.status),
  };
}
```

### 8.5 Event Subscription

```typescript
// hooks/useContractEvents.ts

import { useEffect } from 'react';
import { contracts } from '@/lib/web3/contracts';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';

export function useInvestmentEvents(userAddress: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userAddress) return;

    const filter = contracts.rwAGateway.filters.Investment(null, userAddress);

    const handleEvent = (poolId: string, investor: string, amount: bigint, shares: bigint) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: queryKeys.user.portfolio() });
      queryClient.invalidateQueries({ queryKey: ['position', poolId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.pools.detail(poolId) });

      // Show notification
      useUIStore.getState().addNotification({
        type: 'success',
        title: 'Investment Confirmed',
        message: `Invested ${formatUSDC(amount)} in pool`,
      });
    };

    contracts.rwAGateway.on(filter, handleEvent);

    return () => {
      contracts.rwAGateway.off(filter, handleEvent);
    };
  }, [userAddress, queryClient]);
}

export function useYieldDistributionEvents(userAddress: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userAddress) return;

    const filter = contracts.rwAGateway.filters.YieldDistributed();

    const handleEvent = (poolId: string, totalYield: bigint) => {
      // Refresh portfolio and positions
      queryClient.invalidateQueries({ queryKey: queryKeys.user.portfolio() });
      queryClient.invalidateQueries({ queryKey: ['position'] });
    };

    contracts.rwAGateway.on(filter, handleEvent);

    return () => {
      contracts.rwAGateway.off(filter, handleEvent);
    };
  }, [userAddress, queryClient]);
}
```

---

## 9. API Integration Layer

### 9.1 API Client Design

```typescript
// lib/api/client.ts

interface APIClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

class APIClient {
  private config: APIClientConfig;

  constructor(config: Partial<APIClientConfig> = {}) {
    this.config = {
      baseURL: config.baseURL || '/api',
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    };
  }

  private async request<T>(
    method: string,
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseURL}${path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...this.config.headers,
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new APIError(
          response.status,
          error.message || 'Request failed',
          error.code
        );
      }

      return response.json();

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof APIError) throw error;

      if (error.name === 'AbortError') {
        throw new APIError(408, 'Request timeout', 'TIMEOUT');
      }

      throw new APIError(0, 'Network error', 'NETWORK');
    }
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>('POST', path, {
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>('PUT', path, {
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  // Set auth token
  setAuthToken(token: string) {
    this.config.headers['Authorization'] = `Bearer ${token}`;
  }

  clearAuthToken() {
    delete this.config.headers['Authorization'];
  }
}

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

export const apiClient = new APIClient();
```

### 9.2 Endpoint Definitions

```typescript
// lib/api/endpoints.ts

import { apiClient } from './client';
import type {
  Pool,
  PoolFilters,
  User,
  Credential,
  Transaction,
  InvestParams,
  RedeemParams,
} from '@/types';

export const api = {
  // Authentication
  auth: {
    login: (email: string) =>
      apiClient.post<{ sessionToken: string }>('/auth/login', { email }),

    logout: () =>
      apiClient.post<void>('/auth/logout'),

    refreshSession: () =>
      apiClient.post<{ sessionToken: string }>('/auth/refresh'),
  },

  // WebAuthn
  webauthn: {
    getRegisterOptions: (email: string) =>
      apiClient.post<PublicKeyCredentialCreationOptionsJSON>(
        '/webauthn/register-options',
        { email }
      ),

    verifyRegistration: (attestation: AuthenticatorAttestationResponseJSON) =>
      apiClient.post<{ publicKey: { x: string; y: string }; credentialId: string }>(
        '/webauthn/register-verify',
        { attestation }
      ),

    getAuthOptions: (credentialId?: string) =>
      apiClient.post<PublicKeyCredentialRequestOptionsJSON>(
        '/webauthn/auth-options',
        { credentialId }
      ),

    verifyAuth: (assertion: AuthenticatorAssertionResponseJSON) =>
      apiClient.post<{ sessionToken: string }>(
        '/webauthn/auth-verify',
        { assertion }
      ),
  },

  // User
  user: {
    getProfile: () =>
      apiClient.get<User>('/user'),

    updateProfile: (data: Partial<User>) =>
      apiClient.put<User>('/user', data),

    getCredentials: () =>
      apiClient.get<Credential | null>('/user/credentials'),

    getPortfolio: () =>
      apiClient.get<Portfolio>('/user/portfolio'),

    getTransactions: (filters?: TransactionFilters) =>
      apiClient.get<PaginatedResponse<Transaction>>(
        `/user/transactions?${new URLSearchParams(filters as any)}`
      ),
  },

  // Pools
  pools: {
    list: (filters?: PoolFilters) =>
      apiClient.get<PaginatedResponse<Pool>>(
        `/pools?${new URLSearchParams(filters as any)}`
      ),

    getById: (id: string) =>
      apiClient.get<Pool>(`/pools/${id}`),

    getYieldHistory: (id: string) =>
      apiClient.get<YieldDataPoint[]>(`/pools/${id}/yield-history`),

    invest: (params: InvestParams) =>
      apiClient.post<{ txHash: string }>(`/pools/${params.poolId}/invest`, params),

    redeem: (params: RedeemParams) =>
      apiClient.post<{ txHash: string }>(`/pools/${params.poolId}/redeem`, params),
  },

  // Stats
  stats: {
    getGlobal: () =>
      apiClient.get<GlobalStats>('/stats'),
  },

  // Relayer
  relayer: {
    submit: (txData: RelayerTxData) =>
      apiClient.post<{ txHash: string }>('/relayer/submit', txData),

    getStatus: (txHash: string) =>
      apiClient.get<RelayerTxStatus>(`/relayer/status/${txHash}`),
  },
};
```

### 9.3 Response Types

```typescript
// lib/api/types.ts

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface Portfolio {
  totalValue: string;          // BigInt as string
  totalYieldEarned: string;
  pendingYield: string;
  holdings: Holding[];
}

export interface Holding {
  poolId: string;
  poolName: string;
  assetClass: string;
  shares: string;
  value: string;
  yieldRate: number;
  pendingYield: string;
  investedAt: string;
}

export interface GlobalStats {
  tvl: string;
  totalPools: number;
  totalInvestors: number;
  averageYield: number;
  last24hVolume: string;
}

export interface YieldDataPoint {
  timestamp: string;
  cumulativeYield: string;
  yieldRate: number;
}

export interface RelayerTxData {
  to: string;
  data: string;
  signature: {
    r: string;
    s: string;
  };
  deadline: number;
  nonce: number;
}

export interface RelayerTxStatus {
  txHash: string;
  status: 'pending' | 'submitted' | 'confirmed' | 'failed';
  blockNumber?: number;
  error?: string;
}
```

### 9.4 Error Handling Patterns

```typescript
// lib/api/errorHandler.ts

import { APIError } from './client';
import { useAuthStore } from '@/stores/authStore';
import { useUIStore } from '@/stores/uiStore';

export function handleAPIError(error: unknown): never {
  if (error instanceof APIError) {
    // Handle unauthorized - redirect to login
    if (error.isUnauthorized) {
      useAuthStore.getState().logout();
      window.location.href = '/register';
      throw error;
    }

    // Handle rate limiting
    if (error.status === 429) {
      useUIStore.getState().addNotification({
        type: 'warning',
        title: 'Too Many Requests',
        message: 'Please wait a moment before trying again.',
      });
      throw error;
    }

    // Handle server errors
    if (error.isServerError) {
      useUIStore.getState().addNotification({
        type: 'error',
        title: 'Server Error',
        message: 'Something went wrong. Our team has been notified.',
      });
      // Log to Sentry
      throw error;
    }

    throw error;
  }

  // Unknown error
  useUIStore.getState().addNotification({
    type: 'error',
    title: 'Error',
    message: 'An unexpected error occurred.',
  });

  throw error;
}

// Query error handler for TanStack Query
export const queryErrorHandler = (error: unknown) => {
  console.error('Query error:', error);
  // Don't show notification for query errors - let components handle it
};

// Mutation error handler
export const mutationErrorHandler = (error: unknown) => {
  handleAPIError(error);
};
```

---

## 10. Styling Architecture

### 10.1 TailwindCSS Configuration

```typescript
// tailwind.config.ts

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#e63946',  // Primary red (Avalanche inspired)
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },

        // Semantic colors
        success: {
          light: '#dcfce7',
          DEFAULT: '#22c55e',
          dark: '#15803d',
        },
        warning: {
          light: '#fef3c7',
          DEFAULT: '#f59e0b',
          dark: '#b45309',
        },
        error: {
          light: '#fee2e2',
          DEFAULT: '#ef4444',
          dark: '#b91c1c',
        },

        // Background colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',

        // Component colors (shadcn/ui)
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },

      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },

      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },

      fontSize: {
        'display-1': ['4.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-2': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'heading-1': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'heading-2': ['2.25rem', { lineHeight: '1.25', letterSpacing: '-0.01em' }],
        'heading-3': ['1.875rem', { lineHeight: '1.3' }],
        'heading-4': ['1.5rem', { lineHeight: '1.4' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.4' }],
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },

      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 2s linear infinite',
        'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },

      keyframes: {
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5%)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
```

### 10.2 CSS Variables (Design Tokens)

```css
/* app/globals.css */

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Colors - Light Mode */
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 0 84% 60%;        /* Avalanche red */
    --primary-foreground: 0 0% 100%;

    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 0 84% 60%;

    --radius: 0.5rem;

    /* Shadows */
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  }

  .dark {
    /* Colors - Dark Mode */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 0 84% 60%;
    --primary-foreground: 0 0% 100%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 0 84% 60%;
  }
}

@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }

  /* Focus visible styles */
  :focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }

  /* Touch target minimum size */
  button, a, [role="button"] {
    min-height: 44px;
    min-width: 44px;
  }
}

@layer utilities {
  /* Text balance for headings */
  .text-balance {
    text-wrap: balance;
  }

  /* Hide scrollbar but keep functionality */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Glass morphism effect */
  .glass {
    @apply bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg;
  }

  /* Gradient text */
  .gradient-text {
    @apply bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent;
  }
}
```

### 10.3 Responsive Breakpoints

```typescript
// lib/utils/breakpoints.ts

export const breakpoints = {
  sm: 640,   // Small devices (landscape phones)
  md: 768,   // Medium devices (tablets)
  lg: 1024,  // Large devices (desktops)
  xl: 1280,  // Extra large devices (large desktops)
  '2xl': 1536, // 2X large devices
} as const;

// Hook for responsive behavior
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<keyof typeof breakpoints | 'xs'>('xs');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;

      if (width >= breakpoints['2xl']) setBreakpoint('2xl');
      else if (width >= breakpoints.xl) setBreakpoint('xl');
      else if (width >= breakpoints.lg) setBreakpoint('lg');
      else if (width >= breakpoints.md) setBreakpoint('md');
      else if (width >= breakpoints.sm) setBreakpoint('sm');
      else setBreakpoint('xs');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'xs' || breakpoint === 'sm',
    isTablet: breakpoint === 'md',
    isDesktop: breakpoint === 'lg' || breakpoint === 'xl' || breakpoint === '2xl',
  };
}
```

### 10.4 Animation Patterns

```typescript
// lib/utils/animations.ts

import { Variants } from 'framer-motion';

// Page transition variants
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
};

// Stagger children
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

// Card hover
export const cardHover: Variants = {
  initial: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
  tap: { scale: 0.98 },
};

// Biometric pulse
export const biometricPulse: Variants = {
  initial: { scale: 1, opacity: 1 },
  animate: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Success checkmark
export const successCheck: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.5, ease: 'easeOut' },
      opacity: { duration: 0.2 },
    },
  },
};

// Error shake
export const errorShake: Variants = {
  initial: { x: 0 },
  animate: {
    x: [-10, 10, -10, 10, 0],
    transition: { duration: 0.5 },
  },
};
```

---

## 11. Performance Optimization

### 11.1 Code Splitting Strategy

```typescript
// app/(app)/layout.tsx

import dynamic from 'next/dynamic';

// Heavy components loaded on demand
const YieldChart = dynamic(
  () => import('@/components/features/portfolio/YieldChart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Charts don't need SSR
  }
);

const AllocationPie = dynamic(
  () => import('@/components/features/portfolio/AllocationPie'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// Route-based code splitting (automatic with App Router)
// Each page is a separate chunk

// Component-level splitting for modals
const InvestmentModal = dynamic(
  () => import('@/components/features/pools/InvestmentModal'),
  { ssr: false }
);
```

### 11.2 Image Optimization

```typescript
// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    domains: ['assets.rwagateway.com'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Enable experimental features
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },
};

module.exports = nextConfig;
```

### 11.3 Bundle Analysis Targets

```
Target Bundle Sizes:
+--------------------------------------------------+
| Chunk                    | Target    | Threshold |
+--------------------------------------------------+
| First Load JS            | < 100 KB  | Critical  |
| Page: Landing            | < 50 KB   | Important |
| Page: Dashboard          | < 80 KB   | Important |
| Page: Pool Detail        | < 60 KB   | Important |
| Chunk: Charts (lazy)     | < 100 KB  | Normal    |
| Chunk: WebAuthn (lazy)   | < 30 KB   | Normal    |
+--------------------------------------------------+

Analysis Commands:
- npm run build -- --analyze
- npx @next/bundle-analyzer
```

### 11.4 Core Web Vitals Targets

```
+--------------------------------------------------+
| Metric                   | Target    | Threshold |
+--------------------------------------------------+
| LCP (Largest Content)    | < 2.5s    | < 4.0s    |
| FID (First Input Delay)  | < 100ms   | < 300ms   |
| CLS (Cumulative Layout)  | < 0.1     | < 0.25    |
| TTFB (Time to First)     | < 600ms   | < 800ms   |
| FCP (First Content)      | < 1.8s    | < 3.0s    |
+--------------------------------------------------+

Monitoring:
- Vercel Analytics (automatic)
- Chrome DevTools Lighthouse
- web-vitals library for RUM
```

### 11.5 Caching Strategies

```typescript
// TanStack Query caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Different stale times by data type
      staleTime: (query) => {
        if (query.queryKey[0] === 'stats') return 5 * 60 * 1000;  // 5 min
        if (query.queryKey[0] === 'pools') return 30 * 1000;       // 30 sec
        if (query.queryKey[0] === 'user') return 60 * 1000;        // 1 min
        return 30 * 1000;
      },

      // Garbage collection
      gcTime: 5 * 60 * 1000, // 5 minutes

      // Refetch on window focus only for user data
      refetchOnWindowFocus: (query) => {
        return query.queryKey[0] === 'user';
      },
    },
  },
});

// Service Worker caching (future)
// - Cache static assets (images, fonts)
// - Cache API responses with stale-while-revalidate
// - Offline support for dashboard viewing
```

---

## 12. Testing Strategy

### 12.1 Component Testing Approach

```typescript
// tests/unit/components/BiometricButton.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BiometricButton } from '@/components/features/auth/BiometricButton';
import { mockWebAuthn } from '../mocks/webauthn';

describe('BiometricButton', () => {
  beforeEach(() => {
    mockWebAuthn.setup();
  });

  afterEach(() => {
    mockWebAuthn.cleanup();
  });

  it('renders with fingerprint icon in idle state', () => {
    render(<BiometricButton action="authenticate" onSuccess={jest.fn()} onError={jest.fn()} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByTestId('fingerprint-icon')).toBeInTheDocument();
  });

  it('shows loading state when clicked', async () => {
    mockWebAuthn.setAuthResult({ success: true, delay: 1000 });

    render(<BiometricButton action="authenticate" onSuccess={jest.fn()} onError={jest.fn()} />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  it('calls onSuccess with result on successful auth', async () => {
    const onSuccess = jest.fn();
    mockWebAuthn.setAuthResult({ success: true, signature: '0x123' });

    render(<BiometricButton action="authenticate" onSuccess={onSuccess} onError={jest.fn()} />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({ signature: '0x123' })
      );
    });
  });

  it('calls onError when WebAuthn fails', async () => {
    const onError = jest.fn();
    mockWebAuthn.setAuthResult({ success: false, error: 'CANCELLED' });

    render(<BiometricButton action="authenticate" onSuccess={jest.fn()} onError={onError} />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'CANCELLED' })
      );
    });
  });

  it('shows error state and recovers', async () => {
    mockWebAuthn.setAuthResult({ success: false, error: 'TIMEOUT' });

    render(<BiometricButton action="authenticate" onSuccess={jest.fn()} onError={jest.fn()} />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByTestId('error-icon')).toBeInTheDocument();
    });

    // Wait for recovery
    await waitFor(() => {
      expect(screen.getByTestId('fingerprint-icon')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('is accessible with keyboard', () => {
    render(<BiometricButton action="authenticate" onSuccess={jest.fn()} onError={jest.fn()} />);

    const button = screen.getByRole('button');
    button.focus();

    expect(document.activeElement).toBe(button);
    expect(button).toHaveAttribute('aria-label');
  });
});
```

### 12.2 WebAuthn Mocking

```typescript
// tests/mocks/webauthn.ts

interface MockWebAuthnConfig {
  supported: boolean;
  registrationResult?: RegistrationResult | Error;
  authResult?: AuthenticationResult | Error;
}

export const mockWebAuthn = {
  config: {
    supported: true,
  } as MockWebAuthnConfig,

  setup() {
    // Mock navigator.credentials
    Object.defineProperty(window.navigator, 'credentials', {
      value: {
        create: jest.fn(async () => {
          if (!this.config.supported) {
            throw new Error('WebAuthn not supported');
          }

          if (this.config.registrationResult instanceof Error) {
            throw this.config.registrationResult;
          }

          return this.config.registrationResult || createMockAttestation();
        }),

        get: jest.fn(async () => {
          if (!this.config.supported) {
            throw new Error('WebAuthn not supported');
          }

          if (this.config.authResult instanceof Error) {
            throw this.config.authResult;
          }

          return this.config.authResult || createMockAssertion();
        }),
      },
      configurable: true,
    });

    // Mock PublicKeyCredential
    (global as any).PublicKeyCredential = {
      isUserVerifyingPlatformAuthenticatorAvailable: jest.fn(async () => true),
      isConditionalMediationAvailable: jest.fn(async () => true),
    };
  },

  cleanup() {
    this.config = { supported: true };
  },

  setSupported(supported: boolean) {
    this.config.supported = supported;
  },

  setRegistrationResult(result: RegistrationResult | Error) {
    this.config.registrationResult = result;
  },

  setAuthResult(config: { success: boolean; signature?: string; error?: string; delay?: number }) {
    if (!config.success) {
      this.config.authResult = new DOMException(config.error || 'Error', 'NotAllowedError');
    } else {
      this.config.authResult = createMockAssertion(config.signature);
    }
  },
};

function createMockAttestation(): PublicKeyCredential {
  return {
    id: 'mock-credential-id',
    rawId: new ArrayBuffer(32),
    type: 'public-key',
    response: {
      clientDataJSON: new ArrayBuffer(100),
      attestationObject: new ArrayBuffer(200),
      getTransports: () => ['internal'],
      getPublicKey: () => new ArrayBuffer(65),
      getPublicKeyAlgorithm: () => -7,
      getAuthenticatorData: () => new ArrayBuffer(37),
    },
    getClientExtensionResults: () => ({}),
    authenticatorAttachment: 'platform',
  } as PublicKeyCredential;
}

function createMockAssertion(signature?: string): PublicKeyCredential {
  return {
    id: 'mock-credential-id',
    rawId: new ArrayBuffer(32),
    type: 'public-key',
    response: {
      clientDataJSON: new ArrayBuffer(100),
      authenticatorData: new ArrayBuffer(37),
      signature: signature
        ? hexToBuffer(signature)
        : new ArrayBuffer(64),
      userHandle: new ArrayBuffer(16),
    },
    getClientExtensionResults: () => ({}),
    authenticatorAttachment: 'platform',
  } as PublicKeyCredential;
}
```

### 12.3 E2E Test Scenarios

```typescript
// tests/e2e/investment.spec.ts

import { test, expect } from '@playwright/test';
import { mockWebAuthn, mockAPI } from './fixtures';

test.describe('Investment Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mocks
    await mockWebAuthn.enable(page);
    await mockAPI.setup(page);

    // Login
    await page.goto('/register');
    await mockWebAuthn.completeRegistration(page);
    await page.waitForURL('/dashboard');
  });

  test('complete investment flow', async ({ page }) => {
    // 1. Navigate to pool
    await page.goto('/pools');
    await page.getByRole('link', { name: /avalanche treasury/i }).click();
    await expect(page).toHaveURL(/\/pools\/.+/);

    // 2. Enter investment amount
    await page.getByRole('button', { name: /invest/i }).click();
    await page.getByRole('textbox', { name: /amount/i }).fill('10000');

    // 3. Verify calculations shown
    await expect(page.getByText(/10,000 RWA-TREAS/)).toBeVisible();
    await expect(page.getByText(/\$450.*year/i)).toBeVisible();

    // 4. Continue to review
    await page.getByRole('button', { name: /continue/i }).click();

    // 5. Verify review screen
    await expect(page.getByText(/review investment/i)).toBeVisible();
    await expect(page.getByText('$10,000.00')).toBeVisible();

    // 6. Confirm with biometric
    await page.getByRole('button', { name: /confirm/i }).click();

    // 7. Complete biometric (mocked)
    await mockWebAuthn.completeAuth(page);

    // 8. Wait for transaction
    await expect(page.getByText(/processing/i)).toBeVisible();
    await mockAPI.completeTransaction(page);

    // 9. Verify success
    await expect(page.getByText(/investment successful/i)).toBeVisible();
    await expect(page.getByText('10,000 RWA-TREAS')).toBeVisible();

    // 10. Navigate to portfolio
    await page.getByRole('button', { name: /view portfolio/i }).click();
    await expect(page).toHaveURL('/portfolio');

    // 11. Verify holding appears
    await expect(page.getByText(/avalanche treasury/i)).toBeVisible();
    await expect(page.getByText('$10,000')).toBeVisible();
  });

  test('handles insufficient balance', async ({ page }) => {
    await mockAPI.setUserBalance(page, 50); // Only $50 USDC

    await page.goto('/pools/treasury-pool');
    await page.getByRole('button', { name: /invest/i }).click();
    await page.getByRole('textbox', { name: /amount/i }).fill('10000');

    await expect(page.getByText(/insufficient balance/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  test('handles biometric cancellation', async ({ page }) => {
    await page.goto('/pools/treasury-pool');
    await page.getByRole('button', { name: /invest/i }).click();
    await page.getByRole('textbox', { name: /amount/i }).fill('1000');
    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();

    // Cancel biometric
    await mockWebAuthn.cancel(page);

    await expect(page.getByText(/cancelled/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /try again/i })).toBeVisible();
  });

  test('handles transaction failure', async ({ page }) => {
    await page.goto('/pools/treasury-pool');
    await page.getByRole('button', { name: /invest/i }).click();
    await page.getByRole('textbox', { name: /amount/i }).fill('1000');
    await page.getByRole('button', { name: /continue/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();
    await mockWebAuthn.completeAuth(page);

    // Fail transaction
    await mockAPI.failTransaction(page, 'Insufficient gas');

    await expect(page.getByText(/transaction failed/i)).toBeVisible();
    await expect(page.getByText(/insufficient gas/i)).toBeVisible();
  });
});
```

---

## Appendix A: Component Checklist

Before shipping any component, verify:

- [ ] TypeScript props interface defined
- [ ] Default props handled
- [ ] Loading state implemented
- [ ] Error state implemented
- [ ] Empty state implemented (if applicable)
- [ ] Responsive at all breakpoints
- [ ] Touch targets >= 44px
- [ ] Keyboard accessible
- [ ] Screen reader friendly (aria labels)
- [ ] Animations respect reduced-motion
- [ ] Dark mode compatible
- [ ] Unit tests written
- [ ] Storybook story (if using)

---

## Appendix B: Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-04 | Architecture Team | Initial draft |

---

**End of Phase 3: Frontend Architecture**

*Next: Phase 4 - Backend & API Architecture*
