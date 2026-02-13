import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePermit } from "../usePermit";

const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
const mockEthereum = window.ethereum as {
  request: ReturnType<typeof vi.fn>;
};

describe("usePermit", () => {
  const mockPoolId = "pool-123";
  const mockAmount = "1000000000"; // 1000 USDC (6 decimals)

  const mockPermitData = {
    owner: "0x1234567890123456789012345678901234567890",
    spender: "0xABCDEF0123456789ABCDEF0123456789ABCDEF01",
    value: mockAmount,
    nonce: "0",
    deadline: Math.floor(Date.now() / 1000) + 3600,
  };

  const mockTypedData = {
    domain: {
      name: "Mock USDC",
      version: "1",
      chainId: 43113,
      verifyingContract: "0xd249A6FE09666B97B85fE479E218cAE44d7dE810",
    },
    types: {
      // EIP712Domain is required for MetaMask's eth_signTypedData_v4
      EIP712Domain: [
        { name: "name", type: "string" },
        { name: "version", type: "string" },
        { name: "chainId", type: "uint256" },
        { name: "verifyingContract", type: "address" },
      ],
      Permit: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    },
    primaryType: "Permit" as const,
    message: mockPermitData,
  };

  // Valid 65-byte signature (r + s + v)
  const mockSignature =
    "0x" +
    "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" + // r (32 bytes)
    "fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321" + // s (32 bytes)
    "1b"; // v (1 byte = 27)

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generatePermitData", () => {
    it("should fetch permit data from backend", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            permitData: mockPermitData,
            typedData: mockTypedData,
          }),
      });

      const { result } = renderHook(() => usePermit());

      let data: Awaited<ReturnType<typeof result.current.generatePermitData>>;
      await act(async () => {
        data = await result.current.generatePermitData(mockPoolId, mockAmount);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/pools/${mockPoolId}/permit`),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ amount: mockAmount }),
        })
      );

      expect(data!.permitData).toEqual(mockPermitData);
      expect(data!.typedData).toEqual(mockTypedData);
    });

    it("should handle error when backend fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: "Pool not found" }),
      });

      const { result } = renderHook(() => usePermit());

      await expect(
        act(async () => {
          await result.current.generatePermitData(mockPoolId, mockAmount);
        })
      ).rejects.toThrow("Pool not found");

      // Verify hook was called with correct endpoint
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/pools/${mockPoolId}/permit`),
        expect.any(Object)
      );
    });
  });

  describe("signPermit", () => {
    it("should sign typed data with wallet", async () => {
      mockEthereum.request
        .mockResolvedValueOnce([mockPermitData.owner]) // eth_accounts
        .mockResolvedValueOnce(mockSignature); // eth_signTypedData_v4

      const { result } = renderHook(() => usePermit());

      let signature: Awaited<ReturnType<typeof result.current.signPermit>>;
      await act(async () => {
        signature = await result.current.signPermit(mockTypedData);
      });

      expect(signature!).toEqual({
        v: 27,
        r: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        s: "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
      });

      expect(result.current.signature).toEqual(signature);
    });

    it("should throw error when no wallet connected", async () => {
      mockEthereum.request.mockResolvedValueOnce([]); // No accounts

      const { result } = renderHook(() => usePermit());

      await expect(
        act(async () => {
          await result.current.signPermit(mockTypedData);
        })
      ).rejects.toThrow("No wallet connected");
    });
  });

  describe("submitWithPermit", () => {
    it("should submit investment with permit signature", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            result: {
              txHash: "0xabc123",
              status: "pending",
            },
          }),
      });

      const signature = { v: 27, r: "0x123", s: "0x456" };
      const { result } = renderHook(() => usePermit());

      let response: Awaited<ReturnType<typeof result.current.submitWithPermit>>;
      await act(async () => {
        response = await result.current.submitWithPermit(
          mockPoolId,
          mockAmount,
          mockPermitData.deadline,
          signature
        );
      });

      expect(response!).toEqual({
        txHash: "0xabc123",
        status: "pending",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/pools/${mockPoolId}/invest-with-permit`),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            amount: mockAmount,
            deadline: mockPermitData.deadline,
            v: 27,
            r: "0x123",
            s: "0x456",
          }),
        })
      );
    });
  });

  describe("investWithPermit (full flow)", () => {
    it("should complete full permit investment flow", async () => {
      // Mock generatePermitData
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            permitData: mockPermitData,
            typedData: mockTypedData,
          }),
      });

      // Mock signPermit
      mockEthereum.request
        .mockResolvedValueOnce([mockPermitData.owner])
        .mockResolvedValueOnce(mockSignature);

      // Mock submitWithPermit
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            result: { txHash: "0xfinal123", status: "success" },
          }),
      });

      const { result } = renderHook(() => usePermit());

      let response: Awaited<ReturnType<typeof result.current.investWithPermit>>;
      await act(async () => {
        response = await result.current.investWithPermit(mockPoolId, mockAmount);
      });

      expect(response!.txHash).toBe("0xfinal123");
      expect(response!.status).toBe("success");
    });
  });

  describe("reset", () => {
    it("should reset state after successful signature", async () => {
      // Set up a successful sign flow
      mockEthereum.request
        .mockResolvedValueOnce([mockPermitData.owner])
        .mockResolvedValueOnce(mockSignature);

      const { result } = renderHook(() => usePermit());

      await act(async () => {
        await result.current.signPermit(mockTypedData);
      });

      // Verify signature was set
      expect(result.current.signature).not.toBeNull();

      // Reset
      act(() => {
        result.current.reset();
      });

      expect(result.current.error).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.signature).toBeNull();
    });
  });
});
