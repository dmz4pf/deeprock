/**
 * E2E Test: EIP-2612 Permit Flow
 *
 * Tests the complete gasless investment flow for wallet users:
 * 1. User generates permit data
 * 2. User signs EIP-712 typed data (simulating MetaMask)
 * 3. Backend verifies signature
 * 4. Relayer submits investWithPermit transaction
 * 5. User receives pool shares without paying gas
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ethers, Wallet, JsonRpcProvider } from 'ethers';
import { PermitService } from '../services/permit.service';
import { RelayerService } from '../services/relayer.service';
import Redis from 'ioredis';

// Test configuration
const RPC_URL = process.env.AVALANCHE_FUJI_RPC || 'https://api.avax-test.network/ext/bc/C/rpc';
const CHAIN_ID = 43113; // Fuji testnet

// Contract addresses from .env
const MOCK_USDC_ADDRESS = process.env.MOCK_USDC_ADDRESS!;
const RWA_POOL_ADDRESS = process.env.RWA_POOL_ADDRESS!;

// ABIs for direct contract interaction
const MOCK_USDC_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function nonces(address) view returns (uint256)',
  'function faucetTo(address, uint256)',
  'function approve(address, uint256) returns (bool)',
  'function allowance(address, address) view returns (uint256)',
];

const RWA_POOL_ABI = [
  'function getPosition(uint256, address) view returns (uint256 shares, uint256 depositedAmount, uint256 lastDepositTime)',
  'function isPoolActive(uint256) view returns (bool)',
];

// Test wallet (derived deterministically for reproducibility)
const TEST_MNEMONIC = 'test test test test test test test test test test test junk';
const TEST_WALLET_INDEX = 5; // Use index 5 to avoid conflicts

describe('EIP-2612 Permit Flow E2E', () => {
  let provider: JsonRpcProvider;
  let testWallet: Wallet;
  let permitService: PermitService;
  let relayerService: RelayerService;
  let redis: Redis;
  let mockUsdc: ethers.Contract;
  let rwaPool: ethers.Contract;

  beforeAll(async () => {
    // Skip if contract addresses not configured
    if (!MOCK_USDC_ADDRESS || !RWA_POOL_ADDRESS) {
      console.warn('Skipping E2E tests: Contract addresses not configured in .env');
      return;
    }

    // Setup provider
    provider = new JsonRpcProvider(RPC_URL, CHAIN_ID);

    // Create deterministic test wallet
    const hdNode = ethers.HDNodeWallet.fromPhrase(TEST_MNEMONIC);
    testWallet = hdNode.deriveChild(TEST_WALLET_INDEX).connect(provider);
    console.log(`Test wallet address: ${testWallet.address}`);

    // Setup services
    permitService = new PermitService(MOCK_USDC_ADDRESS, RPC_URL, CHAIN_ID);

    // Setup Redis mock for rate limiting
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });

    try {
      await redis.connect();
    } catch (e) {
      // Redis not available, tests will handle this
      console.warn('Redis not available, some tests may be skipped');
    }

    // Setup RelayerService
    relayerService = new RelayerService(redis, {
      rpcUrl: RPC_URL,
      chainId: CHAIN_ID,
      privateKey: process.env.RELAYER_PRIVATE_KEY,
      biometricRegistryAddress: process.env.BIOMETRIC_REGISTRY_ADDRESS,
      rwaPoolAddress: RWA_POOL_ADDRESS,
      mockUsdcAddress: MOCK_USDC_ADDRESS,
    });

    // Setup contract interfaces
    mockUsdc = new ethers.Contract(MOCK_USDC_ADDRESS, MOCK_USDC_ABI, provider);
    rwaPool = new ethers.Contract(RWA_POOL_ADDRESS, RWA_POOL_ABI, provider);
  });

  afterAll(async () => {
    if (redis) {
      await redis.quit();
    }
  });

  describe('PermitService', () => {
    it('should get nonce for address', async () => {
      if (!MOCK_USDC_ADDRESS) return;

      const nonce = await permitService.getNonce(testWallet.address);
      expect(nonce).toBeTypeOf('bigint');
      expect(nonce).toBeGreaterThanOrEqual(0n);
    });

    it('should get domain separator', async () => {
      if (!MOCK_USDC_ADDRESS) return;

      const domainSeparator = await permitService.getDomainSeparator();
      expect(domainSeparator).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should get token name', async () => {
      if (!MOCK_USDC_ADDRESS) return;

      const name = await permitService.getTokenName();
      expect(name).toBe('Mock USDC');
    });

    it('should generate valid permit data', async () => {
      if (!MOCK_USDC_ADDRESS || !RWA_POOL_ADDRESS) return;

      const amount = BigInt(100) * BigInt(10 ** 6); // 100 USDC
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour

      const { data, typedData } = await permitService.generatePermitData(
        testWallet.address,
        RWA_POOL_ADDRESS,
        amount,
        deadline
      );

      // Verify data structure
      expect(data.owner).toBe(testWallet.address);
      expect(data.spender).toBe(RWA_POOL_ADDRESS);
      expect(data.value).toBe(amount);
      expect(data.deadline).toBe(deadline);
      expect(data.nonce).toBeTypeOf('bigint');

      // Verify typed data structure (EIP-712)
      expect(typedData.domain.name).toBe('Mock USDC');
      expect(typedData.domain.version).toBe('1');
      expect(typedData.domain.chainId).toBe(CHAIN_ID);
      expect(typedData.domain.verifyingContract).toBe(MOCK_USDC_ADDRESS);
      expect(typedData.primaryType).toBe('Permit');
    });

    it('should sign and verify permit signature', async () => {
      if (!MOCK_USDC_ADDRESS || !RWA_POOL_ADDRESS) return;

      const amount = BigInt(100) * BigInt(10 ** 6);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const { typedData } = await permitService.generatePermitData(
        testWallet.address,
        RWA_POOL_ADDRESS,
        amount,
        deadline
      );

      // Sign with test wallet (simulating MetaMask)
      // NOTE: ethers.js signTypedData does NOT want EIP712Domain in types (it auto-generates it),
      // but MetaMask's eth_signTypedData_v4 REQUIRES it. So we strip it here for the test.
      const { EIP712Domain, ...typesWithoutDomain } = typedData.types;
      const signature = await testWallet.signTypedData(
        typedData.domain,
        typesWithoutDomain,
        typedData.message
      );

      expect(signature).toMatch(/^0x[a-fA-F0-9]+$/);

      // Verify signature
      const isValid = permitService.verifySignature(
        typedData,
        signature,
        testWallet.address
      );
      expect(isValid).toBe(true);

      // Verify wrong address fails
      const isInvalid = permitService.verifySignature(
        typedData,
        signature,
        '0x0000000000000000000000000000000000000001'
      );
      expect(isInvalid).toBe(false);
    });

    it('should parse signature into v, r, s components', async () => {
      if (!MOCK_USDC_ADDRESS || !RWA_POOL_ADDRESS) return;

      const amount = BigInt(100) * BigInt(10 ** 6);
      const { typedData } = await permitService.generatePermitData(
        testWallet.address,
        RWA_POOL_ADDRESS,
        amount
      );

      // Strip EIP712Domain for ethers.js signTypedData (it auto-generates it)
      const { EIP712Domain, ...typesWithoutDomain } = typedData.types;
      const signature = await testWallet.signTypedData(
        typedData.domain,
        typesWithoutDomain,
        typedData.message
      );

      const { v, r, s } = permitService.parseSignature(signature);

      expect(v).toBeTypeOf('number');
      expect(v === 27 || v === 28).toBe(true);
      expect(r).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(s).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should detect expired deadline', () => {
      const pastDeadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      expect(permitService.isDeadlineExpired(pastDeadline)).toBe(true);

      const futureDeadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      expect(permitService.isDeadlineExpired(futureDeadline)).toBe(false);
    });
  });

  describe('RelayerService Integration', () => {
    it('should have RWA Pool configured', () => {
      expect(relayerService.hasRwaPool()).toBe(true);
    });

    it('should have MockUSDC configured', () => {
      expect(relayerService.hasMockUsdc()).toBe(true);
    });

    it('should get relayer status', async () => {
      const status = await relayerService.getStatus();

      expect(status.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(parseFloat(status.balance)).toBeGreaterThan(0);
      expect(status.chainId).toBe(CHAIN_ID);
    });

    it('should get permit nonce from contract', async () => {
      const nonce = await relayerService.getPermitNonce(testWallet.address);
      expect(nonce).toBeTypeOf('bigint');
    });
  });

  describe('Full Permit Investment Flow', () => {
    it('should complete gasless investment with permit', async () => {
      // Skip if Redis not available (needed for rate limiting)
      if (!redis.status || redis.status !== 'ready') {
        console.warn('Skipping: Redis not available');
        return;
      }

      // Check if pool 1 is active
      const isActive = await rwaPool.isPoolActive(1);
      if (!isActive) {
        console.warn('Skipping: Pool 1 is not active');
        return;
      }

      // Step 1: Ensure test wallet has USDC
      const balance = await mockUsdc.balanceOf(testWallet.address);
      const investAmount = BigInt(100) * BigInt(10 ** 6); // 100 USDC

      if (balance < investAmount) {
        console.log('Minting test USDC to test wallet...');
        await relayerService.mintTestUsdc(testWallet.address, investAmount * 2n);

        // Wait for mint to confirm
        await new Promise(resolve => setTimeout(resolve, 3000));

        const newBalance = await mockUsdc.balanceOf(testWallet.address);
        expect(newBalance).toBeGreaterThanOrEqual(investAmount);
      }

      // Step 2: Get position before investment
      const positionBefore = await rwaPool.getPosition(1, testWallet.address);
      const sharesBefore = positionBefore[0];

      // Step 3: Generate permit data
      const deadline = Math.floor(Date.now() / 1000) + 3600;
      const { typedData } = await permitService.generatePermitData(
        testWallet.address,
        RWA_POOL_ADDRESS,
        investAmount,
        deadline
      );

      // Step 4: Sign permit (simulating MetaMask)
      // Strip EIP712Domain for ethers.js signTypedData (it auto-generates it)
      const { EIP712Domain, ...typesWithoutDomain } = typedData.types;
      const signature = await testWallet.signTypedData(
        typedData.domain,
        typesWithoutDomain,
        typedData.message
      );

      // Step 5: Parse signature
      const { v, r, s } = permitService.parseSignature(signature);

      // Step 6: Submit via relayer
      console.log('Submitting permit investment...');
      const result = await relayerService.submitInvestmentWithPermit(
        1, // Pool ID
        testWallet.address,
        investAmount,
        deadline,
        v,
        r,
        s
      );

      // Step 7: Verify transaction result
      expect(result.status).toBe('success');
      expect(result.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(parseInt(result.gasUsed)).toBeGreaterThan(0);

      console.log(`Investment successful! TxHash: ${result.txHash}`);

      // Step 8: Verify shares were issued
      const positionAfter = await rwaPool.getPosition(1, testWallet.address);
      const sharesAfter = positionAfter[0];
      expect(sharesAfter).toBeGreaterThan(sharesBefore);

      console.log(`Shares before: ${sharesBefore}, after: ${sharesAfter}`);
    }, 120000); // 2 minute timeout for blockchain operations
  });

  describe('Error Handling', () => {
    it('should reject expired permit deadline', async () => {
      if (!redis.status || redis.status !== 'ready') return;

      const expiredDeadline = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      await expect(
        relayerService.submitInvestmentWithPermit(
          1,
          testWallet.address,
          BigInt(100) * BigInt(10 ** 6),
          expiredDeadline,
          27,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          '0x0000000000000000000000000000000000000000000000000000000000000000'
        )
      ).rejects.toThrow('Permit deadline has expired');
    });

    it('should reject invalid signature', async () => {
      if (!redis.status || redis.status !== 'ready') return;

      const deadline = Math.floor(Date.now() / 1000) + 3600;

      // This will fail at the contract level due to invalid signature
      await expect(
        relayerService.submitInvestmentWithPermit(
          1,
          testWallet.address,
          BigInt(100) * BigInt(10 ** 6),
          deadline,
          27,
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          '0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321'
        )
      ).rejects.toThrow();
    });
  });
});
