import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AuthProvider = "EMAIL" | "GOOGLE" | "WALLET";

export interface User {
  id: string;
  email: string | null;
  walletAddress: string | null;
  displayName: string | null;
  authProvider: AuthProvider;
  avatarUrl?: string | null;
}

export type AuthStep =
  | "select-method"
  | "email-input"
  | "email-verify"
  | "google-pending"
  | "wallet-connect"
  | "wallet-sign"
  | "biometric-prompt"
  | "authenticated";

interface AuthState {
  // Auth state
  isAuthenticated: boolean;
  user: User | null;
  csrfToken: string | null;
  isValidating: boolean;
  hasBiometrics: boolean;

  // Multi-step auth flow
  authStep: AuthStep;
  pendingEmail: string | null;
  isNewUser: boolean;

  // Actions
  login: (user: User, csrfToken: string, isNewUser?: boolean, hasBiometrics?: boolean) => void;
  logout: () => void;
  setUser: (user: User) => void;
  setAuthStep: (step: AuthStep) => void;
  setPendingEmail: (email: string | null) => void;
  setIsNewUser: (isNew: boolean) => void;
  setHasBiometrics: (hasBiometrics: boolean) => void;
  validateSession: () => Promise<boolean>;
  reset: () => void;
}

const initialState = {
  isAuthenticated: false,
  user: null,
  csrfToken: null,
  isValidating: false,
  hasBiometrics: false,
  authStep: "select-method" as AuthStep,
  pendingEmail: null,
  isNewUser: false,
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: (user, csrfToken, isNewUser = false, hasBiometrics = false) => {
        // Show biometric prompt if user is new OR doesn't have biometrics set up
        // EXCEPT for wallet users - they use MetaMask for signing, passkeys aren't needed
        const isWalletUser = user.authProvider === "WALLET";
        const needsBiometricPrompt = !isWalletUser && (isNewUser || !hasBiometrics);
        set({
          isAuthenticated: true,
          user,
          csrfToken,
          isNewUser,
          hasBiometrics,
          authStep: needsBiometricPrompt ? "biometric-prompt" : "authenticated",
        });
      },

      logout: () => set(initialState),

      setUser: (user) => set({ user }),

      setAuthStep: (authStep) => set({ authStep }),

      setPendingEmail: (pendingEmail) => set({ pendingEmail }),

      setIsNewUser: (isNewUser) => set({ isNewUser }),

      setHasBiometrics: (hasBiometrics) => set({ hasBiometrics }),

      reset: () => set(initialState),

      validateSession: async () => {
        const { logout, authStep: currentStep } = get();

        set({ isValidating: true });
        try {
          const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
          const res = await fetch(`${API_URL}/auth/session`, {
            credentials: "include",
          });

          if (!res.ok) {
            logout();
            return false;
          }

          const data = await res.json();
          if (data.success && data.session) {
            const hasBiometrics = data.session.hasBiometrics ?? false;

            // Preserve biometric-prompt only if user still needs to set up biometrics.
            // Once hasBiometrics is true (passkey registered), transition to authenticated.
            const shouldPromptBiometric =
              currentStep === "biometric-prompt" && !hasBiometrics;
            const newStep = shouldPromptBiometric ? "biometric-prompt" : "authenticated";

            set({
              user: data.session.user,
              isAuthenticated: true,
              hasBiometrics,
              authStep: newStep,
              csrfToken: data.csrfToken || null, // Store CSRF token from session
            });
            return true;
          }

          logout();
          return false;
        } catch {
          return false;
        } finally {
          set({ isValidating: false });
        }
      },
    }),
    {
      name: "rwa-auth",
      partialize: (state) => ({
        user: state.user,
        csrfToken: state.csrfToken,
        hasBiometrics: state.hasBiometrics,
      }),
    }
  )
);
