/**
 * ERC-4337 UserOperation Hook
 * Enables gasless transactions for passkey users (Google/Email auth)
 *
 * Part 4 of gasless-transactions-implementation.md
 */

import { useState, useCallback } from "react";
import { startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface UserOperationData {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  accountGasLimits: string;
  preVerificationGas: string;
  gasFees: string;
  paymasterAndData: string;
  signature: string;
}

export interface SmartWalletInfo {
  address: string;
  deployed: boolean;
  depositBalance: string;
  entryPoint: string;
}

export interface UseUserOperationState {
  isLoading: boolean;
  error: string | null;
  wallet: SmartWalletInfo | null;
  txHash: string | null;
  userOpHash: string | null;
  status: "idle" | "building" | "signing" | "submitting" | "pending" | "success" | "failed";
}

export interface UseUserOperationReturn extends UseUserOperationState {
  /**
   * Get user's smart wallet info
   */
  getWalletInfo: () => Promise<SmartWalletInfo>;

  /**
   * Build UserOperation for investment
   */
  buildInvestUserOp: (
    poolId: string,
    amount: string
  ) => Promise<{
    userOp: UserOperationData;
    hash: string;
    walletAddress: string;
    signingInstructions: {
      challenge: string;
      rpId: string;
      userVerification: string;
    };
  }>;

  /**
   * Sign UserOperation with passkey
   */
  signUserOp: (
    hash: string,
    rpId: string
  ) => Promise<{
    authenticatorData: string;
    clientDataJSON: string;
    signature: string;
    counter: number;
  }>;

  /**
   * Submit signed UserOperation
   */
  submitUserOp: (
    userOp: UserOperationData,
    webauthnSignature: {
      authenticatorData: string;
      clientDataJSON: string;
      signature: string;
      counter: number;
    }
  ) => Promise<{
    userOpHash: string;
    txHash: string | null;
    status: string;
  }>;

  /**
   * Full flow: build, sign, and submit UserOperation
   */
  investWithUserOp: (
    poolId: string,
    amount: string
  ) => Promise<{
    userOpHash: string;
    txHash: string | null;
    status: string;
  }>;

  /**
   * Check UserOperation status
   */
  checkStatus: (userOpHash: string) => Promise<{
    status: string;
    txHash: string | null;
    blockNumber: number | null;
  }>;

  reset: () => void;
}

/**
 * Hook for ERC-4337 UserOperation-based gasless transactions
 * Used by passkey users (Google/Email auth)
 */
export function useUserOperation(): UseUserOperationReturn {
  const [state, setState] = useState<UseUserOperationState>({
    isLoading: false,
    error: null,
    wallet: null,
    txHash: null,
    userOpHash: null,
    status: "idle",
  });

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      wallet: null,
      txHash: null,
      userOpHash: null,
      status: "idle",
    });
  }, []);

  /**
   * Get smart wallet info
   */
  const getWalletInfo = useCallback(async (): Promise<SmartWalletInfo> => {
    setState((s) => ({ ...s, isLoading: true, error: null }));

    try {
      const response = await fetch(`${API_URL}/userop/wallet`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || "Failed to get wallet info");
      }

      const data = await response.json();
      const wallet = data.wallet as SmartWalletInfo;

      setState((s) => ({ ...s, wallet, isLoading: false }));
      return wallet;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to get wallet";
      setState((s) => ({ ...s, error: message, isLoading: false }));
      throw error;
    }
  }, []);

  /**
   * Build UserOperation for investment
   */
  const buildInvestUserOp = useCallback(
    async (poolId: string, amount: string) => {
      setState((s) => ({ ...s, isLoading: true, error: null, status: "building" }));

      try {
        const response = await fetch(`${API_URL}/userop/invest/build`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ poolId, amount }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || error.error || "Failed to build UserOperation");
        }

        const data = await response.json();
        setState((s) => ({ ...s, isLoading: false }));

        return {
          userOp: data.userOp as UserOperationData,
          hash: data.hash as string,
          walletAddress: data.walletAddress as string,
          signingInstructions: data.signingInstructions as {
            challenge: string;
            rpId: string;
            userVerification: string;
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to build UserOp";
        setState((s) => ({ ...s, error: message, isLoading: false, status: "failed" }));
        throw error;
      }
    },
    []
  );

  /**
   * Sign UserOperation hash with passkey
   */
  const signUserOp = useCallback(
    async (hash: string, rpId: string) => {
      setState((s) => ({ ...s, isLoading: true, error: null, status: "signing" }));

      try {
        // Convert hash to base64url challenge
        const hashBytes = hexToBytes(hash);
        const challenge = bytesToBase64url(hashBytes);

        // Build WebAuthn options
        const options: PublicKeyCredentialRequestOptionsJSON = {
          challenge,
          rpId,
          timeout: 60000,
          userVerification: "required",
          // Allow any registered credential
          allowCredentials: [],
        };

        // Trigger passkey authentication
        const assertion = await startAuthentication({ optionsJSON: options });

        const result = {
          authenticatorData: assertion.response.authenticatorData,
          clientDataJSON: assertion.response.clientDataJSON,
          signature: assertion.response.signature,
          counter: 0, // Will be extracted from authenticatorData by backend
        };

        setState((s) => ({ ...s, isLoading: false }));
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to sign with passkey";
        setState((s) => ({ ...s, error: message, isLoading: false, status: "failed" }));
        throw error;
      }
    },
    []
  );

  /**
   * Submit signed UserOperation
   */
  const submitUserOp = useCallback(
    async (
      userOp: UserOperationData,
      webauthnSignature: {
        authenticatorData: string;
        clientDataJSON: string;
        signature: string;
        counter: number;
      }
    ) => {
      setState((s) => ({ ...s, isLoading: true, error: null, status: "submitting" }));

      try {
        const response = await fetch(`${API_URL}/userop/invest/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ userOp, webauthnSignature }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || error.error || "Failed to submit UserOperation");
        }

        const data = await response.json();
        const result = data.result;

        setState((s) => ({
          ...s,
          isLoading: false,
          userOpHash: result.userOpHash,
          txHash: result.txHash,
          status: result.status === "success" ? "success" : "pending",
        }));

        return {
          userOpHash: result.userOpHash,
          txHash: result.txHash,
          status: result.status,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to submit";
        setState((s) => ({ ...s, error: message, isLoading: false, status: "failed" }));
        throw error;
      }
    },
    []
  );

  /**
   * Full UserOperation investment flow
   */
  const investWithUserOp = useCallback(
    async (poolId: string, amount: string) => {
      // Step 1: Build UserOperation
      const { userOp, hash, signingInstructions } = await buildInvestUserOp(poolId, amount);

      // Step 2: Sign with passkey
      const webauthnSignature = await signUserOp(hash, signingInstructions.rpId);

      // Step 3: Submit to backend
      return submitUserOp(userOp, webauthnSignature);
    },
    [buildInvestUserOp, signUserOp, submitUserOp]
  );

  /**
   * Check UserOperation status
   */
  const checkStatus = useCallback(
    async (userOpHash: string) => {
      try {
        const response = await fetch(`${API_URL}/userop/${userOpHash}/status`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to check status");
        }

        const data = await response.json();

        if (data.status === "success") {
          setState((s) => ({
            ...s,
            txHash: data.txHash,
            status: "success",
          }));
        }

        return {
          status: data.status,
          txHash: data.txHash || null,
          blockNumber: data.blockNumber || null,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to check status";
        throw new Error(message);
      }
    },
    []
  );

  return {
    ...state,
    getWalletInfo,
    buildInvestUserOp,
    signUserOp,
    submitUserOp,
    investWithUserOp,
    checkStatus,
    reset,
  };
}

/**
 * Convert hex string to Uint8Array
 */
function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleanHex.substr(i * 2, 2), 16);
  }
  return bytes;
}

/**
 * Convert Uint8Array to base64url string
 */
function bytesToBase64url(bytes: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export default useUserOperation;
