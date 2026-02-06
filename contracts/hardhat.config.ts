import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const FUJI_RPC = process.env.AVALANCHE_FUJI_RPC || "https://api.avax-test.network/ext/bc/C/rpc";
const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      evmVersion: "cancun",
    },
  },
  paths: {
    sources: "./src",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  networks: {
    hardhat: {
      chainId: 43113, // Fork Fuji for local testing
    },
    fuji: {
      url: FUJI_RPC,
      chainId: 43113,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
    mainnet: {
      url: process.env.AVALANCHE_MAINNET_RPC || "https://api.avax.network/ext/bc/C/rpc",
      chainId: 43114,
      accounts: DEPLOYER_KEY ? [DEPLOYER_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      avalancheFujiTestnet: process.env.SNOWTRACE_API_KEY || "",
      avalanche: process.env.SNOWTRACE_API_KEY || "",
    },
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
  },
};

export default config;
