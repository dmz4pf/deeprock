import { ethers, JsonRpcProvider, Contract } from "ethers";

// ERC-4337 EntryPoint v0.7 ABI (minimal for balance check)
const ENTRYPOINT_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function getDepositInfo(address account) external view returns (uint256 deposit, bool staked, uint112 stake, uint32 unstakeDelaySec, uint48 withdrawTime)",
];

// Standard EntryPoint v0.7 address
const ENTRYPOINT_ADDRESS = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";

export interface HealthCheck {
  name: string;
  status: "healthy" | "warning" | "critical";
  value: string;
  threshold: string;
  message?: string;
}

export interface TxMetrics {
  period: "1h" | "24h";
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  avgGasUsed?: string;
}

export interface MonitoringConfig {
  rpcUrl: string;
  chainId: number;
  relayerAddress: string;
  paymasterAddress?: string;
  lowBalanceThreshold?: bigint;
  paymasterLowThreshold?: bigint;
}

export class MonitoringService {
  private provider: JsonRpcProvider;
  private entryPoint: Contract;
  private relayerAddress: string;
  private paymasterAddress: string | null;
  private chainId: number;

  // Configurable thresholds (defaults)
  private readonly LOW_BALANCE_THRESHOLD: bigint;
  private readonly PAYMASTER_LOW_THRESHOLD: bigint;

  constructor(config: MonitoringConfig) {
    this.chainId = config.chainId;
    this.relayerAddress = config.relayerAddress;
    this.paymasterAddress = config.paymasterAddress || null;

    // Allow configurable thresholds with sensible defaults
    this.LOW_BALANCE_THRESHOLD = config.lowBalanceThreshold || ethers.parseEther("0.5");
    this.PAYMASTER_LOW_THRESHOLD = config.paymasterLowThreshold || ethers.parseEther("0.1");

    // Don't pass chainId to JsonRpcProvider - let it auto-detect to avoid timeout issues
    this.provider = new JsonRpcProvider(config.rpcUrl);
    this.entryPoint = new Contract(ENTRYPOINT_ADDRESS, ENTRYPOINT_ABI, this.provider);
  }

  /**
   * Check relayer wallet balance
   */
  async checkRelayerBalance(): Promise<HealthCheck> {
    try {
      const balance = await this.provider.getBalance(this.relayerAddress);
      const balanceEther = ethers.formatEther(balance);
      const thresholdEther = ethers.formatEther(this.LOW_BALANCE_THRESHOLD);

      let status: "healthy" | "warning" | "critical";
      let message: string | undefined;

      if (balance < this.LOW_BALANCE_THRESHOLD / 2n) {
        status = "critical";
        message = `Relayer balance critically low! Fund immediately.`;
      } else if (balance < this.LOW_BALANCE_THRESHOLD) {
        status = "warning";
        message = `Relayer balance below threshold. Consider funding soon.`;
      } else {
        status = "healthy";
      }

      return {
        name: "relayer_balance",
        status,
        value: `${balanceEther} AVAX`,
        threshold: `${thresholdEther} AVAX`,
        message,
      };
    } catch (error: any) {
      return {
        name: "relayer_balance",
        status: "critical",
        value: "ERROR",
        threshold: ethers.formatEther(this.LOW_BALANCE_THRESHOLD) + " AVAX",
        message: `Failed to check balance: ${error.message}`,
      };
    }
  }

  /**
   * Check paymaster deposit in EntryPoint
   */
  async checkPaymasterDeposit(): Promise<HealthCheck> {
    if (!this.paymasterAddress) {
      return {
        name: "paymaster_deposit",
        status: "warning",
        value: "N/A",
        threshold: "N/A",
        message: "Paymaster address not configured",
      };
    }

    try {
      const deposit = await this.entryPoint.balanceOf(this.paymasterAddress);
      const depositEther = ethers.formatEther(deposit);
      const thresholdEther = ethers.formatEther(this.PAYMASTER_LOW_THRESHOLD);

      let status: "healthy" | "warning" | "critical";
      let message: string | undefined;

      if (deposit < this.PAYMASTER_LOW_THRESHOLD / 2n) {
        status = "critical";
        message = `Paymaster deposit critically low! UserOps will fail.`;
      } else if (deposit < this.PAYMASTER_LOW_THRESHOLD) {
        status = "warning";
        message = `Paymaster deposit low. Top up recommended.`;
      } else {
        status = "healthy";
      }

      return {
        name: "paymaster_deposit",
        status,
        value: `${depositEther} AVAX`,
        threshold: `${thresholdEther} AVAX`,
        message,
      };
    } catch (error: any) {
      return {
        name: "paymaster_deposit",
        status: "critical",
        value: "ERROR",
        threshold: ethers.formatEther(this.PAYMASTER_LOW_THRESHOLD) + " AVAX",
        message: `Failed to check deposit: ${error.message}`,
      };
    }
  }

  /**
   * Check RPC connectivity
   */
  async checkRpcHealth(): Promise<HealthCheck> {
    try {
      const startTime = Date.now();
      const blockNumber = await this.provider.getBlockNumber();
      const latency = Date.now() - startTime;

      let status: "healthy" | "warning" | "critical";
      let message: string | undefined;

      if (latency > 5000) {
        status = "warning";
        message = `High RPC latency: ${latency}ms`;
      } else {
        status = "healthy";
      }

      return {
        name: "rpc_health",
        status,
        value: `Block ${blockNumber}, ${latency}ms`,
        threshold: "< 5000ms",
        message,
      };
    } catch (error: any) {
      return {
        name: "rpc_health",
        status: "critical",
        value: "ERROR",
        threshold: "< 5000ms",
        message: `RPC unreachable: ${error.message}`,
      };
    }
  }

  /**
   * Check chain ID matches expected
   */
  async checkChainId(): Promise<HealthCheck> {
    try {
      const network = await this.provider.getNetwork();
      const actualChainId = Number(network.chainId);

      if (actualChainId !== this.chainId) {
        return {
          name: "chain_id",
          status: "critical",
          value: actualChainId.toString(),
          threshold: this.chainId.toString(),
          message: `Chain ID mismatch! Expected ${this.chainId}, got ${actualChainId}`,
        };
      }

      return {
        name: "chain_id",
        status: "healthy",
        value: actualChainId.toString(),
        threshold: this.chainId.toString(),
      };
    } catch (error: any) {
      return {
        name: "chain_id",
        status: "critical",
        value: "ERROR",
        threshold: this.chainId.toString(),
        message: `Failed to check chain: ${error.message}`,
      };
    }
  }

  /**
   * Run all health checks
   */
  async runAllChecks(): Promise<HealthCheck[]> {
    const checks = await Promise.all([
      this.checkRelayerBalance(),
      this.checkPaymasterDeposit(),
      this.checkRpcHealth(),
      this.checkChainId(),
    ]);

    return checks;
  }

  /**
   * Get overall system status based on all checks
   */
  async getOverallStatus(): Promise<{
    status: "healthy" | "degraded" | "critical";
    checks: HealthCheck[];
  }> {
    const checks = await this.runAllChecks();

    const hasCritical = checks.some((c) => c.status === "critical");
    const hasWarning = checks.some((c) => c.status === "warning");

    let status: "healthy" | "degraded" | "critical";
    if (hasCritical) {
      status = "critical";
    } else if (hasWarning) {
      status = "degraded";
    } else {
      status = "healthy";
    }

    return { status, checks };
  }

  /**
   * Get relayer address
   */
  getRelayerAddress(): string {
    return this.relayerAddress;
  }

  /**
   * Get paymaster address
   */
  getPaymasterAddress(): string | null {
    return this.paymasterAddress;
  }
}
