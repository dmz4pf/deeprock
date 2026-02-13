import { authApi } from "@/lib/api";
import { startRegistration } from "@simplewebauthn/browser";
import { useAuthStore } from "@/stores/authStore";

export type RegistrationStep =
  | "idle"
  | "email"
  | "webauthn"
  | "verifying"
  | "complete"
  | "error";

export interface RegistrationFlowState {
  step: RegistrationStep;
  email: string | null;
  credentialId: string | null;
  error: string | null;
}

type Listener = (state: RegistrationFlowState) => void;

export class RegistrationFlowOrchestrator {
  private state: RegistrationFlowState = {
    step: "idle",
    email: null,
    credentialId: null,
    error: null,
  };

  private listeners: Set<Listener> = new Set();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): RegistrationFlowState {
    return { ...this.state };
  }

  private notify(): void {
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  private setState(partial: Partial<RegistrationFlowState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  async startRegistration(email: string, displayName?: string): Promise<void> {
    try {
      this.setState({ step: "email", email, error: null, credentialId: null });

      // Get registration options from server
      const { options, challengeId } = await authApi.registerOptions(email, displayName);

      // Start WebAuthn registration
      this.setState({ step: "webauthn" });

      const credential = await startRegistration({ optionsJSON: options });

      // Verify registration on server
      this.setState({ step: "verifying" });

      const { user, publicKey } = await authApi.registerVerify(challengeId, credential);

      // Registration complete - user needs to log in
      // Store the credential ID for future reference
      this.setState({
        step: "complete",
        credentialId: credential.id,
      });

      // Note: Registration doesn't log the user in automatically
      // They need to use the login flow to get a session token
      console.log("Registration complete. Public key:", publicKey);

    } catch (error) {
      let message = "Registration failed";

      if (error instanceof Error) {
        // Handle specific WebAuthn errors
        if (error.name === "NotAllowedError") {
          message = "Biometric authentication was cancelled or denied";
        } else if (error.name === "NotSupportedError") {
          message = "Biometric authentication is not supported on this device";
        } else if (error.name === "SecurityError") {
          message = "Security error during registration. Please use HTTPS.";
        } else if (error.name === "InvalidStateError") {
          message = "A passkey already exists for this account";
        } else {
          message = error.message;
        }
      }

      this.setState({ step: "error", error: message });
      throw error;
    }
  }

  reset(): void {
    this.state = {
      step: "idle",
      email: null,
      credentialId: null,
      error: null,
    };
    this.notify();
  }
}

// Singleton instance
export const registrationFlow = new RegistrationFlowOrchestrator();
