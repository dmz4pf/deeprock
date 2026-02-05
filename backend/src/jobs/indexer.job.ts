import { Redis } from "ioredis";
import { IndexerService, IndexerConfig } from "../services/indexer.service.js";

// Configuration from environment
const config: IndexerConfig = {
  rpcUrl: process.env.AVALANCHE_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
  biometricRegistryAddress: process.env.BIOMETRIC_REGISTRY_ADDRESS || "",
  startBlock: process.env.INDEXER_START_BLOCK ? parseInt(process.env.INDEXER_START_BLOCK, 10) : undefined,
};

// Validate configuration
function validateConfig(): boolean {
  if (!config.biometricRegistryAddress) {
    console.error("BIOMETRIC_REGISTRY_ADDRESS environment variable not set");
    return false;
  }

  if (!config.biometricRegistryAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
    console.error("Invalid BIOMETRIC_REGISTRY_ADDRESS format");
    return false;
  }

  return true;
}

// Initialize Redis
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Initialize indexer
let indexer: IndexerService | null = null;

/**
 * Start the indexer job
 */
export async function startIndexer(): Promise<IndexerService | null> {
  if (!validateConfig()) {
    console.error("Indexer configuration invalid, skipping startup");
    return null;
  }

  if (indexer) {
    console.log("Indexer already initialized");
    return indexer;
  }

  indexer = new IndexerService(redis, config);

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, stopping indexer...`);
    if (indexer) {
      await indexer.stop();
    }
    await redis.quit();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Start indexer in background
  indexer.start().catch((error) => {
    console.error("Indexer failed:", error);
  });

  return indexer;
}

/**
 * Stop the indexer job
 */
export async function stopIndexer(): Promise<void> {
  if (indexer) {
    await indexer.stop();
    indexer = null;
  }
}

/**
 * Get current indexer instance
 */
export function getIndexer(): IndexerService | null {
  return indexer;
}

/**
 * Run indexer as standalone process
 */
async function main(): Promise<void> {
  console.log("Starting blockchain event indexer...");
  console.log(`RPC URL: ${config.rpcUrl}`);
  console.log(`BiometricRegistry: ${config.biometricRegistryAddress}`);

  const instance = await startIndexer();

  if (!instance) {
    console.error("Failed to start indexer");
    process.exit(1);
  }

  // Get initial status
  const status = await instance.getStatus();
  console.log(`Current status:`, status);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Indexer main error:", error);
    process.exit(1);
  });
}
