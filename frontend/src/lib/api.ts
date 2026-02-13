import { useAuthStore } from "@/stores/authStore";
import { parseError, ErrorCodes, type AppError } from "./error-handling";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const BLOCKCHAIN_TIMEOUT = 90000; // 90 seconds for blockchain operations

export class ApiError extends Error {
  status: number;
  code: string;
  details?: string;

  constructor(message: string, status: number, code?: string, details?: string) {
    super(message);
    this.status = status;
    this.code = code || ErrorCodes.UNKNOWN_ERROR;
    this.details = details;
    this.name = "ApiError";
  }

  toAppError(): AppError {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.status,
      details: this.details,
    };
  }
}

class ApiClient {
  /**
   * Read CSRF token from cookie (fallback if not in store)
   * The cookie is set with httpOnly: false so JS can read it
   */
  private getCsrfTokenFromCookie(): string | null {
    if (typeof document === "undefined") return null;
    const match = document.cookie.match(/csrf_token=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  /**
   * Get headers for API requests
   * SEC-002: No longer sends Authorization header (using httpOnly cookies instead)
   */
  private getHeaders(method: string = "GET"): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // SEC-002: Add CSRF token for mutating requests
    // Try store first, then fall back to cookie (more robust for edge cases)
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      const csrfToken = useAuthStore.getState().csrfToken || this.getCsrfTokenFromCookie();
      if (csrfToken) {
        headers["X-CSRF-Token"] = csrfToken;
      }
    }

    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ error: "Request failed" }));

      // Handle 401 - session expired
      if (res.status === 401) {
        useAuthStore.getState().logout();
        throw new ApiError(
          "Your session has expired. Please log in again.",
          res.status,
          ErrorCodes.SESSION_EXPIRED
        );
      }

      throw new ApiError(
        errorBody.error || errorBody.message || "Request failed",
        res.status,
        errorBody.code,
        errorBody.details
      );
    }

    return res.json();
  }

  private async fetchWithTimeout<T>(
    url: string,
    options: RequestInit,
    timeout = DEFAULT_TIMEOUT
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(url, {
        ...options,
        credentials: "include", // SEC-002: Send cookies automatically
        signal: controller.signal,
        cache: "no-store", // Prevent browser caching of API responses
      });
      return this.handleResponse<T>(res);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Handle abort/timeout
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("Request timed out", 408, ErrorCodes.TIMEOUT);
      }

      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new ApiError(
          "Unable to connect to the server",
          0,
          ErrorCodes.NETWORK_ERROR,
          error.message
        );
      }

      // Parse other errors
      const appError = parseError(error);
      throw new ApiError(appError.message, 0, appError.code, appError.details);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T>(path: string, options?: { timeout?: number }): Promise<T> {
    return this.fetchWithTimeout<T>(
      `${API_URL}${path}`,
      {
        method: "GET",
        headers: this.getHeaders("GET"),
      },
      options?.timeout
    );
  }

  async post<T>(path: string, body?: unknown, options?: { timeout?: number }): Promise<T> {
    return this.fetchWithTimeout<T>(
      `${API_URL}${path}`,
      {
        method: "POST",
        headers: this.getHeaders("POST"),
        body: body ? JSON.stringify(body) : undefined,
      },
      options?.timeout
    );
  }

  async put<T>(path: string, body?: unknown, options?: { timeout?: number }): Promise<T> {
    return this.fetchWithTimeout<T>(
      `${API_URL}${path}`,
      {
        method: "PUT",
        headers: this.getHeaders("PUT"),
        body: body ? JSON.stringify(body) : undefined,
      },
      options?.timeout
    );
  }

  async delete<T>(path: string, options?: { timeout?: number }): Promise<T> {
    return this.fetchWithTimeout<T>(
      `${API_URL}${path}`,
      {
        method: "DELETE",
        headers: this.getHeaders("DELETE"),
      },
      options?.timeout
    );
  }
}

export const api = new ApiClient();

// ==================== Auth API ====================

export interface AuthUser {
  id: string;
  email: string;
  walletAddress: string;
  displayName?: string;
}

// Import WebAuthn types from the library for type compatibility
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";

export interface RegisterOptionsResponse {
  options: PublicKeyCredentialCreationOptionsJSON;
  challengeId: string;
}

export interface RegisterVerifyResponse {
  success: boolean;
  user: AuthUser;
  publicKey: { x: string; y: string };
}

export interface LoginOptionsResponse {
  options: PublicKeyCredentialRequestOptionsJSON;
  challengeId: string;
}

export interface LoginVerifyResponse {
  success: boolean;
  token: string; // Kept for backward compatibility
  expiresAt: string;
  user: AuthUser;
  csrfToken: string; // SEC-002: CSRF token for secure requests
}

// ==================== Multi-Auth Types ====================

export interface GoogleTokenResponse {
  success: boolean;
  user: AuthUser & { authProvider: string; avatarUrl?: string };
  isNewUser: boolean;
  expiresAt: string;
  csrfToken: string;
}

export interface SendCodeResponse {
  success: boolean;
  message: string;
  expiresAt: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  user: AuthUser & { authProvider: string };
  isNewUser: boolean;
  hasBiometrics: boolean;
  expiresAt: string;
  csrfToken: string;
}

export interface WalletNonceResponse {
  success: boolean;
  nonce: string;
  message: string;
  expiresAt: string;
}

export interface WalletVerifyResponse {
  success: boolean;
  user: AuthUser & { authProvider: string };
  isNewUser: boolean;
  hasBiometrics: boolean;
  expiresAt: string;
  csrfToken: string;
}

// ==================== Recovery Codes API ====================

export interface RecoveryCodesStatus {
  success: boolean;
  total: number;
  unused: number;
}

export interface GenerateRecoveryCodesResponse {
  success: boolean;
  codes: string[];
  message: string;
}

export const recoveryApi = {
  getStatus: () => api.get<RecoveryCodesStatus>("/auth/recovery-codes/status"),

  generateCodes: () =>
    api.post<GenerateRecoveryCodesResponse>("/auth/recovery-codes/generate"),

  startRecovery: (email: string) =>
    api.post<{ success: boolean; message: string }>("/auth/recovery/start", { email }),

  verifyRecovery: (email: string, emailCode: string, recoveryCode: string) =>
    api.post<{
      success: boolean;
      options: PublicKeyCredentialCreationOptionsJSON;
      challengeId: string;
    }>("/auth/recovery/verify", { email, emailCode, recoveryCode }),
};

export const authApi = {
  // Existing biometric methods
  registerOptions: (email: string, displayName?: string) =>
    api.post<RegisterOptionsResponse>("/auth/register-options", {
      email,
      displayName,
    }),

  registerVerify: (challengeId: string, response: unknown) =>
    api.post<RegisterVerifyResponse>("/auth/register-verify", {
      challengeId,
      response,
    }),

  // Add passkey to authenticated account
  addPasskeyOptions: () =>
    api.post<RegisterOptionsResponse>("/auth/passkeys/add-options"),

  loginOptions: (email: string) =>
    api.post<LoginOptionsResponse>("/auth/login-options", { email }),

  loginVerify: (challengeId: string, response: unknown) =>
    api.post<LoginVerifyResponse>("/auth/login-verify", {
      challengeId,
      response,
    }),

  logout: () => api.post("/auth/logout"),

  session: () => api.get<{ success: boolean; session: { user: AuthUser; expiresAt: string } }>("/auth/session"),

  // Google OAuth
  googleToken: (idToken: string) =>
    api.post<GoogleTokenResponse>("/auth/google/token", { idToken }),

  getGoogleAuthUrl: () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    return `${API_URL}/auth/google`;
  },

  // Email verification
  sendCode: (email: string) =>
    api.post<SendCodeResponse>("/auth/email/send-code", { email }),

  verifyCode: (email: string, code: string, displayName?: string) =>
    api.post<VerifyCodeResponse>("/auth/email/verify-code", {
      email,
      code,
      displayName,
    }),

  // Wallet SIWE
  walletNonce: (walletAddress: string) =>
    api.post<WalletNonceResponse>("/auth/wallet/nonce", { walletAddress }),

  walletVerify: (message: string, signature: string) =>
    api.post<WalletVerifyResponse>("/auth/wallet/verify", { message, signature }),
};

// ==================== Pool API ====================

export interface Pool {
  id: string;
  name: string;
  description: string;
  assetClass: "treasury" | "real-estate" | "private-credit" | "corporate-bonds";
  status: "active" | "paused" | "closed";
  totalValue: string;
  availableCapacity: string;
  yieldRate: number;
  minInvestment: string;
  maxInvestment: string;
  lockupPeriod: number; // days
  maturityDate?: string;
  riskRating: "low" | "medium" | "high";
  documents?: Array<{ name: string; url: string }>;
  navPerShare?: string; // decimal string like "1.02380000"
  createdAt: string;
  updatedAt: string;
}

export interface PoolInvestment {
  id: string;
  poolId: string;
  userId: string;
  amount: string;
  shares: string;
  status: "pending" | "confirmed" | "failed";
  txHash?: string;
  createdAt: string;
}

// WebAuthn response format for passkey-signed transactions
export interface WebAuthnResponse {
  id: string;
  rawId: string;
  response: {
    authenticatorData: string;
    clientDataJSON: string;
    signature: string;
  };
  type: "public-key";
  clientExtensionResults?: Record<string, unknown>;
  authenticatorAttachment?: string;
}

// Response when passkey verification is required
export interface PasskeyRequiredResponse {
  success: false;
  error: string;
  code: "PASSKEY_REQUIRED";
  challenge: {
    id: string;
    challenge: string;
    rpId: string;
    timeout: number;
    userVerification: string;
    allowCredentials: Array<{ id: string; type: string; transports: string[] }>;
  };
  message: string;
}

export const poolApi = {
  list: (params?: { assetClass?: string; status?: string; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.assetClass) searchParams.set("assetClass", params.assetClass);
    if (params?.status) searchParams.set("status", params.status);
    // Default to fetching all pools (100 limit) to avoid pagination issues
    searchParams.set("limit", String(params?.limit || 100));
    const query = searchParams.toString();
    return api.get<{ pools: Pool[]; pagination?: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean } }>(`/pools?${query}`);
  },

  get: (id: string) => api.get<{ pool: Pool }>(`/pools/${id}`),

  // First call without webauthnResponse to get the challenge
  // This returns 401 with the challenge data - we handle it specially
  getInvestChallenge: async (poolId: string, amount: string): Promise<PasskeyRequiredResponse> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const csrfToken = useAuthStore.getState().csrfToken;

    const res = await fetch(`${API_URL}/pools/${poolId}/invest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken && { "X-CSRF-Token": csrfToken }),
      },
      credentials: "include",
      body: JSON.stringify({ amount }),
    });

    const data = await res.json();

    // The 401 with PASSKEY_REQUIRED is the expected response - it contains the challenge
    if (res.status === 401 && data.code === "PASSKEY_REQUIRED") {
      return data as PasskeyRequiredResponse;
    }

    // Any other error is unexpected
    if (!res.ok) {
      throw new ApiError(data.error || "Failed to get investment challenge", res.status, data.code);
    }

    return data;
  },

  // Then call with the WebAuthn response to complete the investment
  invest: (poolId: string, amount: string, challengeId: string, webauthnResponse: WebAuthnResponse) =>
    api.post<{ success: true; investment: PoolInvestment }>(`/pools/${poolId}/invest`, {
      amount,
      challengeId,
      webauthnResponse,
    }, { timeout: BLOCKCHAIN_TIMEOUT }),

  // Redeem - simpler flow (no passkey required by backend currently)
  redeem: (poolId: string, shares: string) =>
    api.post<{
      success: true;
      redemption: {
        id: string;
        poolId: string;
        shares: string;
        amount: string;
        status: string;
        createdAt: string;
        txHash: string | null;
      };
      onChain: {
        status: string;
        txHash: string | null;
        explorer: string | null;
      };
      message: string;
    }>(`/pools/${poolId}/redeem`, { shares }, { timeout: BLOCKCHAIN_TIMEOUT }),
};

// ==================== Portfolio API ====================

export interface PortfolioHolding {
  poolId: string;
  poolName: string;
  assetClass: string;
  yieldRatePercent: string;
  totalInvested: string;
  totalRedeemed: string;
  netInvested: string;
  totalShares: string;
  status: string;
  // NAV-based value tracking
  currentValue: string;
  costBasis: string;
  unrealizedGain: string;
  gainPercent: string;
  navPerShare: string;
  // Lockup status
  lockupPeriod: number;      // Days
  unlockDate: string | null; // ISO date string
  daysRemaining: number;     // Countdown
  isLocked: boolean;         // Quick check
}

export interface PortfolioSummary {
  totalCurrentValue: string;
  totalCostBasis: string;
  totalUnrealizedGain: string;
  totalGainPercent: string;
  holdingsCount: number;
  credentialsCount: number;
}

// Keep old interface for backward compat in UI
export interface PortfolioPosition {
  poolId: string;
  poolName: string;
  assetClass: string;
  shares: string;
  currentValue: string;
  costBasis: string;
  unrealizedGain: string;
  yieldEarned: string;
}

export interface PortfolioData {
  user: {
    walletAddress?: string;
    email?: string;
    displayName?: string;
    memberSince?: string;
  };
  summary: PortfolioSummary;
  holdings: PortfolioHolding[];
  credentials: unknown[];
}

export interface YieldEvent {
  id: string;
  poolId: string;
  poolName: string;
  amount: string;
  date: string;
  type: "distribution" | "accrual";
}

export interface Transaction {
  id: string;
  poolId: string;
  poolName: string;
  type: "invest" | "redeem" | "yield";
  amount: string;
  shares?: string;
  status: "pending" | "confirmed" | "failed";
  txHash?: string;
  createdAt: string;
}

export interface PortfolioHistoryPoint {
  date: number; // Unix timestamp in seconds
  value: string; // Value in smallest unit (USDC with 6 decimals)
}

export const portfolioApi = {
  get: () => api.get<{ portfolio: PortfolioData }>("/portfolio"),

  yield: () => api.get<{ yields: YieldEvent[] }>("/portfolio/yield"),

  transactions: (params?: { limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set("limit", params.limit.toString());
    if (params?.offset) searchParams.set("offset", params.offset.toString());
    const query = searchParams.toString();
    return api.get<{ transactions: Transaction[] }>(`/portfolio/transactions${query ? `?${query}` : ""}`);
  },

  history: () => api.get<{ history: PortfolioHistoryPoint[] }>("/portfolio/history"),
};

// ==================== Document Seal API ====================

export interface DocumentSealResult {
  txHash: string;
  documentHash: string;
  sealedAt: number;
}

export interface DocumentVerifyResult {
  isSealed: boolean;
  sealer: string | null;
  sealedAt: number | null;
  metadata: string | null;
}

export const documentApi = {
  seal: (params: {
    documentHash: string;
    metadata?: string;
    signature: {
      deadline: number;
      authenticatorData: string;
      clientDataJSON: string;
      signature: string;
    };
  }) => api.post<DocumentSealResult>("/documents/seal", params, { timeout: BLOCKCHAIN_TIMEOUT }),

  verify: (documentHash: string) =>
    api.get<DocumentVerifyResult>(`/documents/verify/${encodeURIComponent(documentHash)}`),

  list: () =>
    api.get<{
      documents: Array<{
        documentHash: string;
        metadata: string | null;
        sealedAt: number;
        txHash: string;
      }>;
    }>("/documents"),
};

// ==================== Swap API ====================

export interface SwapQuote {
  sourcePoolId: string;
  sourcePoolName?: string;
  targetPoolId: string;
  targetPoolName?: string;
  sharesIn: string;
  sourceNav: string;
  targetNav: string;
  sourceAmount: string;
  fee: string;
  feeFormatted: string;
  targetAmount: string;
  targetShares: string;
  slippageBps: number;
  minOutputShares: string;
  expiresAt: string;
}

export interface SwapBuildResult {
  id: string;
  sourcePoolId: string;
  sourcePoolName?: string;
  targetPoolId: string;
  targetPoolName?: string;
  sourcePoolChainId: number;
  targetPoolChainId: number;
  callData: string;
  status: string;
}

export interface Swap {
  id: string;
  sourcePoolId: string;
  sourcePoolName?: string;
  targetPoolId: string;
  targetPoolName?: string;
  sharesSwapped: string;
  sourceAmount: string;
  targetAmount: string;
  targetShares: string;
  fee: string;
  feeFormatted?: string;
  sourceNavAtSwap: string;
  targetNavAtSwap: string;
  slippageBps: number;
  status: string;
  txHash?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SwapStats {
  totalSwaps: number;
  successfulSwaps: number;
  totalFeesPaid: string;
  totalFeesPaidFormatted: string;
  totalVolumeSwapped: string;
  totalVolumeFormatted: string;
  successRate: string;
}

// Response when passkey is required for swap
export interface SwapPasskeyRequiredResponse {
  success: false;
  error: string;
  code: "PASSKEY_REQUIRED";
  challenge: {
    id: string;
    challenge: string;
    rpId: string;
    timeout: number;
    userVerification: string;
    allowCredentials: Array<{ id: string; type: string; transports?: string[] }>;
  };
  swapId: string;
  message: string;
}

export const swapApi = {
  // Get a quote for swapping between pools
  getQuote: (sourcePoolId: string, targetPoolId: string, shares: string, slippageBps?: number) => {
    const params = new URLSearchParams({
      sourcePoolId,
      targetPoolId,
      shares,
      ...(slippageBps !== undefined && { slippageBps: slippageBps.toString() }),
    });
    return api.get<{ success: true; quote: SwapQuote; message: string }>(`/swap/quote?${params}`);
  },

  // Build swap UserOp (creates database record)
  build: (sourcePoolId: string, targetPoolId: string, shares: string, slippageBps?: number) =>
    api.post<{ success: true; swap: SwapBuildResult; quote: SwapQuote; message: string }>("/swap/build", {
      sourcePoolId,
      targetPoolId,
      shares,
      ...(slippageBps !== undefined && { slippageBps }),
    }),

  // Submit swap - first call returns passkey challenge
  submitForChallenge: async (swapId: string): Promise<SwapPasskeyRequiredResponse> => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    const csrfToken = useAuthStore.getState().csrfToken;

    const res = await fetch(`${API_URL}/swap/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(csrfToken && { "X-CSRF-Token": csrfToken }),
      },
      credentials: "include",
      body: JSON.stringify({ swapId }),
    });

    const data = await res.json();

    if (res.status === 401 && data.code === "PASSKEY_REQUIRED") {
      return data as SwapPasskeyRequiredResponse;
    }

    if (!res.ok) {
      throw new ApiError(data.error || "Failed to get swap challenge", res.status, data.code);
    }

    return data;
  },

  // Submit swap with passkey signature
  submit: (swapId: string, challengeId: string, webauthnResponse: WebAuthnResponse) =>
    api.post<{
      success: true;
      swap: { id: string; status: string; sourceShares: string; targetShares: string; fee: string; txHash?: string };
      transaction: { txHash?: string; explorer?: string };
      message: string;
    }>("/swap/submit", { swapId, challengeId, webauthnResponse }, { timeout: BLOCKCHAIN_TIMEOUT }),

  // Get swap by ID
  get: (swapId: string) => api.get<{ success: true; swap: Swap; explorer?: string }>(`/swap/${swapId}`),

  // Get swap history
  history: (limit?: number) => {
    const params = limit ? `?limit=${limit}` : "";
    return api.get<{ success: true; swaps: Swap[]; count: number }>(`/swap${params}`);
  },

  // Get swap statistics
  stats: () => api.get<{ success: true; stats: SwapStats }>("/swap/stats"),

  // Cancel pending swap
  cancel: (swapId: string) => api.delete<{ success: true; message: string }>(`/swap/${swapId}`),
};

// ==================== Relayer API ====================

export interface WalletBalanceResponse {
  balance: string;
  balanceFormatted: string;
  token: string;
}

export interface FaucetResponse {
  txHash: string;
  newBalance: string;
  amount: string;
}

export const relayerApi = {
  getUsdcBalance: (address: string) =>
    api.get<WalletBalanceResponse>(`/relayer/usdc-balance/${address}`),

  faucet: () =>
    api.post<FaucetResponse>("/relayer/faucet", undefined, { timeout: BLOCKCHAIN_TIMEOUT }),
};
