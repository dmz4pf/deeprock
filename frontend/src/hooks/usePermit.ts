/**
 * EIP-2612 Permit Hook
 * Enables gasless token approvals for wallet users (MetaMask, WalletConnect)
 *
 * Part 1.5 of gasless-transactions-implementation.md
 */

import { useState, useCallback } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface PermitData {
  owner: string;
  spender: string;
  value: string;
  nonce: string;
  deadline: number;
}

export interface PermitTypedData {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  types: {
    // EIP712Domain is required for MetaMask's eth_signTypedData_v4
    EIP712Domain: Array<{ name: string; type: string }>;
    Permit: Array<{ name: string; type: string }>;
  };
  primaryType: "Permit";
  message: {
    owner: string;
    spender: string;
    value: string;
    nonce: string;
    deadline: number | string; // Can be number or string depending on backend
  };
}

export interface PermitSignature {
  v: number;
  r: string;
  s: string;
}

export interface UsePermitState {
  isLoading: boolean;
  error: string | null;
  signature: PermitSignature | null;
}

export interface UsePermitReturn extends UsePermitState {
  /**
   * Generate permit data for signing
   */
  generatePermitData: (
    poolId: string,
    amount: string
  ) => Promise<{ permitData: PermitData; typedData: PermitTypedData }>;

  /**
   * Sign permit with connected wallet (MetaMask, etc.)
   * Returns the signature components (v, r, s)
   */
  signPermit: (typedData: PermitTypedData) => Promise<PermitSignature>;

  /**
   * Submit investment with permit signature
   */
  submitWithPermit: (
    poolId: string,
    amount: string,
    deadline: number,
    signature: PermitSignature
  ) => Promise<{ txHash: string; status: string }>;

  /**
   * Full flow: generate, sign, and submit permit
   */
  investWithPermit: (
    poolId: string,
    amount: string
  ) => Promise<{ txHash: string; status: string }>;

  reset: () => void;
}

/**
 * Hook for EIP-2612 permit-based gasless transactions
 * Used by wallet users (SIWE auth)
 */
export function usePermit(): UsePermitReturn {
  const [state, setState] = useState<UsePermitState>({
    isLoading: false,
    error: null,
    signature: null,
  });

  const reset = useCallback(() => {
    setState({ isLoading: false, error: null, signature: null });
  }, []);

  /**
   * Get permit data from backend
   */
  const generatePermitData = useCallback(
    async (
      poolId: string,
      amount: string
    ): Promise<{ permitData: PermitData; typedData: PermitTypedData }> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        const response = await fetch(`${API_URL}/pools/${poolId}/permit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ amount }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to generate permit data");
        }

        const data = await response.json();
        return {
          permitData: data.permitData,
          typedData: data.typedData,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to generate permit";
        setState((s) => ({ ...s, error: message, isLoading: false }));
        throw error;
      }
    },
    []
  );

  /**
   * Sign permit using connected wallet
   */
  const signPermit = useCallback(
    async (typedData: PermitTypedData): Promise<PermitSignature> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        // Check if ethereum provider is available
        if (typeof window === "undefined" || !window.ethereum) {
          throw new Error("No wallet connected. Please connect your wallet.");
        }

        // Get connected accounts
        const accounts = (await window.ethereum.request({
          method: "eth_accounts",
        })) as string[];

        if (!accounts || accounts.length === 0) {
          throw new Error("No wallet connected. Please connect your wallet.");
        }

        const account = accounts[0];

        // Verify the current MetaMask account matches the permit owner
        // This prevents signature verification failures when user has switched accounts
        const expectedOwner = typedData.message.owner.toLowerCase();
        const currentAccount = account.toLowerCase();

        if (currentAccount !== expectedOwner) {
          throw new Error(
            `Please switch to the correct wallet account. Expected: ${typedData.message.owner.slice(0, 6)}...${typedData.message.owner.slice(-4)}, Current: ${account.slice(0, 6)}...${account.slice(-4)}`
          );
        }

        // Sign typed data (EIP-712)
        const signature = (await window.ethereum.request({
          method: "eth_signTypedData_v4",
          params: [account, JSON.stringify(typedData)],
        })) as string;

        // Parse signature into v, r, s components
        const sig = parseSignature(signature);

        setState((s) => ({ ...s, signature: sig, isLoading: false }));
        return sig;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to sign permit";
        setState((s) => ({ ...s, error: message, isLoading: false }));
        throw error;
      }
    },
    []
  );

  /**
   * Submit signed permit to backend
   */
  const submitWithPermit = useCallback(
    async (
      poolId: string,
      amount: string,
      deadline: number,
      signature: PermitSignature
    ): Promise<{ txHash: string; status: string }> => {
      setState((s) => ({ ...s, isLoading: true, error: null }));

      try {
        const response = await fetch(`${API_URL}/pools/${poolId}/invest-with-permit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            amount,
            deadline,
            v: signature.v,
            r: signature.r,
            s: signature.s,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to submit investment");
        }

        const data = await response.json();
        setState((s) => ({ ...s, isLoading: false }));

        return {
          txHash: data.result?.txHash || data.txHash,
          status: data.result?.status || data.status || "pending",
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to submit";
        setState((s) => ({ ...s, error: message, isLoading: false }));
        throw error;
      }
    },
    []
  );

  /**
   * Full permit investment flow
   */
  const investWithPermit = useCallback(
    async (
      poolId: string,
      amount: string
    ): Promise<{ txHash: string; status: string }> => {
      // Step 1: Generate permit data
      const { permitData, typedData } = await generatePermitData(poolId, amount);

      // Step 2: Sign with wallet
      const signature = await signPermit(typedData);

      // Step 3: Submit to backend
      return submitWithPermit(poolId, amount, permitData.deadline, signature);
    },
    [generatePermitData, signPermit, submitWithPermit]
  );

  return {
    ...state,
    generatePermitData,
    signPermit,
    submitWithPermit,
    investWithPermit,
    reset,
  };
}

/**
 * Parse signature hex string into v, r, s components
 */
function parseSignature(signature: string): PermitSignature {
  // Remove 0x prefix if present
  const sig = signature.startsWith("0x") ? signature.slice(2) : signature;

  // Signature is 65 bytes: r (32) + s (32) + v (1)
  const r = "0x" + sig.slice(0, 64);
  const s = "0x" + sig.slice(64, 128);
  let v = parseInt(sig.slice(128, 130), 16);

  // Handle EIP-155 v values
  if (v < 27) {
    v += 27;
  }

  return { v, r, s };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

export default usePermit;
