/**
 * Gasless Investment Flow
 * Routes to appropriate gasless method based on user's auth provider
 *
 * Part 3: Integration with Existing System
 *
 * | User Type | Solution | Why |
 * |-----------|----------|-----|
 * | Wallet Users (SIWE) | EIP-2612 Permit | Already have secp256k1 wallet |
 * | Google/Email Users | ERC-4337 UserOperation | Passkey-controlled smart wallet |
 */

import { useAuthStore, type AuthProvider } from "@/stores/authStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Avalanche Fuji testnet config
const AVALANCHE_FUJI = {
  chainId: "0xa869", // 43113 in hex
  chainName: "Avalanche Fuji Testnet",
  nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
  rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
  blockExplorerUrls: ["https://testnet.snowtrace.io/"],
};

/**
 * Ensure wallet is on the correct chain, prompt to switch if not
 */
async function ensureCorrectChain(): Promise<void> {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No wallet connected");
  }

  const currentChainId = await window.ethereum.request({ method: "eth_chainId" });

  if (currentChainId !== AVALANCHE_FUJI.chainId) {
    try {
      // Try to switch to Fuji
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: AVALANCHE_FUJI.chainId }],
      });
    } catch (switchError: unknown) {
      const errorCode = (switchError as { code?: number })?.code;
      const errorMessage = (switchError as { message?: string })?.message || "";

      // Chain not added - error codes vary by wallet:
      // 4902: Standard "chain not added" code
      // -32603: Internal JSON-RPC error (some wallets use this)
      // Also check error message for "Unrecognized chain"
      const chainNotAdded =
        errorCode === 4902 ||
        errorCode === -32603 ||
        errorMessage.toLowerCase().includes("unrecognized chain") ||
        errorMessage.toLowerCase().includes("chain has not been added");

      if (chainNotAdded) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [AVALANCHE_FUJI],
          });
          // After adding, verify we're on the correct chain
          const newChainId = await window.ethereum.request({ method: "eth_chainId" });
          if (newChainId !== AVALANCHE_FUJI.chainId) {
            throw new Error("Please switch to Avalanche Fuji network in your wallet");
          }
        } catch (addError: unknown) {
          const addMessage = (addError as { message?: string })?.message || "";
          if (addMessage.includes("rejected") || addMessage.includes("denied")) {
            throw new Error("Please approve adding Avalanche Fuji network to continue");
          }
          throw new Error("Failed to add Avalanche Fuji network. Please add it manually.");
        }
      } else {
        // User rejected the switch request
        const rejected =
          errorMessage.includes("rejected") || errorMessage.includes("denied");
        if (rejected) {
          throw new Error("Please switch to Avalanche Fuji network to continue");
        }
        throw new Error("Please switch to Avalanche Fuji network in your wallet");
      }
    }
  }
}

/**
 * Get headers with CSRF token for authenticated requests
 */
function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const csrfToken = useAuthStore.getState().csrfToken;
  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }

  return headers;
}

export type GaslessStep =
  | "idle"
  | "checking"
  | "building"
  | "signing"
  | "submitting"
  | "confirming"
  | "complete"
  | "error";

export type GaslessMethod = "permit" | "userop" | null;

export interface GaslessFlowState {
  step: GaslessStep;
  method: GaslessMethod;
  poolId: string | null;
  amount: string | null;
  txHash: string | null;
  userOpHash: string | null;
  walletAddress: string | null;
  error: string | null;
}

type Listener = (state: GaslessFlowState) => void;

/**
 * Determines gasless method based on auth provider
 */
function getGaslessMethod(authProvider: AuthProvider): GaslessMethod {
  switch (authProvider) {
    case "WALLET":
      // Wallet users: EIP-2612 Permit (they have secp256k1 keys)
      return "permit";
    case "GOOGLE":
    case "EMAIL":
      // Passkey users: ERC-4337 UserOperation (P-256 smart wallet)
      return "userop";
    default:
      return null;
  }
}

export class GaslessInvestmentFlow {
  private state: GaslessFlowState = {
    step: "idle",
    method: null,
    poolId: null,
    amount: null,
    txHash: null,
    userOpHash: null,
    walletAddress: null,
    error: null,
  };

  private listeners: Set<Listener> = new Set();
  private abortController: AbortController | null = null;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): GaslessFlowState {
    return { ...this.state };
  }

  private notify(): void {
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  private setState(partial: Partial<GaslessFlowState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  /**
   * Start gasless investment
   * Automatically routes to permit or userop based on auth provider
   */
  async invest(poolId: string, amount: string): Promise<void> {
    console.log("[Gasless] Starting investment flow", { poolId, amount, API_URL });
    this.abort();
    this.abortController = new AbortController();

    try {
      // Step 1: Check auth and determine method
      this.setState({
        step: "checking",
        poolId,
        amount,
        error: null,
        txHash: null,
        userOpHash: null,
      });

      const { user, isAuthenticated, csrfToken } = useAuthStore.getState();
      console.log("[Gasless] Auth state:", {
        isAuthenticated,
        hasUser: !!user,
        authProvider: user?.authProvider,
        walletAddress: user?.walletAddress,
        hasCsrfToken: !!csrfToken,
      });

      if (!user || !isAuthenticated) {
        throw new Error("Not authenticated. Please log in first.");
      }

      const method = getGaslessMethod(user.authProvider);
      console.log("[Gasless] Selected method:", method);
      if (!method) {
        throw new Error("Unknown auth provider. Cannot determine gasless method.");
      }

      this.setState({ method });

      // Step 2: Route to appropriate flow
      if (method === "permit") {
        await this.investWithPermit(poolId, amount, user.walletAddress!);
      } else {
        await this.investWithUserOp(poolId, amount);
      }

      this.setState({ step: "complete" });
      console.log("[Gasless] Investment complete");
    } catch (error) {
      console.error("[Gasless] Investment error:", error);
      const message = error instanceof Error ? error.message : "Investment failed";
      this.setState({ step: "error", error: message });
      throw error;
    }
  }

  /**
   * EIP-2612 Permit flow for wallet users
   */
  private async investWithPermit(
    poolId: string,
    amount: string,
    walletAddress: string
  ): Promise<void> {
    const signal = this.abortController?.signal;

    // Build permit data
    this.setState({ step: "building", walletAddress });

    const headers = getAuthHeaders();
    const url = `${API_URL}/pools/${poolId}/permit-data`;
    console.log("[Permit] Fetching permit data:", { url, amount, headers: Object.keys(headers) });

    let permitResponse: Response;
    try {
      permitResponse = await fetch(url, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ amount }),
        signal,
      });
      console.log("[Permit] Response status:", permitResponse.status, permitResponse.statusText);
    } catch (fetchError) {
      console.error("[Permit] Fetch failed:", fetchError);
      throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : "Failed to reach server"}`);
    }

    if (!permitResponse.ok) {
      const errorText = await permitResponse.text();
      console.error("[Permit] Response error:", permitResponse.status, errorText);
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.message || error.error || `Server error: ${permitResponse.status}`);
      } catch {
        throw new Error(`Server error: ${permitResponse.status} - ${errorText.slice(0, 100)}`);
      }
    }

    const permitResult = await permitResponse.json();
    console.log("[Permit] Got permit data:", { success: permitResult.success, hasTypedData: !!permitResult.typedData });

    if (!permitResult.success || !permitResult.typedData) {
      throw new Error(permitResult.error || "Failed to get permit data");
    }

    const { typedData, permit } = permitResult;

    // Ensure correct chain before signing
    await ensureCorrectChain();

    // Sign with wallet
    this.setState({ step: "signing" });

    // Verify the currently selected MetaMask account matches the expected wallet address
    // This prevents signature verification failures when user has switched accounts
    console.log("[Permit] Checking MetaMask account...");
    const accounts = (await window.ethereum!.request({
      method: "eth_accounts",
    })) as string[];

    console.log("[Permit] MetaMask accounts:", accounts);
    console.log("[Permit] Expected wallet:", walletAddress);

    if (!accounts || accounts.length === 0) {
      throw new Error("No wallet connected. Please connect your wallet.");
    }

    const currentAccount = accounts[0].toLowerCase();
    const expectedAccount = walletAddress.toLowerCase();

    console.log("[Permit] Current account:", currentAccount);
    console.log("[Permit] Expected account:", expectedAccount);
    console.log("[Permit] Match:", currentAccount === expectedAccount);

    if (currentAccount !== expectedAccount) {
      throw new Error(
        `Wrong wallet account! Please switch to ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)} (currently using ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)})`
      );
    }

    console.log("[Permit] Account verified, proceeding to sign...");

    // window.ethereum is guaranteed to exist after ensureCorrectChain()
    const signature = await window.ethereum!.request({
      method: "eth_signTypedData_v4",
      params: [walletAddress, JSON.stringify(typedData)],
    });

    // Submit to relayer with full signature
    this.setState({ step: "submitting" });

    const submitResponse = await fetch(`${API_URL}/pools/${poolId}/invest-permit`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({
        amount,
        deadline: permit.deadline,
        signature: signature as string,
      }),
      signal,
    });

    if (!submitResponse.ok) {
      const error = await submitResponse.json();
      throw new Error(error.message || error.error || "Failed to submit investment");
    }

    const result = await submitResponse.json();

    // Check for error in result
    if (result.success === false || result.error) {
      throw new Error(result.error || result.message || "Investment transaction failed");
    }

    // Backend returns { success: true, investment: { txHash, status } }
    // The backend already waits for 2 confirmations before returning
    const txHash = result.investment?.txHash;

    if (!txHash) {
      throw new Error("No transaction hash received from server");
    }

    // Backend has already confirmed the transaction (waits for 2 blocks)
    // Just update state with the txHash - no polling needed
    this.setState({ step: "confirming", txHash });

    // Transaction is already confirmed since backend waited for confirmation
    // Mark as complete
  }

  /**
   * ERC-4337 UserOperation flow for passkey users
   */
  private async investWithUserOp(poolId: string, amount: string): Promise<void> {
    const signal = this.abortController?.signal;

    // Build UserOperation
    this.setState({ step: "building" });

    const buildResponse = await fetch(`${API_URL}/userop/invest/build`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ poolId, amount }),
      signal,
    });

    if (!buildResponse.ok) {
      const error = await buildResponse.json();
      throw new Error(error.error || error.message || "Failed to build UserOperation");
    }

    const { requestId, walletAddress, signingInstructions } = await buildResponse.json();
    this.setState({ walletAddress });

    // Sign with passkey
    this.setState({ step: "signing" });

    const { startAuthentication } = await import("@simplewebauthn/browser");

    const assertion = await startAuthentication({
      optionsJSON: {
        challenge: signingInstructions.challenge,
        rpId: signingInstructions.rpId,
        timeout: 60000,
        userVerification: signingInstructions.userVerification,
        allowCredentials: [],
      },
    });

    const webauthnSignature = {
      authenticatorData: assertion.response.authenticatorData,
      clientDataJSON: assertion.response.clientDataJSON,
      signature: assertion.response.signature,
      counter: 0,
    };

    // Submit to bundler
    this.setState({ step: "submitting" });

    const submitResponse = await fetch(`${API_URL}/userop/invest/submit`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ requestId, webauthnSignature }),
      signal,
    });

    if (!submitResponse.ok) {
      const errorData = await submitResponse.json();
      throw new Error(errorData.error || errorData.message || "Failed to submit UserOperation");
    }

    const result = await submitResponse.json();

    // Check for error in result
    if (result.success === false || result.error) {
      throw new Error(result.error || result.message || "UserOperation failed");
    }

    // Backend returns { success: true, result: { userOpHash, txHash, status } }
    const userOpHash = result.result?.userOpHash;
    const txHash = result.result?.txHash;
    const status = result.result?.status;

    if (!userOpHash && !txHash) {
      throw new Error("No transaction or userOp hash received from server");
    }

    // Check if the operation already failed
    if (status === "failed") {
      const revertReason = result.result?.revertReason;
      throw new Error(revertReason || result.message || "Transaction failed on-chain. Check your USDC balance.");
    }

    this.setState({
      step: "confirming",
      userOpHash,
      txHash,
    });

    // If status is "success" and we have txHash, transaction is already confirmed
    if (status === "success" && txHash) {
      // Already confirmed, nothing to poll
      return;
    }

    // If pending, poll for confirmation using userOpHash
    if (userOpHash) {
      await this.waitForUserOpConfirmation(userOpHash);
    }
  }

  /**
   * Poll for transaction confirmation
   */
  private async waitForConfirmation(txHash: string, maxAttempts = 30): Promise<boolean> {
    const signal = this.abortController?.signal;

    for (let i = 0; i < maxAttempts; i++) {
      if (signal?.aborted) throw new Error("Operation cancelled");

      await new Promise((r) => setTimeout(r, 2000));

      if (signal?.aborted) throw new Error("Operation cancelled");

      try {
        const response = await fetch(`${API_URL}/transactions/${txHash}/status`, {
          credentials: "include",
          signal,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.confirmed && data.success) return true;
          if (data.confirmed && !data.success) {
            throw new Error(data.error || "Transaction failed on-chain");
          }
          if (data.failed) throw new Error(data.error || "Transaction failed");
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            throw new Error("Operation cancelled");
          }
          // Re-throw transaction failure errors
          if (error.message.includes("failed") || error.message.includes("Transaction")) {
            throw error;
          }
        }
      }
    }

    // On timeout, check blockchain directly for tx status
    throw new Error("Transaction confirmation timeout. Check your wallet for status.");
  }

  /**
   * Poll for UserOperation confirmation
   */
  private async waitForUserOpConfirmation(
    userOpHash: string,
    maxAttempts = 30
  ): Promise<boolean> {
    const signal = this.abortController?.signal;

    for (let i = 0; i < maxAttempts; i++) {
      if (signal?.aborted) throw new Error("Operation cancelled");

      await new Promise((r) => setTimeout(r, 2000));

      if (signal?.aborted) throw new Error("Operation cancelled");

      try {
        const response = await fetch(`${API_URL}/userop/${userOpHash}/status`, {
          headers: getAuthHeaders(),
          credentials: "include",
          signal,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === "success") {
            this.setState({ txHash: data.txHash });
            return true;
          }
          if (data.status === "failed") {
            throw new Error(data.error || "UserOperation failed on-chain");
          }
          if (data.status === "reverted") {
            throw new Error(data.revertReason || "Transaction reverted on-chain");
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            throw new Error("Operation cancelled");
          }
          // Re-throw UserOp failure errors
          if (error.message.includes("failed") || error.message.includes("reverted")) {
            throw error;
          }
        }
      }
    }

    throw new Error("UserOperation confirmation timeout. Check your wallet for status.");
  }

  private parseSignature(signature: string): { v: number; r: string; s: string } {
    const sig = signature.startsWith("0x") ? signature.slice(2) : signature;
    const r = "0x" + sig.slice(0, 64);
    const s = "0x" + sig.slice(64, 128);
    let v = parseInt(sig.slice(128, 130), 16);
    if (v < 27) v += 27;
    return { v, r, s };
  }

  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  reset(): void {
    this.abort();
    this.state = {
      step: "idle",
      method: null,
      poolId: null,
      amount: null,
      txHash: null,
      userOpHash: null,
      walletAddress: null,
      error: null,
    };
    this.notify();
  }
}

// Singleton instance
export const gaslessInvestmentFlow = new GaslessInvestmentFlow();
