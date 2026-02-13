import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useUserOperation } from "../useUserOperation";

// Mock simplewebauthn
vi.mock("@simplewebauthn/browser", () => ({
  startAuthentication: vi.fn(),
}));

import { startAuthentication } from "@simplewebauthn/browser";

const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
const mockStartAuthentication = startAuthentication as ReturnType<typeof vi.fn>;

describe("useUserOperation", () => {
  const mockPoolId = "pool-123";
  const mockAmount = "1000000000"; // 1000 USDC (6 decimals)
  const mockWalletAddress = "0x1234567890123456789012345678901234567890";

  const mockUserOp = {
    sender: mockWalletAddress,
    nonce: "0x1",
    initCode: "0x",
    callData: "0xabcdef",
    accountGasLimits: "0x000000000000000000030d4000000000000493e0",
    preVerificationGas: "0xc350",
    gasFees: "0x00000000000000000000000059682f00000000000000000077359400",
    paymasterAndData: "0x",
    signature: "0x",
  };

  const mockWalletInfo = {
    address: mockWalletAddress,
    deployed: true,
    depositBalance: "1000000000000000000",
    entryPoint: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
  };

  const mockWebAuthnAssertion = {
    response: {
      authenticatorData: "dGVzdC1hdXRoZW50aWNhdG9yLWRhdGE",
      clientDataJSON: "dGVzdC1jbGllbnQtZGF0YQ",
      signature: "dGVzdC1zaWduYXR1cmU",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getWalletInfo", () => {
    it("should fetch wallet info from backend", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ wallet: mockWalletInfo }),
      });

      const { result } = renderHook(() => useUserOperation());

      let wallet: Awaited<ReturnType<typeof result.current.getWalletInfo>>;
      await act(async () => {
        wallet = await result.current.getWalletInfo();
      });

      expect(wallet!).toEqual(mockWalletInfo);
      expect(result.current.wallet).toEqual(mockWalletInfo);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/userop/wallet"),
        expect.objectContaining({ method: "GET" })
      );
    });

    it("should handle wallet not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: "Wallet not found" }),
      });

      const { result } = renderHook(() => useUserOperation());

      await expect(
        act(async () => {
          await result.current.getWalletInfo();
        })
      ).rejects.toThrow("Wallet not found");

      // Verify API was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/userop/wallet"),
        expect.objectContaining({ method: "GET" })
      );
    });
  });

  describe("buildInvestUserOp", () => {
    it("should build UserOperation from backend", async () => {
      const mockResponse = {
        userOp: mockUserOp,
        hash: "0xhash123",
        walletAddress: mockWalletAddress,
        signingInstructions: {
          challenge: "Y2hhbGxlbmdl",
          rpId: "localhost",
          userVerification: "required",
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const { result } = renderHook(() => useUserOperation());

      let data: Awaited<ReturnType<typeof result.current.buildInvestUserOp>>;
      await act(async () => {
        data = await result.current.buildInvestUserOp(mockPoolId, mockAmount);
      });

      expect(data!.userOp).toEqual(mockUserOp);
      expect(data!.hash).toBe("0xhash123");
      expect(data!.walletAddress).toBe(mockWalletAddress);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/userop/invest/build"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ poolId: mockPoolId, amount: mockAmount }),
        })
      );
    });

    it("should handle build failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: "Insufficient balance" }),
      });

      const { result } = renderHook(() => useUserOperation());

      await expect(
        act(async () => {
          await result.current.buildInvestUserOp(mockPoolId, mockAmount);
        })
      ).rejects.toThrow("Insufficient balance");

      // Verify API was called with correct params
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/userop/invest/build"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ poolId: mockPoolId, amount: mockAmount }),
        })
      );
    });
  });

  describe("signUserOp", () => {
    it("should sign with passkey", async () => {
      mockStartAuthentication.mockResolvedValueOnce(mockWebAuthnAssertion);

      const { result } = renderHook(() => useUserOperation());

      let signature: Awaited<ReturnType<typeof result.current.signUserOp>>;
      await act(async () => {
        signature = await result.current.signUserOp("0xhash123", "localhost");
      });

      expect(signature!).toEqual({
        authenticatorData: mockWebAuthnAssertion.response.authenticatorData,
        clientDataJSON: mockWebAuthnAssertion.response.clientDataJSON,
        signature: mockWebAuthnAssertion.response.signature,
        counter: 0,
      });

      expect(mockStartAuthentication).toHaveBeenCalledWith({
        optionsJSON: expect.objectContaining({
          rpId: "localhost",
          userVerification: "required",
        }),
      });
    });

    it("should handle passkey cancellation", async () => {
      mockStartAuthentication.mockRejectedValueOnce(
        new Error("User cancelled authentication")
      );

      const { result } = renderHook(() => useUserOperation());

      await expect(
        act(async () => {
          await result.current.signUserOp("0xhash123", "localhost");
        })
      ).rejects.toThrow("User cancelled authentication");

      // Verify startAuthentication was called with correct options
      expect(mockStartAuthentication).toHaveBeenCalledWith({
        optionsJSON: expect.objectContaining({
          rpId: "localhost",
          userVerification: "required",
        }),
      });
    });
  });

  describe("submitUserOp", () => {
    it("should submit signed UserOperation", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            result: {
              userOpHash: "0xuserophash",
              txHash: "0xtxhash",
              status: "success",
            },
          }),
      });

      const webauthnSignature = {
        authenticatorData: "auth-data",
        clientDataJSON: "client-data",
        signature: "sig",
        counter: 0,
      };

      const { result } = renderHook(() => useUserOperation());

      let response: Awaited<ReturnType<typeof result.current.submitUserOp>>;
      await act(async () => {
        response = await result.current.submitUserOp(mockUserOp, webauthnSignature);
      });

      expect(response!).toEqual({
        userOpHash: "0xuserophash",
        txHash: "0xtxhash",
        status: "success",
      });

      expect(result.current.userOpHash).toBe("0xuserophash");
      expect(result.current.txHash).toBe("0xtxhash");
      expect(result.current.status).toBe("success");
    });

    it("should handle submission failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: "Bundler rejected" }),
      });

      const { result } = renderHook(() => useUserOperation());

      await expect(
        act(async () => {
          await result.current.submitUserOp(mockUserOp, {
            authenticatorData: "",
            clientDataJSON: "",
            signature: "",
            counter: 0,
          });
        })
      ).rejects.toThrow("Bundler rejected");

      // Verify API was called
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/userop/invest/submit"),
        expect.objectContaining({ method: "POST" })
      );
    });
  });

  describe("investWithUserOp (full flow)", () => {
    it("should complete full UserOp investment flow", async () => {
      // Mock build
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            userOp: mockUserOp,
            hash: "0xhash123",
            walletAddress: mockWalletAddress,
            signingInstructions: {
              challenge: "Y2hhbGxlbmdl",
              rpId: "localhost",
              userVerification: "required",
            },
          }),
      });

      // Mock passkey authentication
      mockStartAuthentication.mockResolvedValueOnce(mockWebAuthnAssertion);

      // Mock submit
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            result: {
              userOpHash: "0xfinaluserop",
              txHash: "0xfinaltx",
              status: "success",
            },
          }),
      });

      const { result } = renderHook(() => useUserOperation());

      let response: Awaited<ReturnType<typeof result.current.investWithUserOp>>;
      await act(async () => {
        response = await result.current.investWithUserOp(mockPoolId, mockAmount);
      });

      expect(response!.userOpHash).toBe("0xfinaluserop");
      expect(response!.txHash).toBe("0xfinaltx");
      expect(response!.status).toBe("success");
    });
  });

  describe("checkStatus", () => {
    it("should check UserOperation status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "success",
            txHash: "0xconfirmedtx",
            blockNumber: 12345,
          }),
      });

      const { result } = renderHook(() => useUserOperation());

      let status: Awaited<ReturnType<typeof result.current.checkStatus>>;
      await act(async () => {
        status = await result.current.checkStatus("0xuserophash");
      });

      expect(status!).toEqual({
        status: "success",
        txHash: "0xconfirmedtx",
        blockNumber: 12345,
      });

      expect(result.current.status).toBe("success");
      expect(result.current.txHash).toBe("0xconfirmedtx");
    });

    it("should handle pending status", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            status: "pending",
            txHash: null,
            blockNumber: null,
          }),
      });

      const { result } = renderHook(() => useUserOperation());

      let status: Awaited<ReturnType<typeof result.current.checkStatus>>;
      await act(async () => {
        status = await result.current.checkStatus("0xuserophash");
      });

      expect(status!.status).toBe("pending");
      expect(status!.txHash).toBeNull();
    });
  });

  describe("reset", () => {
    it("should reset all state", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            result: {
              userOpHash: "0xhash",
              txHash: "0xtx",
              status: "success",
            },
          }),
      });

      const { result } = renderHook(() => useUserOperation());

      // Submit something to set state
      await act(async () => {
        await result.current.submitUserOp(mockUserOp, {
          authenticatorData: "",
          clientDataJSON: "",
          signature: "",
          counter: 0,
        });
      });

      expect(result.current.userOpHash).toBe("0xhash");

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.userOpHash).toBeNull();
      expect(result.current.txHash).toBeNull();
      expect(result.current.status).toBe("idle");
      expect(result.current.error).toBeNull();
    });
  });
});
