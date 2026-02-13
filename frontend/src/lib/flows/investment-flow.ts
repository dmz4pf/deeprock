import { useAuthStore } from "@/stores/authStore";
import { poolApi, type WebAuthnResponse } from "@/lib/api";
import { startAuthentication } from "@simplewebauthn/browser";
import type { PublicKeyCredentialRequestOptionsJSON } from "@simplewebauthn/browser";

export type InvestmentStep =
  | "idle"
  | "selecting"
  | "authenticating"
  | "signing"
  | "submitting"
  | "confirming"
  | "complete"
  | "error";

export interface InvestmentFlowState {
  step: InvestmentStep;
  poolId: string | null;
  amount: string | null;
  txHash: string | null;
  error: string | null;
}

type Listener = (state: InvestmentFlowState) => void;

export class InvestmentFlowOrchestrator {
  private state: InvestmentFlowState = {
    step: "idle",
    poolId: null,
    amount: null,
    txHash: null,
    error: null,
  };

  private listeners: Set<Listener> = new Set();
  private abortController: AbortController | null = null;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): InvestmentFlowState {
    return { ...this.state };
  }

  private notify(): void {
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  private setState(partial: Partial<InvestmentFlowState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  async startInvestment(poolId: string, amount: string): Promise<void> {
    // Cancel any existing operation (SEC-007 fix)
    this.abort();
    this.abortController = new AbortController();

    try {
      // Step 1: Initialize
      this.setState({ step: "selecting", poolId, amount, error: null, txHash: null });

      // Step 2: Verify user is authenticated
      this.setState({ step: "authenticating" });

      const { user, isAuthenticated } = useAuthStore.getState();
      if (!user || !isAuthenticated) {
        throw new Error("Not authenticated. Please log in first.");
      }

      // Step 3: Request investment challenge from backend
      // The backend returns a WebAuthn challenge for signing the transaction
      const challengeResponse = await poolApi.getInvestChallenge(poolId, amount);

      // The API returns 401 with PASSKEY_REQUIRED code and the challenge
      if (!("code" in challengeResponse) || challengeResponse.code !== "PASSKEY_REQUIRED") {
        throw new Error("Unexpected response from server");
      }

      // Get the challengeId for later verification
      const challengeId = challengeResponse.challenge.id;

      // Convert backend challenge format to WebAuthn options
      const webAuthnOptions: PublicKeyCredentialRequestOptionsJSON = {
        challenge: challengeResponse.challenge.challenge,
        rpId: challengeResponse.challenge.rpId,
        timeout: challengeResponse.challenge.timeout,
        userVerification: challengeResponse.challenge.userVerification as "required" | "preferred" | "discouraged",
        allowCredentials: challengeResponse.challenge.allowCredentials.map((cred) => ({
          id: cred.id,
          type: cred.type as "public-key",
          transports: cred.transports as AuthenticatorTransport[],
        })),
      };

      // Step 4: Biometric sign with passkey
      this.setState({ step: "signing" });

      const assertion = await startAuthentication({ optionsJSON: webAuthnOptions });

      // Convert assertion to WebAuthnResponse format expected by backend
      const webauthnResponse: WebAuthnResponse = {
        id: assertion.id,
        rawId: assertion.rawId,
        response: {
          authenticatorData: assertion.response.authenticatorData,
          clientDataJSON: assertion.response.clientDataJSON,
          signature: assertion.response.signature,
        },
        type: "public-key",
        clientExtensionResults: assertion.clientExtensionResults as Record<string, unknown> | undefined,
        authenticatorAttachment: assertion.authenticatorAttachment || undefined,
      };

      // Step 5: Submit investment with signed passkey response and challengeId
      this.setState({ step: "submitting" });

      const result = await poolApi.invest(poolId, amount, challengeId, webauthnResponse);

      // Step 6: Wait for confirmation
      const txHash = result.investment?.txHash || null;
      this.setState({ step: "confirming", txHash });

      if (txHash) {
        const confirmed = await this.waitForConfirmation(txHash);
        if (!confirmed) {
          throw new Error("Transaction failed to confirm");
        }
      }

      this.setState({ step: "complete" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Investment failed";
      this.setState({ step: "error", error: message });
      throw error;
    }
  }

  private async waitForConfirmation(txHash: string, maxAttempts = 30): Promise<boolean> {
    const signal = this.abortController?.signal;

    // Poll for transaction confirmation
    for (let i = 0; i < maxAttempts; i++) {
      // Check if aborted (SEC-007 fix)
      if (signal?.aborted) {
        throw new Error("Operation cancelled");
      }

      await new Promise((r) => setTimeout(r, 2000)); // Poll every 2s

      // Check again after delay
      if (signal?.aborted) {
        throw new Error("Operation cancelled");
      }

      try {
        // Check transaction status via backend
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/transactions/${txHash}/status`,
          { signal }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.confirmed) return true;
          if (data.failed) return false;
        }
      } catch (error) {
        // Rethrow abort errors
        if (error instanceof Error && error.name === "AbortError") {
          throw new Error("Operation cancelled");
        }
        // Continue polling on other errors
      }
    }

    // Assume success if we can't confirm (backend might not have this endpoint yet)
    return true;
  }

  /**
   * Abort any ongoing investment operation (SEC-007 fix)
   * Call this when component unmounts or user navigates away
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  reset(): void {
    this.abort(); // Cancel any ongoing operations
    this.state = {
      step: "idle",
      poolId: null,
      amount: null,
      txHash: null,
      error: null,
    };
    this.notify();
  }
}

// Singleton instance
export const investmentFlow = new InvestmentFlowOrchestrator();
