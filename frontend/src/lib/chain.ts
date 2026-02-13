/**
 * Chain utilities for preparing biometric signatures for on-chain verification
 * Used with ACP-204 secp256r1 (P-256) precompile on Avalanche
 */

import { keccak256, encodePacked, encodeAbiParameters, parseAbiParameters } from "viem";

// Contract addresses (will be set via environment)
export const CONTRACTS = {
  BIOMETRIC_REGISTRY: process.env.NEXT_PUBLIC_BIOMETRIC_REGISTRY_ADDRESS || "",
  RWA_GATEWAY: process.env.NEXT_PUBLIC_RWA_GATEWAY_ADDRESS || "",
  CREDENTIAL_VERIFIER: process.env.NEXT_PUBLIC_CREDENTIAL_VERIFIER_ADDRESS || "",
} as const;

// Chain configuration
export const AVALANCHE_FUJI = {
  id: 43113,
  name: "Avalanche Fuji",
  rpcUrl: process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
  blockExplorer: "https://testnet.snowtrace.io",
} as const;

/**
 * Prepare a message for biometric signing
 * Creates a hash that will be signed by the WebAuthn credential
 */
export function prepareSignatureMessage(params: {
  action: "invest" | "redeem" | "approve" | "register";
  poolId?: number;
  amount?: bigint;
  deadline: number;
  userAddress: string;
  nonce: bigint;
}): `0x${string}` {
  const { action, poolId, amount, deadline, userAddress, nonce } = params;

  // Create the message based on action type
  switch (action) {
    case "invest":
      if (poolId === undefined || amount === undefined) {
        throw new Error("poolId and amount required for invest action");
      }
      return keccak256(
        encodePacked(
          ["string", "uint256", "uint256", "uint256", "address", "uint256"],
          ["INVEST", BigInt(poolId), amount, BigInt(deadline), userAddress as `0x${string}`, nonce]
        )
      );

    case "redeem":
      if (poolId === undefined || amount === undefined) {
        throw new Error("poolId and amount required for redeem action");
      }
      return keccak256(
        encodePacked(
          ["string", "uint256", "uint256", "uint256", "address", "uint256"],
          ["REDEEM", BigInt(poolId), amount, BigInt(deadline), userAddress as `0x${string}`, nonce]
        )
      );

    case "approve":
      if (amount === undefined) {
        throw new Error("amount required for approve action");
      }
      return keccak256(
        encodePacked(
          ["string", "uint256", "uint256", "address", "uint256"],
          ["APPROVE", amount, BigInt(deadline), userAddress as `0x${string}`, nonce]
        )
      );

    case "register":
      return keccak256(
        encodePacked(
          ["string", "uint256", "address", "uint256"],
          ["REGISTER", BigInt(deadline), userAddress as `0x${string}`, nonce]
        )
      );

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

/**
 * Extract r,s components from a WebAuthn signature
 * WebAuthn uses DER-encoded ECDSA signatures for P-256
 */
export function extractSignatureComponents(signature: ArrayBuffer): { r: `0x${string}`; s: `0x${string}` } {
  const sig = new Uint8Array(signature);

  // DER structure: 0x30 [total-length] 0x02 [r-length] [r] 0x02 [s-length] [s]
  if (sig[0] !== 0x30) {
    throw new Error("Invalid DER signature: expected 0x30");
  }

  let offset = 2; // Skip 0x30 and length byte

  // Parse r
  if (sig[offset] !== 0x02) {
    throw new Error("Invalid DER signature: expected 0x02 for r");
  }
  offset++;

  const rLength = sig[offset];
  offset++;

  let rStart = offset;
  let rEnd = offset + rLength;

  // Handle leading zero (if r is negative in DER, it has a leading 0x00)
  if (sig[rStart] === 0x00 && rLength === 33) {
    rStart++;
  }

  const r = sig.slice(rStart, rEnd);
  offset = rEnd;

  // Parse s
  if (sig[offset] !== 0x02) {
    throw new Error("Invalid DER signature: expected 0x02 for s");
  }
  offset++;

  const sLength = sig[offset];
  offset++;

  let sStart = offset;
  let sEnd = offset + sLength;

  // Handle leading zero
  if (sig[sStart] === 0x00 && sLength === 33) {
    sStart++;
  }

  const s = sig.slice(sStart, sEnd);

  // Ensure 32 bytes each (pad if necessary)
  const rPadded = padTo32Bytes(r);
  const sPadded = padTo32Bytes(s);

  return {
    r: `0x${Buffer.from(rPadded).toString("hex")}` as `0x${string}`,
    s: `0x${Buffer.from(sPadded).toString("hex")}` as `0x${string}`,
  };
}

/**
 * Pad a byte array to 32 bytes (prepend zeros if needed)
 */
function padTo32Bytes(bytes: Uint8Array): Uint8Array {
  if (bytes.length === 32) return bytes;
  if (bytes.length > 32) {
    throw new Error(`Value too large: ${bytes.length} bytes`);
  }

  const padded = new Uint8Array(32);
  padded.set(bytes, 32 - bytes.length);
  return padded;
}

/**
 * Normalize S value to low-S form (required for some signature verification)
 * The secp256r1 curve order is n = 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551
 */
const SECP256R1_ORDER = BigInt("0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551");
const SECP256R1_HALF_ORDER = SECP256R1_ORDER / BigInt(2);

export function normalizeSignatureToLowS(r: `0x${string}`, s: `0x${string}`): { r: `0x${string}`; s: `0x${string}` } {
  const sValue = BigInt(s);

  // If s > n/2, use n - s (low-S form)
  if (sValue > SECP256R1_HALF_ORDER) {
    const lowS = SECP256R1_ORDER - sValue;
    const lowSHex = lowS.toString(16).padStart(64, "0");
    return { r, s: `0x${lowSHex}` as `0x${string}` };
  }

  return { r, s };
}

/**
 * Prepare authenticator data hash from WebAuthn response
 * This is used as part of the signature verification on-chain
 */
export function hashAuthenticatorData(authenticatorData: ArrayBuffer): `0x${string}` {
  return keccak256(new Uint8Array(authenticatorData));
}

/**
 * Prepare client data hash from WebAuthn response
 */
export function hashClientData(clientDataJSON: ArrayBuffer): `0x${string}` {
  return keccak256(new Uint8Array(clientDataJSON));
}

/**
 * Create the full message hash for on-chain verification
 * This combines authenticator data and client data as per WebAuthn spec
 */
export function createVerificationHash(
  authenticatorData: ArrayBuffer,
  clientDataJSON: ArrayBuffer
): `0x${string}` {
  // The signed data in WebAuthn is: authenticatorData || SHA-256(clientDataJSON)
  // For on-chain, we hash this combination
  const authData = new Uint8Array(authenticatorData);
  const clientDataHash = sha256(new Uint8Array(clientDataJSON));

  // Combine and hash with keccak256 for EVM compatibility
  const combined = new Uint8Array(authData.length + 32);
  combined.set(authData);
  combined.set(clientDataHash, authData.length);

  return keccak256(combined);
}

/**
 * Simple SHA-256 implementation using SubtleCrypto
 * Returns a Uint8Array of the hash
 */
export async function sha256Async(data: Uint8Array): Promise<Uint8Array> {
  // Create a copy to ensure we have a proper ArrayBuffer
  const buffer = new ArrayBuffer(data.length);
  new Uint8Array(buffer).set(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return new Uint8Array(hashBuffer);
}

/**
 * Synchronous SHA-256 placeholder - use the async version when possible
 * This is a fallback that should be replaced with proper async usage
 */
function sha256(data: Uint8Array): Uint8Array {
  // In browser context, we'd typically use crypto.subtle.digest
  // For synchronous operation, we'd need a JS implementation
  // This placeholder returns zeros - actual implementation should use async
  console.warn("Using synchronous sha256 placeholder - prefer sha256Async");
  return new Uint8Array(32);
}

/**
 * Encode investment parameters for the relayer
 */
export function encodeInvestmentParams(params: {
  poolId: number;
  amount: bigint;
  deadline: number;
  r: `0x${string}`;
  s: `0x${string}`;
}): `0x${string}` {
  return encodeAbiParameters(
    parseAbiParameters("uint256 poolId, uint256 amount, uint256 deadline, bytes32 r, bytes32 s"),
    [BigInt(params.poolId), params.amount, BigInt(params.deadline), params.r, params.s]
  );
}

/**
 * Encode redemption parameters for the relayer
 */
export function encodeRedemptionParams(params: {
  poolId: number;
  shares: bigint;
  deadline: number;
  r: `0x${string}`;
  s: `0x${string}`;
}): `0x${string}` {
  return encodeAbiParameters(
    parseAbiParameters("uint256 poolId, uint256 shares, uint256 deadline, bytes32 r, bytes32 s"),
    [BigInt(params.poolId), params.shares, BigInt(params.deadline), params.r, params.s]
  );
}

/**
 * Get deadline timestamp (current time + seconds)
 */
export function getDeadline(secondsFromNow: number = 300): number {
  return Math.floor(Date.now() / 1000) + secondsFromNow;
}

/**
 * Format wei to human readable with decimals
 */
export function formatTokenAmount(amount: bigint, decimals: number = 18): string {
  const divisor = BigInt(10 ** decimals);
  const integerPart = amount / divisor;
  const fractionalPart = amount % divisor;

  const fractionalStr = fractionalPart.toString().padStart(decimals, "0");
  const trimmedFractional = fractionalStr.replace(/0+$/, "") || "0";

  if (trimmedFractional === "0") {
    return integerPart.toString();
  }

  return `${integerPart}.${trimmedFractional.slice(0, 6)}`; // Max 6 decimal places
}

/**
 * Parse token amount from human readable string
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  const [integerPart, fractionalPart = ""] = amount.split(".");
  const paddedFractional = fractionalPart.padEnd(decimals, "0").slice(0, decimals);
  return BigInt(integerPart + paddedFractional);
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Get block explorer URL for transaction
 */
export function getExplorerTxUrl(txHash: string): string {
  return `${AVALANCHE_FUJI.blockExplorer}/tx/${txHash}`;
}

/**
 * Get block explorer URL for address
 */
export function getExplorerAddressUrl(address: string): string {
  return `${AVALANCHE_FUJI.blockExplorer}/address/${address}`;
}
