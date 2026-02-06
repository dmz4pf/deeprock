import { ethers, Contract, JsonRpcProvider } from "ethers";

/**
 * EIP-2612 Permit data structure
 */
export interface PermitData {
  owner: string;
  spender: string;
  value: bigint;
  nonce: bigint;
  deadline: number;
}

/**
 * Parsed permit signature components
 */
export interface PermitSignature {
  v: number;
  r: string;
  s: string;
}

/**
 * EIP-712 typed data for permit signing
 */
export interface PermitTypedData {
  domain: {
    name: string;
    version: string;
    chainId: number;
    verifyingContract: string;
  };
  types: {
    Permit: Array<{ name: string; type: string }>;
  };
  primaryType: "Permit";
  message: {
    owner: string;
    spender: string;
    value: string;
    nonce: string;
    deadline: number;
  };
}

// MockUSDC ABI for permit-related functions
const PERMIT_ABI = [
  "function nonces(address owner) view returns (uint256)",
  "function DOMAIN_SEPARATOR() view returns (bytes32)",
  "function name() view returns (string)",
];

/**
 * PermitService handles EIP-2612 permit generation and signature parsing
 * for gasless token approvals
 */
export class PermitService {
  private provider: JsonRpcProvider;
  private tokenContract: Contract;
  private tokenAddress: string;
  private chainId: number;
  private tokenName: string | null = null;

  constructor(tokenAddress: string, rpcUrl: string, chainId: number) {
    this.tokenAddress = tokenAddress;
    this.chainId = chainId;
    this.provider = new JsonRpcProvider(rpcUrl, chainId);
    this.tokenContract = new Contract(tokenAddress, PERMIT_ABI, this.provider);
  }

  /**
   * Get the current nonce for an owner address
   * Each permit uses a unique nonce to prevent replay attacks
   */
  async getNonce(owner: string): Promise<bigint> {
    return this.tokenContract.nonces(owner);
  }

  /**
   * Get the EIP-712 domain separator for the token
   */
  async getDomainSeparator(): Promise<string> {
    return this.tokenContract.DOMAIN_SEPARATOR();
  }

  /**
   * Get the token name (cached after first call)
   */
  async getTokenName(): Promise<string> {
    if (!this.tokenName) {
      this.tokenName = await this.tokenContract.name();
    }
    return this.tokenName;
  }

  /**
   * Generate permit data and EIP-712 typed data for signing
   * @param owner The token owner's address
   * @param spender The spender address (usually the pool contract)
   * @param value Amount to approve
   * @param deadline Optional deadline (defaults to 1 hour from now)
   * @returns PermitData and EIP-712 typed data for signing
   */
  async generatePermitData(
    owner: string,
    spender: string,
    value: bigint,
    deadline?: number
  ): Promise<{ data: PermitData; typedData: PermitTypedData }> {
    // Get current nonce for the owner
    const nonce = await this.getNonce(owner);

    // Default deadline: 1 hour from now
    const permitDeadline = deadline || Math.floor(Date.now() / 1000) + 3600;

    // Get token name for domain
    const tokenName = await this.getTokenName();

    const data: PermitData = {
      owner,
      spender,
      value,
      nonce,
      deadline: permitDeadline,
    };

    const typedData: PermitTypedData = {
      domain: {
        name: tokenName,
        version: "1",
        chainId: this.chainId,
        verifyingContract: this.tokenAddress,
      },
      types: {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      },
      primaryType: "Permit",
      message: {
        owner,
        spender,
        value: value.toString(),
        nonce: nonce.toString(),
        deadline: permitDeadline,
      },
    };

    return { data, typedData };
  }

  /**
   * Parse an EIP-712 signature into v, r, s components
   * @param signature The hex-encoded signature from wallet
   * @returns Parsed signature components
   */
  parseSignature(signature: string): PermitSignature {
    const sig = ethers.Signature.from(signature);
    return {
      v: sig.v,
      r: sig.r,
      s: sig.s,
    };
  }

  /**
   * Verify a permit signature is valid
   * @param typedData The EIP-712 typed data that was signed
   * @param signature The signature to verify
   * @param expectedSigner The expected signer address
   * @returns true if signature is valid
   */
  verifySignature(
    typedData: PermitTypedData,
    signature: string,
    expectedSigner: string
  ): boolean {
    try {
      const recoveredAddress = ethers.verifyTypedData(
        typedData.domain,
        typedData.types,
        typedData.message,
        signature
      );
      return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
    } catch {
      return false;
    }
  }

  /**
   * Check if a deadline has expired
   */
  isDeadlineExpired(deadline: number): boolean {
    return deadline < Math.floor(Date.now() / 1000);
  }

  /**
   * Get permit parameters ready for contract call
   * Combines typed data with parsed signature for easy submission
   */
  async preparePermitParams(
    owner: string,
    spender: string,
    value: bigint,
    signature: string,
    deadline?: number
  ): Promise<{
    owner: string;
    spender: string;
    value: bigint;
    deadline: number;
    v: number;
    r: string;
    s: string;
  }> {
    const { data } = await this.generatePermitData(owner, spender, value, deadline);
    const sig = this.parseSignature(signature);

    return {
      owner: data.owner,
      spender: data.spender,
      value: data.value,
      deadline: data.deadline,
      v: sig.v,
      r: sig.r,
      s: sig.s,
    };
  }
}

// Singleton instance factory
let permitServiceInstance: PermitService | null = null;

export function getPermitService(): PermitService {
  if (!permitServiceInstance) {
    const tokenAddress = process.env.MOCK_USDC_ADDRESS;
    const rpcUrl = process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
    const chainId = parseInt(process.env.CHAIN_ID || "43113");

    if (!tokenAddress) {
      throw new Error("MOCK_USDC_ADDRESS environment variable required");
    }

    permitServiceInstance = new PermitService(tokenAddress, rpcUrl, chainId);
  }

  return permitServiceInstance;
}
