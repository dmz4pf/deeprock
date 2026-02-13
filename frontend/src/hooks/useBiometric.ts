"use client";

import { useState, useCallback } from "react";
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from "@simplewebauthn/browser";
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from "@simplewebauthn/browser";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// ==================== Types ====================

export interface User {
  id: string;
  email: string;
  walletAddress: string;
  displayName?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface BiometricCapabilities {
  webAuthnSupported: boolean;
  platformAuthenticatorAvailable: boolean;
}

export interface RegistrationResult {
  success: boolean;
  user?: User;
  publicKey?: { x: string; y: string };
  error?: string;
}

export interface AuthenticationResult {
  success: boolean;
  user?: User;
  csrfToken?: string; // SEC-002: CSRF token for API requests (JWT is in httpOnly cookie)
  expiresAt?: string;
  error?: string;
}

// ==================== Hook ====================

export function useBiometric() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
  });

  /**
   * Check device biometric capabilities
   */
  const checkCapabilities = useCallback(async (): Promise<BiometricCapabilities> => {
    const webAuthnSupported = browserSupportsWebAuthn();
    const platformAuthenticatorAvailable = webAuthnSupported
      ? await platformAuthenticatorIsAvailable()
      : false;

    return {
      webAuthnSupported,
      platformAuthenticatorAvailable,
    };
  }, []);

  /**
   * Register a new user with biometrics
   */
  const register = useCallback(
    async (email: string, displayName?: string): Promise<RegistrationResult> => {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Get registration options from server
        const optionsRes = await fetch(`${API_BASE}/auth/register-options`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, displayName }),
        });

        if (!optionsRes.ok) {
          const errorData = await optionsRes.json();
          throw new Error(errorData.error || "Failed to get registration options");
        }

        const { options, challengeId } = await optionsRes.json();

        // Step 2: Prompt user for biometric registration
        const credential = await startRegistration({
          optionsJSON: options as PublicKeyCredentialCreationOptionsJSON,
        });

        // Step 3: Verify registration with server
        const verifyRes = await fetch(`${API_BASE}/auth/register-verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId,
            response: credential,
          }),
        });

        if (!verifyRes.ok) {
          const errorData = await verifyRes.json();
          throw new Error(errorData.error || "Registration verification failed");
        }

        const result = await verifyRes.json();

        return {
          success: true,
          user: result.user,
          publicKey: result.publicKey,
        };
      } catch (err: any) {
        const errorMessage =
          err.name === "NotAllowedError"
            ? "Biometric registration was cancelled or not allowed"
            : err.name === "InvalidStateError"
            ? "This device is already registered"
            : err.message || "Registration failed";

        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Authenticate existing user with biometrics
   * @param email Optional email - if omitted, uses discoverable credentials (passkey)
   */
  const authenticate = useCallback(
    async (email?: string): Promise<AuthenticationResult> => {
      setIsLoading(true);
      setError(null);

      try {
        // Step 1: Get authentication options from server
        // If no email provided, request discoverable credentials (passkey resident keys)
        const optionsRes = await fetch(`${API_BASE}/auth/login-options`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(email ? { email } : {}),
        });

        if (!optionsRes.ok) {
          const errorData = await optionsRes.json();
          throw new Error(errorData.error || "Failed to get authentication options");
        }

        const { options, challengeId } = await optionsRes.json();

        // Step 2: Prompt user for biometric authentication
        const credential = await startAuthentication({
          optionsJSON: options as PublicKeyCredentialRequestOptionsJSON,
        });

        // Step 3: Verify authentication with server
        // SEC-002: Use credentials: "include" to receive httpOnly cookie
        const verifyRes = await fetch(`${API_BASE}/auth/login-verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            challengeId,
            response: credential,
          }),
        });

        if (!verifyRes.ok) {
          const errorData = await verifyRes.json();
          throw new Error(errorData.error || "Authentication failed");
        }

        const result = await verifyRes.json();

        // SEC-002: Update auth state (JWT is now in httpOnly cookie)
        setAuthState({
          user: result.user,
          token: null, // No longer stored client-side
          isAuthenticated: true,
        });

        return {
          success: true,
          user: result.user,
          csrfToken: result.csrfToken, // SEC-002: Return CSRF token for API requests
          expiresAt: result.expiresAt,
        };
      } catch (err: any) {
        const errorMessage =
          err.name === "NotAllowedError"
            ? "Biometric authentication was cancelled or not allowed"
            : err.message || "Authentication failed";

        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Logout current user
   * SEC-002: Now uses httpOnly cookies (credentials: "include")
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      // SEC-002: Use credentials to send httpOnly cookie
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
    } catch {
      // Ignore logout errors
    } finally {
      // Clear state regardless of API response
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
      });
    }
  }, []);

  /**
   * Restore session from httpOnly cookie
   * SEC-002: Session is validated via cookie, not localStorage
   */
  const restoreSession = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined") return false;

    try {
      // SEC-002: Validate session via httpOnly cookie
      const res = await fetch(`${API_BASE}/auth/session`, {
        credentials: "include",
      });

      if (!res.ok) {
        return false;
      }

      const data = await res.json();
      if (data.success && data.session?.user) {
        setAuthState({
          user: data.session.user,
          token: null,
          isAuthenticated: true,
        });
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, []);

  /**
   * Add a passkey to an existing authenticated account
   */
  const addPasskey = useCallback(async (): Promise<RegistrationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Get registration options for authenticated user
      const optionsRes = await fetch(`${API_BASE}/auth/passkeys/add-options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Send auth cookie
      });

      if (!optionsRes.ok) {
        const errorData = await optionsRes.json();
        throw new Error(errorData.error || "Failed to get registration options");
      }

      const { options, challengeId } = await optionsRes.json();

      // Step 2: Prompt user for biometric registration
      const credential = await startRegistration({
        optionsJSON: options as PublicKeyCredentialCreationOptionsJSON,
      });

      // Step 3: Verify registration with server
      const verifyRes = await fetch(`${API_BASE}/auth/register-verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          challengeId,
          response: credential,
        }),
      });

      if (!verifyRes.ok) {
        const errorData = await verifyRes.json();
        throw new Error(errorData.error || "Registration verification failed");
      }

      const result = await verifyRes.json();

      return {
        success: true,
        user: result.user,
        publicKey: result.publicKey,
      };
    } catch (err: any) {
      const errorMessage =
        err.name === "NotAllowedError"
          ? "Biometric registration was cancelled or not allowed"
          : err.name === "InvalidStateError"
          ? "This device is already registered"
          : err.message || "Registration failed";

      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check if email is already registered
   */
  const checkEmail = useCallback(async (email: string): Promise<boolean> => {
    try {
      const res = await fetch(
        `${API_BASE}/auth/check-email?email=${encodeURIComponent(email)}`
      );
      if (!res.ok) return false;
      const { registered } = await res.json();
      return registered;
    } catch {
      return false;
    }
  }, []);

  /**
   * @deprecated SEC-002: No longer needed - use credentials: "include" instead
   * Auth is handled via httpOnly cookies automatically
   */
  const getAuthHeader = useCallback((): Record<string, string> => {
    // SEC-002: Return empty - auth is now via httpOnly cookie
    return {};
  }, []);

  return {
    // State
    isLoading,
    error,
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,

    // Actions
    checkCapabilities,
    register,
    addPasskey,
    authenticate,
    logout,
    restoreSession,
    checkEmail,
    getAuthHeader,

    // Aliases
    isRegistering: isLoading,

    // Utilities
    clearError: () => setError(null),
  };
}

export default useBiometric;
