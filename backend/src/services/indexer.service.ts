import { ethers, JsonRpcProvider, Contract, Log, EventLog } from "ethers";
import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";

const prisma = new PrismaClient();

// BiometricRegistry events ABI subset
const BIOMETRIC_REGISTRY_ABI = [
  "event IdentityRegistered(address indexed user, bytes32 indexed credentialId, bytes32 publicKeyX, bytes32 publicKeyY, uint256 timestamp)",
  "event IdentityRevoked(address indexed user, uint256 timestamp)",
  "event IdentityVerified(address indexed user, uint32 newCounter, uint256 timestamp)",
  "event RelayerUpdated(address indexed relayer, bool trusted)",
  "event Paused(address account)",
  "event Unpaused(address account)",
];

// Configuration
const BATCH_SIZE = 1000; // Blocks per batch
const CONFIRMATION_BLOCKS = 2; // Wait for confirmations
const POLL_INTERVAL = 5000; // 5 seconds
const LAST_BLOCK_KEY = "indexer:last_block";
const INDEXER_LOCK_KEY = "indexer:lock";

export interface IndexerConfig {
  biometricRegistryAddress: string;
  startBlock?: number;
  rpcUrl: string;
}

export interface IndexedEventData {
  eventId: string;
  contractAddress: string;
  eventName: string;
  blockNumber: number;
  blockHash: string;
  txHash: string;
  logIndex: number;
  args: Record<string, any>;
}

export class IndexerService {
  private provider: JsonRpcProvider;
  private biometricRegistry: Contract;
  private config: IndexerConfig;
  private isRunning: boolean = false;
  private abortController: AbortController | null = null;

  constructor(
    private redis: Redis,
    config: IndexerConfig
  ) {
    this.config = config;
    this.provider = new JsonRpcProvider(config.rpcUrl);
    this.biometricRegistry = new Contract(
      config.biometricRegistryAddress,
      BIOMETRIC_REGISTRY_ABI,
      this.provider
    );
  }

  /**
   * Start the indexer (continuous polling)
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log("Indexer already running");
      return;
    }

    // Try to acquire lock
    const acquired = await this.acquireLock();
    if (!acquired) {
      console.log("Another indexer instance is running");
      return;
    }

    this.isRunning = true;
    this.abortController = new AbortController();
    console.log("Indexer started");

    try {
      while (this.isRunning) {
        await this.indexBatch();
        await this.sleep(POLL_INTERVAL);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Indexer error:", error);
      }
    } finally {
      await this.releaseLock();
      this.isRunning = false;
    }
  }

  /**
   * Stop the indexer gracefully
   */
  async stop(): Promise<void> {
    console.log("Stopping indexer...");
    this.isRunning = false;
    this.abortController?.abort();
    await this.releaseLock();
  }

  /**
   * Index a single batch of blocks
   */
  async indexBatch(): Promise<{ fromBlock: number; toBlock: number; eventsProcessed: number }> {
    const lastBlock = await this.getLastIndexedBlock();
    const currentBlock = await this.provider.getBlockNumber();
    const safeBlock = currentBlock - CONFIRMATION_BLOCKS;

    if (lastBlock >= safeBlock) {
      return { fromBlock: lastBlock, toBlock: lastBlock, eventsProcessed: 0 };
    }

    const fromBlock = lastBlock + 1;
    const toBlock = Math.min(fromBlock + BATCH_SIZE - 1, safeBlock);

    console.log(`Indexing blocks ${fromBlock} to ${toBlock}`);

    const events = await this.fetchEvents(fromBlock, toBlock);
    let eventsProcessed = 0;

    for (const event of events) {
      try {
        await this.processEvent(event);
        eventsProcessed++;
      } catch (error) {
        console.error(`Failed to process event:`, error);
        // Continue with other events
      }
    }

    await this.setLastIndexedBlock(toBlock);

    console.log(`Indexed ${eventsProcessed} events from blocks ${fromBlock}-${toBlock}`);

    return { fromBlock, toBlock, eventsProcessed };
  }

  /**
   * Fetch events from all monitored contracts
   */
  private async fetchEvents(fromBlock: number, toBlock: number): Promise<EventLog[]> {
    const events: EventLog[] = [];

    // Fetch BiometricRegistry events
    const registryEvents = await this.biometricRegistry.queryFilter(
      "*", // All events
      fromBlock,
      toBlock
    );

    for (const event of registryEvents) {
      if (event instanceof EventLog) {
        events.push(event);
      }
    }

    // Sort by block number, then log index
    events.sort((a, b) => {
      if (a.blockNumber !== b.blockNumber) {
        return a.blockNumber - b.blockNumber;
      }
      return a.index - b.index;
    });

    return events;
  }

  /**
   * Process a single event
   */
  async processEvent(event: EventLog): Promise<void> {
    const eventName = event.eventName || event.fragment?.name || "Unknown";
    const eventId = `${event.transactionHash}-${event.index}`;

    // Check if already indexed
    const existing = await prisma.indexedEvent.findUnique({
      where: { eventId },
    });

    if (existing) {
      // Check for reorg
      if (existing.blockHash !== event.blockHash) {
        await prisma.indexedEvent.update({
          where: { eventId },
          data: { reorged: true },
        });
        // Re-process with new data
      } else {
        return; // Already indexed
      }
    }

    // Parse event arguments
    const args = this.parseEventArgs(event);

    // Store in database
    const indexedEvent: IndexedEventData = {
      eventId,
      contractAddress: event.address,
      eventName,
      blockNumber: event.blockNumber,
      blockHash: event.blockHash,
      txHash: event.transactionHash,
      logIndex: event.index,
      args,
    };

    await prisma.indexedEvent.upsert({
      where: { eventId },
      create: indexedEvent,
      update: {
        ...indexedEvent,
        reorged: false,
      },
    });

    // Handle specific event types
    await this.handleEvent(eventName, args, event);
  }

  /**
   * Parse event arguments into a plain object
   */
  private parseEventArgs(event: EventLog): Record<string, any> {
    const args: Record<string, any> = {};

    if (event.args) {
      // Get parameter names from fragment
      const fragment = event.fragment;
      if (fragment && fragment.inputs) {
        fragment.inputs.forEach((input, index) => {
          const value = event.args[index];
          args[input.name] = this.serializeArg(value);
        });
      }
    }

    return args;
  }

  /**
   * Serialize an argument value for JSON storage
   */
  private serializeArg(value: any): any {
    if (typeof value === "bigint") {
      return value.toString();
    }
    if (Array.isArray(value)) {
      return value.map((v) => this.serializeArg(v));
    }
    if (value && typeof value === "object" && value.toString) {
      // Handle bytes32 and other ethers types
      return value.toString();
    }
    return value;
  }

  /**
   * Handle specific event types and update related tables
   */
  private async handleEvent(
    eventName: string,
    args: Record<string, any>,
    event: EventLog
  ): Promise<void> {
    switch (eventName) {
      case "IdentityRegistered":
        await this.handleIdentityRegistered(args, event);
        break;
      case "IdentityRevoked":
        await this.handleIdentityRevoked(args, event);
        break;
      case "IdentityVerified":
        await this.handleIdentityVerified(args, event);
        break;
      case "RelayerUpdated":
        await this.handleRelayerUpdated(args, event);
        break;
      default:
        // Other events are just stored, no special handling
        break;
    }
  }

  /**
   * Handle IdentityRegistered event
   */
  private async handleIdentityRegistered(
    args: Record<string, any>,
    event: EventLog
  ): Promise<void> {
    const { user, credentialId, publicKeyX, publicKeyY } = args;

    // Find user by wallet address
    const dbUser = await prisma.user.findUnique({
      where: { walletAddress: user.toLowerCase() },
      include: { biometricIdentities: true },
    });

    if (dbUser) {
      // Find matching biometric identity by public key
      const identity = dbUser.biometricIdentities.find(
        (bi) =>
          bi.publicKeyX.toLowerCase() === publicKeyX.toLowerCase() &&
          bi.publicKeyY.toLowerCase() === publicKeyY.toLowerCase()
      );

      if (identity && !identity.onChainTxHash) {
        // Update with on-chain transaction hash
        await prisma.biometricIdentity.update({
          where: { id: identity.id },
          data: {
            onChainTxHash: event.transactionHash,
          },
        });
        console.log(`Updated biometric identity ${identity.id} with tx ${event.transactionHash}`);
      }
    }

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: "IDENTITY_REGISTERED_ONCHAIN",
        userId: dbUser?.id,
        resourceType: "BiometricIdentity",
        metadata: {
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          user,
          credentialId,
        },
        status: "SUCCESS",
      },
    });
  }

  /**
   * Handle IdentityRevoked event
   */
  private async handleIdentityRevoked(
    args: Record<string, any>,
    event: EventLog
  ): Promise<void> {
    const { user, timestamp } = args;

    // Find user and deactivate their biometric identities
    const dbUser = await prisma.user.findUnique({
      where: { walletAddress: user.toLowerCase() },
    });

    if (dbUser) {
      await prisma.biometricIdentity.updateMany({
        where: { userId: dbUser.id },
        data: { isActive: false },
      });
      console.log(`Deactivated biometric identities for user ${dbUser.id}`);
    }

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: "IDENTITY_REVOKED_ONCHAIN",
        userId: dbUser?.id,
        resourceType: "BiometricIdentity",
        metadata: {
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          user,
          timestamp,
        },
        status: "SUCCESS",
      },
    });
  }

  /**
   * Handle IdentityVerified event
   */
  private async handleIdentityVerified(
    args: Record<string, any>,
    event: EventLog
  ): Promise<void> {
    const { user, newCounter, timestamp } = args;

    // Find user and update auth counter
    const dbUser = await prisma.user.findUnique({
      where: { walletAddress: user.toLowerCase() },
      include: { biometricIdentities: { where: { isActive: true } } },
    });

    if (dbUser && dbUser.biometricIdentities.length > 0) {
      // Update the first active identity's counter
      await prisma.biometricIdentity.update({
        where: { id: dbUser.biometricIdentities[0].id },
        data: { authCounter: Number(newCounter) },
      });
    }

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: "IDENTITY_VERIFIED_ONCHAIN",
        userId: dbUser?.id,
        resourceType: "BiometricIdentity",
        metadata: {
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          user,
          newCounter,
          timestamp,
        },
        status: "SUCCESS",
      },
    });
  }

  /**
   * Handle RelayerUpdated event
   */
  private async handleRelayerUpdated(
    args: Record<string, any>,
    event: EventLog
  ): Promise<void> {
    const { relayer, trusted } = args;

    // Log audit event
    await prisma.auditLog.create({
      data: {
        action: "RELAYER_UPDATED_ONCHAIN",
        resourceType: "Relayer",
        metadata: {
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          relayer,
          trusted,
        },
        status: "SUCCESS",
      },
    });

    console.log(`Relayer ${relayer} ${trusted ? "added" : "removed"}`);
  }

  /**
   * Get the last indexed block number
   */
  async getLastIndexedBlock(): Promise<number> {
    const cached = await this.redis.get(LAST_BLOCK_KEY);
    if (cached) {
      return parseInt(cached, 10);
    }

    // Fallback: query database for latest indexed event
    const latest = await prisma.indexedEvent.findFirst({
      orderBy: { blockNumber: "desc" },
      select: { blockNumber: true },
    });

    if (latest) {
      await this.redis.set(LAST_BLOCK_KEY, latest.blockNumber.toString());
      return latest.blockNumber;
    }

    // No events indexed yet, use start block from config or current - 1000
    const startBlock = this.config.startBlock || Math.max(0, (await this.provider.getBlockNumber()) - 1000);
    await this.redis.set(LAST_BLOCK_KEY, startBlock.toString());
    return startBlock;
  }

  /**
   * Set the last indexed block number
   */
  private async setLastIndexedBlock(blockNumber: number): Promise<void> {
    await this.redis.set(LAST_BLOCK_KEY, blockNumber.toString());
  }

  /**
   * Reset indexer to a specific block
   */
  async resetToBlock(blockNumber: number): Promise<void> {
    // Mark events after this block as reorged
    await prisma.indexedEvent.updateMany({
      where: { blockNumber: { gt: blockNumber } },
      data: { reorged: true },
    });

    await this.redis.set(LAST_BLOCK_KEY, blockNumber.toString());
    console.log(`Indexer reset to block ${blockNumber}`);
  }

  /**
   * Get indexer status
   */
  async getStatus(): Promise<{
    lastIndexedBlock: number;
    currentBlock: number;
    blocksRemaining: number;
    eventsIndexed: number;
    isRunning: boolean;
  }> {
    const lastIndexedBlock = await this.getLastIndexedBlock();
    const currentBlock = await this.provider.getBlockNumber();
    const eventsIndexed = await prisma.indexedEvent.count({
      where: { reorged: false },
    });

    return {
      lastIndexedBlock,
      currentBlock,
      blocksRemaining: Math.max(0, currentBlock - CONFIRMATION_BLOCKS - lastIndexedBlock),
      eventsIndexed,
      isRunning: this.isRunning,
    };
  }

  /**
   * Acquire distributed lock
   */
  private async acquireLock(): Promise<boolean> {
    const result = await this.redis.set(INDEXER_LOCK_KEY, process.pid.toString(), "EX", 60, "NX");
    if (result) {
      // Start lock refresh
      this.refreshLock();
      return true;
    }
    return false;
  }

  /**
   * Release distributed lock
   */
  private async releaseLock(): Promise<void> {
    await this.redis.del(INDEXER_LOCK_KEY);
  }

  /**
   * Refresh lock periodically
   */
  private refreshLock(): void {
    const interval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(interval);
        return;
      }
      await this.redis.expire(INDEXER_LOCK_KEY, 60);
    }, 30000);
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timeout = setTimeout(resolve, ms);
      if (this.abortController) {
        this.abortController.signal.addEventListener("abort", () => {
          clearTimeout(timeout);
          resolve();
        });
      }
    });
  }
}
