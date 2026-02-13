"use client";

import { useState, useCallback } from "react";
import { documentApi, authApi, type DocumentSealResult, type DocumentVerifyResult } from "@/lib/api";
import { startAuthentication } from "@simplewebauthn/browser";
import { useAuthStore } from "@/stores/authStore";

export function useDocumentSeal() {
  const [isSealing, setIsSealing] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computeHash = useCallback(async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return "0x" + hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }, []);

  const sealDocument = useCallback(
    async (file: File, metadata?: string): Promise<DocumentSealResult> => {
      setIsSealing(true);
      setError(null);

      try {
        // Compute document hash
        const documentHash = await computeHash(file);

        // Check if already sealed
        try {
          const existing = await documentApi.verify(documentHash);
          if (existing.isSealed) {
            throw new Error("Document is already sealed on the blockchain");
          }
        } catch (err) {
          // If it's not the "already sealed" error, ignore (document doesn't exist yet)
          if (err instanceof Error && err.message.includes("already sealed")) {
            throw err;
          }
        }

        // Get authentication
        const { user } = useAuthStore.getState();
        if (!user?.email) {
          throw new Error("Not authenticated. Please log in first.");
        }

        // Get authentication options
        const { options } = await authApi.loginOptions(user.email);

        // Authenticate with biometrics
        const assertion = await startAuthentication({ optionsJSON: options });

        // Submit seal request
        const deadline = Math.floor(Date.now() / 1000) + 300; // 5 minute deadline

        const result = await documentApi.seal({
          documentHash,
          metadata: metadata || undefined,
          signature: {
            deadline,
            authenticatorData: assertion.response.authenticatorData,
            clientDataJSON: assertion.response.clientDataJSON,
            signature: assertion.response.signature,
          },
        });

        return result;
      } catch (err) {
        let message = "Failed to seal document";

        if (err instanceof Error) {
          if (err.name === "NotAllowedError") {
            message = "Biometric authentication was cancelled or denied";
          } else if (err.name === "NotSupportedError") {
            message = "Biometric authentication is not supported on this device";
          } else {
            message = err.message;
          }
        }

        setError(message);
        throw new Error(message);
      } finally {
        setIsSealing(false);
      }
    },
    [computeHash]
  );

  const verifyDocument = useCallback(
    async (fileOrHash: File | string): Promise<DocumentVerifyResult> => {
      setIsVerifying(true);
      setError(null);

      try {
        const documentHash =
          typeof fileOrHash === "string" ? fileOrHash : await computeHash(fileOrHash);

        const result = await documentApi.verify(documentHash);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to verify document";
        setError(message);

        // Return not sealed for errors (document probably doesn't exist)
        return {
          isSealed: false,
          sealer: null,
          sealedAt: null,
          metadata: null,
        };
      } finally {
        setIsVerifying(false);
      }
    },
    [computeHash]
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sealDocument,
    verifyDocument,
    computeHash,
    isSealing,
    isVerifying,
    error,
    clearError,
  };
}
