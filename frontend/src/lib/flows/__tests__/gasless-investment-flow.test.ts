import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  GaslessInvestmentFlow,
  gaslessInvestmentFlow,
  type GaslessFlowState,
} from "../gasless-investment-flow";

// Mock the auth store
vi.mock("@/stores/authStore", () => ({
  useAuthStore: {
    getState: vi.fn(),
  },
}));

// Mock simplewebauthn
vi.mock("@simplewebauthn/browser", () => ({
  startAuthentication: vi.fn(),
}));

import { useAuthStore } from "@/stores/authStore";
import { startAuthentication } from "@simplewebauthn/browser";

const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
const mockGetState = useAuthStore.getState as ReturnType<typeof vi.fn>;
const mockStartAuthentication = startAuthentication as ReturnType<typeof vi.fn>;
const mockEthereum = window.ethereum as {
  request: ReturnType<typeof vi.fn>;
};

describe("GaslessInvestmentFlow", () => {
  let flow: GaslessInvestmentFlow;

  const mockPoolId = "pool-123";
  const mockAmount = "1000000000";
  const mockWalletAddress = "0x1234567890123456789012345678901234567890";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    flow = new GaslessInvestmentFlow();
  });

  afterEach(() => {
    flow.reset();
    vi.useRealTimers();
  });

  describe("method routing", () => {
    it("should route wallet users to permit method", async () => {
      mockGetState.mockReturnValue({
        user: { authProvider: "WALLET", walletAddress: mockWalletAddress },
        isAuthenticated: true,
      });

      // Mock permit flow endpoints - permit data, submit, confirmation check
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              typedData: { domain: {}, types: {}, primaryType: "Permit", message: {} },
              permitData: { deadline: Date.now() + 3600000 },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ result: { txHash: "0xtx" }, txHash: "0xtx" }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ confirmed: true }),
        });

      // Mock wallet signing
      const mockSig =
        "0x" +
        "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" +
        "fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321" +
        "1b";

      mockEthereum.request.mockResolvedValueOnce(mockSig);

      const stateChanges: GaslessFlowState[] = [];
      flow.subscribe((state) => stateChanges.push(state));

      const investPromise = flow.invest(mockPoolId, mockAmount);

      // Advance timers to complete the confirmation polling
      await vi.runAllTimersAsync();
      await investPromise;

      // Verify method was set to permit
      const methodState = stateChanges.find((s) => s.method === "permit");
      expect(methodState).toBeDefined();
      expect(flow.getState().step).toBe("complete");
    });

    it("should route Google users to userop method", async () => {
      mockGetState.mockReturnValue({
        user: { authProvider: "GOOGLE" },
        isAuthenticated: true,
      });

      // Mock UserOp flow endpoints - build, submit, confirmation
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              userOp: {},
              hash: "0xhash",
              walletAddress: mockWalletAddress,
              signingInstructions: {
                challenge: "Y2hhbGxlbmdl",
                rpId: "localhost",
                userVerification: "required",
              },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              result: { userOpHash: "0xop", txHash: "0xtx", status: "success" },
            }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ confirmed: true, status: "success" }),
        });

      // Mock passkey
      mockStartAuthentication.mockResolvedValueOnce({
        response: {
          authenticatorData: "auth",
          clientDataJSON: "client",
          signature: "sig",
        },
      });

      const stateChanges: GaslessFlowState[] = [];
      flow.subscribe((state) => stateChanges.push(state));

      const investPromise = flow.invest(mockPoolId, mockAmount);
      await vi.runAllTimersAsync();
      await investPromise;

      // Verify method was set to userop
      const methodState = stateChanges.find((s) => s.method === "userop");
      expect(methodState).toBeDefined();
    });

    it("should route Email users to userop method", async () => {
      mockGetState.mockReturnValue({
        user: { authProvider: "EMAIL" },
        isAuthenticated: true,
      });

      // Mock UserOp flow - build, submit with txHash (skips confirmation)
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              userOp: {},
              hash: "0xhash",
              walletAddress: mockWalletAddress,
              signingInstructions: {
                challenge: "Y2hhbGxlbmdl",
                rpId: "localhost",
                userVerification: "required",
              },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              result: { userOpHash: "0xop", txHash: "0xtx", status: "success" },
            }),
        })
        .mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ confirmed: true }),
        });

      mockStartAuthentication.mockResolvedValueOnce({
        response: {
          authenticatorData: "auth",
          clientDataJSON: "client",
          signature: "sig",
        },
      });

      const stateChanges: GaslessFlowState[] = [];
      flow.subscribe((state) => stateChanges.push(state));

      const investPromise = flow.invest(mockPoolId, mockAmount);
      await vi.runAllTimersAsync();
      await investPromise;

      const methodState = stateChanges.find((s) => s.method === "userop");
      expect(methodState).toBeDefined();
    });
  });

  describe("authentication check", () => {
    it("should throw error when not authenticated", async () => {
      mockGetState.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      await expect(flow.invest(mockPoolId, mockAmount)).rejects.toThrow(
        "Not authenticated"
      );

      expect(flow.getState().step).toBe("error");
      expect(flow.getState().error).toContain("Not authenticated");
    });

    it("should throw error when user has unknown auth provider", async () => {
      mockGetState.mockReturnValue({
        user: { authProvider: "UNKNOWN" },
        isAuthenticated: true,
      });

      await expect(flow.invest(mockPoolId, mockAmount)).rejects.toThrow(
        "Unknown auth provider"
      );
    });
  });

  describe("state management", () => {
    it("should start in idle state", () => {
      expect(flow.getState().step).toBe("idle");
      expect(flow.getState().method).toBeNull();
    });

    it("should notify subscribers on state changes", async () => {
      mockGetState.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      const states: GaslessFlowState[] = [];
      const unsubscribe = flow.subscribe((state) => states.push(state));

      try {
        await flow.invest(mockPoolId, mockAmount);
      } catch {
        // Expected to fail
      }

      expect(states.length).toBeGreaterThan(0);
      expect(states[0].step).toBe("checking");

      unsubscribe();
    });

    it("should reset to initial state", () => {
      // Manually set some state
      flow["setState"]({
        step: "complete",
        txHash: "0x123",
        method: "permit",
      });

      expect(flow.getState().step).toBe("complete");

      flow.reset();

      expect(flow.getState().step).toBe("idle");
      expect(flow.getState().txHash).toBeNull();
      expect(flow.getState().method).toBeNull();
    });
  });

  describe("abort", () => {
    it("should have abort controller", () => {
      expect(flow.abort).toBeDefined();
      expect(typeof flow.abort).toBe("function");
      // Just verify the abort method exists and can be called
      flow.abort();
      expect(flow.getState().step).toBe("idle");
    });
  });

  describe("singleton instance", () => {
    it("should export singleton instance", () => {
      expect(gaslessInvestmentFlow).toBeInstanceOf(GaslessInvestmentFlow);
    });
  });
});
