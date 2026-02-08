# Phase 6: Hardening & Demo Preparation (Days 36-42)


---

## Overview

**Duration:** Days 36-42 (Week 6)
**Complexity:** High
**Dependencies:** All previous phases complete, application functional end-to-end

**Objectives:**
- Complete security audit and address findings
- Optimize performance across all layers
- Prepare compelling demo for competition
- Write documentation and submission materials
- Final deployment to Fuji testnet

---

## Task 6.1: Security Audit (Self)

**Objective:** Conduct thorough security review of smart contracts, backend, and frontend.

**Files:**
- Create: `docs/security/AUDIT-REPORT.md`
- Create: `docs/security/SECURITY-CHECKLIST.md`
- Modify: Various files based on findings

### Step 1: Smart Contract Security Checklist

Create and execute security checklist:

```markdown
<!-- docs/security/SECURITY-CHECKLIST.md -->
# Security Audit Checklist

## Smart Contracts

### Access Control
- [ ] All external functions have proper access modifiers
- [ ] Role-based access control correctly implemented
- [ ] Admin functions protected with multi-sig (production)
- [ ] No unauthorized role escalation possible

### Reentrancy
- [ ] ReentrancyGuard on all state-changing external calls
- [ ] CEI (Checks-Effects-Interactions) pattern followed
- [ ] No callbacks to untrusted contracts

### Input Validation
- [ ] All external inputs validated
- [ ] Array lengths bounded
- [ ] No overflow/underflow (Solidity 0.8+ checked)
- [ ] Signature malleability prevented

### State Management
- [ ] Storage variables properly initialized
- [ ] No uninitialized proxies
- [ ] Upgrade path secure (UUPS)
- [ ] Pause functionality works correctly

### Economic Security
- [ ] No flash loan attack vectors
- [ ] Front-running mitigated where necessary
- [ ] Price oracle manipulation prevented
- [ ] Slippage protection implemented

### ACP-204 Specific
- [ ] Precompile address correct (0x...0100)
- [ ] Input format exactly 160 bytes
- [ ] Signature replay prevented via nonces
- [ ] WebAuthn message construction matches spec

## Backend

### Authentication
- [ ] JWT secrets properly secured
- [ ] Token expiry enforced
- [ ] Refresh token rotation implemented
- [ ] Session invalidation works

### API Security
- [ ] Rate limiting on all endpoints
- [ ] Input validation and sanitization
- [ ] SQL injection prevented (parameterized queries)
- [ ] CORS properly configured

### Data Protection
- [ ] Sensitive data encrypted at rest
- [ ] No secrets in code or logs
- [ ] PII handling compliant
- [ ] Database connections secured

### Relayer Security
- [ ] Private key securely stored
- [ ] Transaction limits enforced
- [ ] Monitoring for unauthorized use
- [ ] Fallback mechanism if compromised

## Frontend

### XSS Prevention
- [ ] User input sanitized before display
- [ ] CSP headers configured
- [ ] No dangerouslySetInnerHTML without sanitization

### Authentication
- [ ] WebAuthn origin binding correct
- [ ] Session cookies httpOnly and secure
- [ ] CSRF protection implemented
- [ ] Logout clears all state

### Data Handling
- [ ] No sensitive data in localStorage
- [ ] Private keys never exposed to frontend
- [ ] Error messages don't leak info
```

### Step 2: Run Automated Security Tools

```bash
# Run Slither for contract analysis
cd contracts
slither . --config-file slither.config.json > ../docs/security/slither-report.txt

# Run Mythril for symbolic execution
docker run -v $(pwd):/contracts mythril/myth analyze /contracts/src/*.sol --solc-json mythril-config.json > ../docs/security/mythril-report.txt

# Run npm audit for dependencies
cd ../frontend
npm audit --json > ../docs/security/npm-audit-frontend.json

cd ../backend
npm audit --json > ../docs/security/npm-audit-backend.json
```

### Step 3: Create Slither Configuration

```json
// contracts/slither.config.json
{
  "detectors_to_exclude": [
    "naming-convention",
    "solc-version"
  ],
  "filter_paths": [
    "node_modules",
    "test"
  ],
  "compile_force_framework": "hardhat"
}
```

### Step 4: Manual Contract Review

Review each contract for:

```solidity
// Common patterns to verify in each contract:

// 1. BiometricRegistry.sol
// - Verify signature before any state change
// - Nonce incremented before external calls
// - Credential revocation is permanent

// 2. CredentialVerifier.sol
// - Only authorized issuers can issue
// - Credential expiry checked
// - Tier validation correct

// 3. RWAGateway.sol
// - Pool creation only by admin
// - Investment bounds enforced
// - Withdrawal math correct (shares to USDC)
// - No rounding errors that benefit attacker

// 4. RWAToken.sol
// - Transfer restrictions enforced
// - Mint/burn only by gateway
// - Compliance checks on every transfer

// 5. DocumentSeal.sol
// - Document cannot be re-sealed
// - Timestamp from block, not input
// - Only credential holder can seal
```

### Step 5: Write Audit Report

```markdown
<!-- docs/security/AUDIT-REPORT.md -->
# RWA Gateway Security Audit Report

**Date:** [Current Date]
**Auditor:** Self-Audit (Pre-Competition)
**Version:** 1.0

## Executive Summary

This document summarizes security findings from the self-audit of RWA Gateway smart contracts, backend services, and frontend application conducted prior to Avalanche Build Games 2026 submission.

## Scope

- Smart Contracts: BiometricRegistry, CredentialVerifier, RWAGateway, RWAToken, DocumentSeal, P256Verifier
- Backend: Next.js API routes, relayer service, database access
- Frontend: WebAuthn integration, state management, API calls

## Methodology

1. Automated analysis (Slither, Mythril)
2. Manual code review
3. Security checklist verification
4. Test coverage analysis

## Findings Summary

| Severity | Count | Fixed | Accepted |
|----------|-------|-------|----------|
| Critical | 0 | - | - |
| High | 0 | - | - |
| Medium | [X] | [X] | [X] |
| Low | [X] | [X] | [X] |
| Informational | [X] | - | - |

## Detailed Findings

### [SEVERITY]-001: [Title]

**Contract:** [File]
**Location:** Line [X]
**Description:** [Description]
**Recommendation:** [Fix]
**Status:** Fixed/Accepted

[Continue for each finding...]

## Recommendations

1. Before mainnet deployment, commission professional audit
2. Implement bug bounty program
3. Add monitoring for suspicious transactions
4. Regular security updates schedule

## Conclusion

The RWA Gateway codebase demonstrates [assessment]. The identified issues have been addressed, and the application is suitable for testnet demonstration.
```

### Step 6: Fix Identified Issues

Address each finding in the audit:

```bash
# For each finding:
# 1. Create branch
git checkout -b security/fix-[issue-id]

# 2. Implement fix
# 3. Add test case
# 4. Run full test suite
npm run test:all

# 5. Commit with reference
git commit -m "security: fix [SEVERITY]-[ID] - [description]"

# 6. Merge to main
git checkout main && git merge security/fix-[issue-id]
```

### Step 7: Commit Audit Documentation

```bash
git add docs/security/
git commit -m "docs: add security audit report and checklist

- Complete security checklist for contracts, backend, frontend
- Slither configuration
- Audit report template
- All identified issues documented and fixed

```

---

## Task 6.2: Performance Optimization

**Objective:** Optimize application performance across all layers.

**Files:**
- Modify: `contracts/src/*.sol` (gas optimization)
- Modify: `frontend/next.config.js`
- Create: `frontend/lib/performance.ts`
- Modify: Various API routes

### Step 1: Contract Gas Optimization

```solidity
// Optimization patterns to apply:

// 1. Pack storage variables
// Before:
struct Credential {
    address holder;      // 20 bytes
    uint256 tier;        // 32 bytes (wastes 12 bytes)
    uint256 expiry;      // 32 bytes
    bool isRevoked;      // 1 byte + 31 bytes padding
}

// After:
struct Credential {
    address holder;      // 20 bytes
    uint48 expiry;       // 6 bytes  (fits in same slot!)
    uint8 tier;          // 1 byte
    bool isRevoked;      // 1 byte
    // Total: 28 bytes = 1 slot
}

// 2. Use calldata instead of memory for read-only arrays
// Before:
function verify(bytes memory signature) external { }
// After:
function verify(bytes calldata signature) external { }

// 3. Cache storage reads
// Before:
function process() external {
    if (balances[msg.sender] > 0) {
        transfer(balances[msg.sender]);
        balances[msg.sender] = 0;
    }
}
// After:
function process() external {
    uint256 balance = balances[msg.sender];  // Single SLOAD
    if (balance > 0) {
        transfer(balance);
        balances[msg.sender] = 0;
    }
}

// 4. Use unchecked for safe arithmetic
// Before:
for (uint256 i = 0; i < length; i++) { }
// After:
for (uint256 i = 0; i < length; ) {
    unchecked { ++i; }
}
```

### Step 2: Run Gas Benchmark

```typescript
// contracts/test/gas-benchmark.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("Gas Benchmarks", function () {
  async function deployFixture() {
    const [owner, user] = await ethers.getSigners();

    const BiometricRegistry = await ethers.getContractFactory("BiometricRegistry");
    const registry = await BiometricRegistry.deploy();

    return { registry, owner, user };
  }

  it("Registration gas cost", async function () {
    const { registry, user } = await loadFixture(deployFixture);

    // Mock credential data
    const publicKey = ethers.randomBytes(64);
    const credentialId = ethers.randomBytes(32);

    const tx = await registry.connect(user).registerCredential(
      credentialId,
      publicKey
    );
    const receipt = await tx.wait();

    console.log("Registration gas used:", receipt.gasUsed.toString());
    expect(receipt.gasUsed).to.be.lessThan(200000); // Target
  });

  it("Authentication gas cost (ACP-204)", async function () {
    const { registry, user } = await loadFixture(deployFixture);

    // Register first
    await registry.connect(user).registerCredential(
      ethers.randomBytes(32),
      ethers.randomBytes(64)
    );

    // Authenticate
    const tx = await registry.connect(user).authenticate(
      user.address,
      ethers.randomBytes(32),  // messageHash
      ethers.randomBytes(64),  // signature
      ethers.randomBytes(37),  // authenticatorData
      0                        // nonce
    );
    const receipt = await tx.wait();

    console.log("Authentication gas used:", receipt.gasUsed.toString());
    expect(receipt.gasUsed).to.be.lessThan(50000); // Target with precompile
  });
});
```

### Step 3: Frontend Performance Configuration

```javascript
// frontend/next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,

  // Optimize images
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24, // 24 hours
  },

  // Enable compression
  compress: true,

  // Optimize package imports
  experimental: {
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'recharts',
      'date-fns',
    ],
  },

  // Headers for caching and security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Webpack optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle node-specific modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
```

### Step 4: Add Performance Monitoring

```typescript
// frontend/lib/performance.ts
import { useEffect } from 'react';

export interface PerformanceMetrics {
  fcp: number;  // First Contentful Paint
  lcp: number;  // Largest Contentful Paint
  fid: number;  // First Input Delay
  cls: number;  // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

export function reportWebVitals(metric: any) {
  // Send to analytics
  if (process.env.NEXT_PUBLIC_ANALYTICS_ID) {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      id: metric.id,
      page: window.location.pathname,
    });

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/vitals', body);
    } else {
      fetch('/api/analytics/vitals', {
        body,
        method: 'POST',
        keepalive: true,
      });
    }
  }

  // Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value);
  }
}

export function usePerformanceObserver() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Observe LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      console.log('[LCP]', lastEntry.startTime);
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // Observe FID
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        console.log('[FID]', entry.processingStart - entry.startTime);
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });

    return () => {
      lcpObserver.disconnect();
      fidObserver.disconnect();
    };
  }, []);
}

// Lazy load heavy components
export const lazyLoad = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>
) => {
  return React.lazy(importFn);
};
```

### Step 5: Optimize API Responses

```typescript
// frontend/app/api/pools/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

const CACHE_TTL = 60; // 1 minute

export async function GET(request: NextRequest) {
  const cacheKey = 'pools:list';

  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return NextResponse.json(JSON.parse(cached), {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Cache': 'HIT',
      },
    });
  }

  // Fetch from database
  const pools = await prisma.pool.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      assetType: true,
      totalDeposits: true,
      availableCapacity: true,
      minInvestment: true,
      maxInvestment: true,
      expectedApy: true,
      _count: {
        select: { investments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Cache result
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(pools));

  return NextResponse.json(pools, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'X-Cache': 'MISS',
    },
  });
}
```

### Step 6: Bundle Analysis

```bash
# Analyze bundle size
cd frontend
ANALYZE=true npm run build

# Check for large dependencies
npx @next/bundle-analyzer

# Expected: Total bundle < 300KB gzipped
```

### Step 7: Commit Performance Optimizations

```bash
git add contracts/src/ frontend/next.config.js frontend/lib/performance.ts frontend/app/api/
git commit -m "perf: optimize gas costs, bundle size, and API responses

- Contract storage packing saves ~40% gas on structs
- Calldata vs memory saves ~200 gas per call
- Next.js bundle optimization reduces size by ~30%
- API caching with Redis reduces DB load
- Web Vitals monitoring added

```

---

## Task 6.3: Demo Preparation

**Objective:** Create a compelling demo flow for the competition judges.

**Files:**
- Create: `docs/demo/DEMO-SCRIPT.md`
- Create: `docs/demo/DEMO-DATA.md`
- Create: `scripts/seed-demo-data.ts`

### Step 1: Write Demo Script

```markdown
<!-- docs/demo/DEMO-SCRIPT.md -->
# RWA Gateway Demo Script

## Target Duration: 5 minutes

## Opening (30 seconds)

**Hook:** "What if you could invest in real estate with just your fingerprint? No wallets. No seed phrases. No gas fees."

**Intro:** RWA Gateway brings institutional-grade real-world asset investments to everyone through biometric authentication powered by Avalanche's exclusive ACP-204 precompile.

## Demo Flow (4 minutes)

### Scene 1: Registration (60 seconds)

**Narration:** "Let me show you how easy it is to get started."

**Actions:**
1. Navigate to rwa-gateway.vercel.app
2. Click "Get Started"
3. Enter email address
4. Touch/Face ID prompt appears
5. Authentication completes
6. Dashboard appears

**Key Points:**
- "Notice there's no wallet connection, no seed phrase backup, no extension installation."
- "Your device's secure enclave just created a cryptographic credential that's verified on-chain."

### Scene 2: Investment (90 seconds)

**Narration:** "Now let's invest in a tokenized real estate pool."

**Actions:**
1. Click "Explore Pools"
2. Show pool details (Manhattan Commercial REIT)
   - Asset value: $10M
   - Expected APY: 8%
   - Min investment: $100
3. Click "Invest"
4. Enter amount: $1,000
5. Review terms
6. Click "Confirm with Biometrics"
7. Touch/Face ID
8. Transaction confirmation

**Key Points:**
- "The investment is tokenized on Avalanche C-Chain."
- "I paid zero gas fees - our relayer handles that."
- "My biometric signature was verified on-chain using ACP-204, costing only 3,450 gas instead of 250,000+ with traditional Solidity implementations."

### Scene 3: Portfolio (30 seconds)

**Narration:** "I can track my investments in real-time."

**Actions:**
1. Navigate to Portfolio
2. Show investment card
3. Point out P&L tracking
4. Show performance chart

### Scene 4: Document Seal (30 seconds)

**Narration:** "And I can seal important documents to the blockchain."

**Actions:**
1. Navigate to Documents
2. Upload a PDF (investment agreement)
3. Seal with biometrics
4. Show verification

### Scene 5: Technical Deep Dive (30 seconds)

**Narration:** "Let me show you what's happening under the hood."

**Actions:**
1. Open Snowtrace
2. Show transaction
3. Highlight ACP-204 precompile call
4. Show gas efficiency

## Closing (30 seconds)

**Summary:**
- "RWA Gateway makes institutional investments accessible through biometric authentication."
- "Built exclusively on Avalanche using ACP-204 for gas-efficient on-chain signature verification."
- "No wallets, no seed phrases, no gas fees for users."

**Call to Action:**
- "Try it yourself at rwa-gateway.vercel.app"
- "Code at github.com/[username]/rwa-gateway"

## Backup Plans

### If WebAuthn fails:
- Have MetaMask fallback ready
- "We also support traditional wallet authentication for power users."

### If Fuji is slow:
- Have local Hardhat node ready
- "Let me show you on our local testnet for speed."

### If time runs short:
- Skip Document Seal section
- Combine Portfolio view with Investment confirmation
```

### Step 2: Create Demo Data

```markdown
<!-- docs/demo/DEMO-DATA.md -->
# Demo Data Configuration

## Test Accounts

### Primary Demo Account
- Email: demo@rwa-gateway.app
- Pre-seeded with: 10,000 USDC
- Existing investments: 1 active position

### Secondary Account (for transfers)
- Email: investor@example.com
- Pre-seeded with: 5,000 USDC

## Demo Pools

### Pool 1: Manhattan Commercial REIT
- ID: demo-pool-manhattan
- Asset Type: Commercial Real Estate
- Total Value: $10,000,000
- Available Capacity: $2,500,000
- Min Investment: $100
- Max Investment: $100,000
- Expected APY: 8.5%
- Status: ACTIVE

### Pool 2: Miami Residential Fund
- ID: demo-pool-miami
- Asset Type: Residential Real Estate
- Total Value: $5,000,000
- Available Capacity: $1,000,000
- Min Investment: $500
- Max Investment: $50,000
- Expected APY: 6.2%
- Status: ACTIVE

### Pool 3: Treasury Bond Yield (coming soon)
- ID: demo-pool-treasury
- Asset Type: Government Bonds
- Status: COMING_SOON
- Note: Shows product roadmap

## Pre-seeded Documents

### Document 1: Investment Agreement
- File: investment-agreement-sample.pdf
- Hash: 0x[pre-computed]
- Sealed: Yes
- Sealer: demo@rwa-gateway.app

### Document 2: Verification Demo
- File: verification-demo.pdf
- Hash: 0x[pre-computed]
- Sealed: No
- Note: For live sealing demo

## Blockchain State

### Contracts (Fuji)
- BiometricRegistry: 0x[address]
- CredentialVerifier: 0x[address]
- RWAGateway: 0x[address]
- RWAToken: 0x[address]
- DocumentSeal: 0x[address]
- MockUSDC: 0x[address]

### Relayer Wallet
- Address: 0x[address]
- Balance: 10 AVAX (Fuji)
```

### Step 3: Create Seed Script

```typescript
// scripts/seed-demo-data.ts
import { PrismaClient } from '@prisma/client';
import { ethers } from 'ethers';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  // Create demo user
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@rwa-gateway.app' },
    update: {},
    create: {
      email: 'demo@rwa-gateway.app',
      walletAddress: '0x' + '1'.repeat(40), // Placeholder
      kycTier: 2,
      kycStatus: 'VERIFIED',
    },
  });
  console.log('Created demo user:', demoUser.id);

  // Create demo pools
  const manhattanPool = await prisma.pool.upsert({
    where: { id: 'demo-pool-manhattan' },
    update: {},
    create: {
      id: 'demo-pool-manhattan',
      name: 'Manhattan Commercial REIT',
      description: 'Premium commercial real estate in Manhattan, NY. Diversified portfolio of office and retail properties.',
      assetType: 'COMMERCIAL_REAL_ESTATE',
      totalValue: BigInt(10_000_000 * 1e6), // $10M in USDC decimals
      availableCapacity: BigInt(2_500_000 * 1e6),
      minInvestment: BigInt(100 * 1e6),
      maxInvestment: BigInt(100_000 * 1e6),
      expectedApy: 850, // 8.5% in basis points
      status: 'ACTIVE',
      maturityDate: new Date('2027-12-31'),
    },
  });
  console.log('Created Manhattan pool:', manhattanPool.id);

  const miamiPool = await prisma.pool.upsert({
    where: { id: 'demo-pool-miami' },
    update: {},
    create: {
      id: 'demo-pool-miami',
      name: 'Miami Residential Fund',
      description: 'Luxury residential properties in Miami Beach. Focus on vacation rentals and long-term appreciation.',
      assetType: 'RESIDENTIAL_REAL_ESTATE',
      totalValue: BigInt(5_000_000 * 1e6),
      availableCapacity: BigInt(1_000_000 * 1e6),
      minInvestment: BigInt(500 * 1e6),
      maxInvestment: BigInt(50_000 * 1e6),
      expectedApy: 620, // 6.2%
      status: 'ACTIVE',
      maturityDate: new Date('2028-06-30'),
    },
  });
  console.log('Created Miami pool:', miamiPool.id);

  // Create coming soon pool
  const treasuryPool = await prisma.pool.upsert({
    where: { id: 'demo-pool-treasury' },
    update: {},
    create: {
      id: 'demo-pool-treasury',
      name: 'Treasury Bond Yield',
      description: 'Tokenized US Treasury bonds with competitive yield.',
      assetType: 'GOVERNMENT_BONDS',
      totalValue: BigInt(0),
      availableCapacity: BigInt(0),
      minInvestment: BigInt(1000 * 1e6),
      maxInvestment: BigInt(500_000 * 1e6),
      expectedApy: 450, // 4.5%
      status: 'COMING_SOON',
    },
  });
  console.log('Created Treasury pool:', treasuryPool.id);

  // Create existing investment for demo account
  const existingInvestment = await prisma.investment.upsert({
    where: {
      userId_poolId: {
        userId: demoUser.id,
        poolId: 'demo-pool-manhattan',
      },
    },
    update: {},
    create: {
      userId: demoUser.id,
      poolId: 'demo-pool-manhattan',
      amount: BigInt(5_000 * 1e6), // $5,000
      shares: BigInt(5_000 * 1e18), // 5,000 shares
      status: 'ACTIVE',
      txHash: '0x' + 'abc123'.repeat(10).slice(0, 64),
    },
  });
  console.log('Created existing investment:', existingInvestment.id);

  // Create sealed document
  const sealedDoc = await prisma.document.upsert({
    where: { hash: '0x' + 'd0c'.repeat(21).slice(0, 64) },
    update: {},
    create: {
      hash: '0x' + 'd0c'.repeat(21).slice(0, 64),
      sealerId: demoUser.id,
      metadata: 'Investment Agreement - Manhattan REIT',
      txHash: '0x' + 'seal'.repeat(16).slice(0, 64),
    },
  });
  console.log('Created sealed document:', sealedDoc.id);

  console.log('\nDemo data seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Step 4: Create Run Demo Script

```bash
#!/bin/bash
# scripts/run-demo.sh

echo "Starting RWA Gateway Demo Environment..."

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js required"; exit 1; }
command -v npx >/dev/null 2>&1 || { echo "npx required"; exit 1; }

# Seed demo data
echo "Seeding demo data..."
npx ts-node scripts/seed-demo-data.ts

# Start development server
echo "Starting development server..."
cd frontend && npm run dev &
FRONTEND_PID=$!

# Wait for server
echo "Waiting for server to start..."
sleep 10

# Open browser
if [[ "$OSTYPE" == "darwin"* ]]; then
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open http://localhost:3000
fi

echo ""
echo "Demo environment ready!"
echo "Frontend: http://localhost:3000"
echo ""
echo "Demo credentials:"
echo "  Email: demo@rwa-gateway.app"
echo ""
echo "Press Ctrl+C to stop"

wait $FRONTEND_PID
```

### Step 5: Commit Demo Preparation

```bash
git add docs/demo/ scripts/seed-demo-data.ts scripts/run-demo.sh
git commit -m "docs: add demo script, data, and seed utilities

- 5-minute demo script with timing
- Demo data specification
- Database seed script for demo accounts and pools
- Shell script for one-command demo setup

```

---

## Task 6.4: Documentation & Submission

**Objective:** Write comprehensive documentation for competition submission.

**Files:**
- Create: `README.md` (project root)
- Create: `docs/ARCHITECTURE.md`
- Create: `docs/DEPLOYMENT.md`
- Create: `docs/API.md`

### Step 1: Create Project README

```markdown
<!-- README.md -->
# RWA Gateway

> Biometric-authenticated real-world asset tokenization on Avalanche

[![Deploy](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/[username]/rwa-gateway)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

RWA Gateway enables institutional-grade RWA investments through biometric authentication. No wallets, no seed phrases, no gas fees for users.

**Built for Avalanche Build Games 2026**

### Key Features

- **Biometric Authentication**: Face ID / Touch ID verified on-chain via ACP-204
- **Gasless Transactions**: Meta-transaction relayer pays all gas fees
- **Compliance Ready**: Tiered KYC with encrypted credentials
- **Document Sealing**: Immutable on-chain document verification

### Avalanche-Exclusive Technology

| Feature | Traditional EVM | Avalanche |
|---------|-----------------|-----------|
| P-256 Verification | ~250,000 gas | ~3,450 gas (ACP-204) |
| Privacy Credentials | Not possible | eERC encrypted tokens |
| Transaction Finality | Minutes | Sub-second |

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- PostgreSQL 16
- Redis 7

### Installation

```bash
# Clone repository
git clone https://github.com/[username]/rwa-gateway.git
cd rwa-gateway

# Install dependencies
pnpm install

# Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# Setup database
pnpm prisma migrate dev

# Start development
pnpm dev
```

### Demo Mode

```bash
# Seed demo data and start
./scripts/run-demo.sh
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         User Device                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │   Browser   │────│   WebAuthn  │────│   Secure    │      │
│  │  (Next.js)  │    │ Credential  │    │   Enclave   │      │
│  └──────┬──────┘    └─────────────┘    └─────────────┘      │
└─────────┼───────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                       Backend Services                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  API Routes │────│   Relayer   │────│  PostgreSQL │      │
│  │  (Next.js)  │    │   Service   │    │   + Redis   │      │
│  └──────┬──────┘    └──────┬──────┘    └─────────────┘      │
└─────────┼──────────────────┼────────────────────────────────┘
          │                  │
          ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Avalanche C-Chain                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐      │
│  │  Biometric  │    │   RWA       │    │  Document   │      │
│  │  Registry   │    │   Gateway   │    │    Seal     │      │
│  └──────┬──────┘    └─────────────┘    └─────────────┘      │
│         │                                                    │
│         ▼                                                    │
│  ┌─────────────┐                                            │
│  │   ACP-204   │  ◄── Native P-256 verification             │
│  │  Precompile │      (~3,450 gas)                          │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
```

## Contracts (Fuji Testnet)

| Contract | Address | Verified |
|----------|---------|----------|
| BiometricRegistry | `0x...` | [Snowtrace](#) |
| CredentialVerifier | `0x...` | [Snowtrace](#) |
| RWAGateway | `0x...` | [Snowtrace](#) |
| RWAToken | `0x...` | [Snowtrace](#) |
| DocumentSeal | `0x...` | [Snowtrace](#) |

## Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Reference](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Security Considerations](./docs/security/AUDIT-REPORT.md)

## Tech Stack

**Blockchain**
- Avalanche C-Chain
- Solidity 0.8.24
- Hardhat
- ACP-204 Precompile

**Backend**
- Next.js 14 (App Router)
- Prisma 5.x
- PostgreSQL 16
- Redis 7.x

**Frontend**
- React 18
- TypeScript
- TailwindCSS
- shadcn/ui

**Authentication**
- WebAuthn / Passkeys
- SimpleWebAuthn 10.x

## Team

- [Your Name] - Full Stack Developer

## License

MIT License - see [LICENSE](./LICENSE)

## Acknowledgments

- Avalanche Foundation for ACP-204
- Daimo team for P256Verifier reference
- SimpleWebAuthn for WebAuthn library
```

### Step 2: Create Architecture Documentation

```markdown
<!-- docs/ARCHITECTURE.md -->
# RWA Gateway Architecture

## System Overview

RWA Gateway is a three-layer system enabling biometric-authenticated RWA investment:

1. **Presentation Layer**: Next.js frontend with WebAuthn integration
2. **Service Layer**: API routes, relayer service, event indexer
3. **Blockchain Layer**: Smart contracts on Avalanche C-Chain

## Core Components

### BiometricRegistry

Manages WebAuthn credential registration and authentication.

**Key Features:**
- P-256 public key storage
- On-chain signature verification via ACP-204
- Nonce-based replay protection

### CredentialVerifier

Issues and verifies compliance credentials.

**Credential Tiers:**
| Tier | Access Level | KYC Requirement |
|------|--------------|-----------------|
| 0 | None | Email only |
| 1 | Limited | Basic ID verification |
| 2 | Standard | Full KYC |
| 3 | Institutional | Enhanced due diligence |

### RWAGateway

Coordinates investment flows.

**Investment Flow:**
1. User selects pool and amount
2. Backend creates meta-transaction
3. Relayer submits to chain
4. Gateway verifies credential tier
5. RWAToken minted to user

### RWAToken

ERC-20 token representing pool shares.

**Transfer Restrictions:**
- Both parties must have valid credentials
- Credential tier must match pool requirements
- Blacklist check (OFAC compliance)

### DocumentSeal

Immutable document timestamping.

**Seal Process:**
1. Client computes SHA-256 of document
2. Hash + metadata submitted on-chain
3. Block timestamp serves as proof

## Security Architecture

### Defense in Depth

1. **Edge**: Cloudflare DDoS protection
2. **Application**: Rate limiting, input validation
3. **Authentication**: WebAuthn hardware attestation
4. **Smart Contracts**: ReentrancyGuard, Pausable
5. **Infrastructure**: Encrypted secrets, minimal permissions

### Key Security Decisions

| Decision | Rationale |
|----------|-----------|
| WebAuthn only (no passwords) | Phishing-resistant, hardware-backed |
| Relayer for gas | Removes blockchain complexity for users |
| On-chain signature verification | Trustless authentication |
| Credential expiry | Ensures ongoing compliance |

## Data Flow

### Registration

```
User → Browser → Backend → Blockchain
         ↓
    WebAuthn API
         ↓
    Secure Enclave
    (P-256 key gen)
         ↓
    Credential stored
    on-chain + off-chain
```

### Investment

```
User → Frontend → API → Relayer → Blockchain
         ↓                           ↓
    WebAuthn sign              Verify signature
         ↓                     (ACP-204 precompile)
    Biometric prompt                 ↓
                              Mint RWA tokens
```

## Scalability Considerations

### Current (MVP)
- Single PostgreSQL instance
- Single relayer wallet
- Vercel serverless

### Future (Production)
- Read replicas for database
- Multiple relayer wallets with load balancing
- Dedicated Avalanche Subnet for high throughput
```

### Step 3: Create Deployment Guide

```markdown
<!-- docs/DEPLOYMENT.md -->
# Deployment Guide

## Prerequisites

- Vercel account
- Supabase account (or PostgreSQL instance)
- Upstash account (or Redis instance)
- Avalanche wallet with AVAX for deployment

## Environment Variables

Create these in Vercel dashboard:

```env
# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# Blockchain
NEXT_PUBLIC_CHAIN_ID=43113  # Fuji
NEXT_PUBLIC_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# Contracts (deploy first, then add)
NEXT_PUBLIC_BIOMETRIC_REGISTRY=0x...
NEXT_PUBLIC_CREDENTIAL_VERIFIER=0x...
NEXT_PUBLIC_RWA_GATEWAY=0x...
NEXT_PUBLIC_RWA_TOKEN=0x...
NEXT_PUBLIC_DOCUMENT_SEAL=0x...

# Auth
JWT_SECRET=<generate-32-char-secret>
WEBAUTHN_RP_NAME=RWA Gateway
WEBAUTHN_RP_ID=your-domain.vercel.app

# Relayer
RELAYER_PRIVATE_KEY=<relayer-wallet-private-key>
```

## Contract Deployment

### 1. Configure Hardhat

```typescript
// hardhat.config.ts
networks: {
  fuji: {
    url: 'https://api.avax-test.network/ext/bc/C/rpc',
    chainId: 43113,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY],
  },
}
```

### 2. Deploy Contracts

```bash
cd contracts

# Deploy in order (dependencies)
npx hardhat run scripts/deploy/01-biometric-registry.ts --network fuji
npx hardhat run scripts/deploy/02-credential-verifier.ts --network fuji
npx hardhat run scripts/deploy/03-rwa-gateway.ts --network fuji
npx hardhat run scripts/deploy/04-rwa-token.ts --network fuji
npx hardhat run scripts/deploy/05-document-seal.ts --network fuji
```

### 3. Verify Contracts

```bash
npx hardhat verify --network fuji <contract-address> <constructor-args>
```

## Database Setup

### 1. Create Database

Using Supabase:
1. Create new project
2. Copy connection string
3. Add to DATABASE_URL

### 2. Run Migrations

```bash
cd backend
npx prisma migrate deploy
```

## Frontend Deployment

### 1. Connect to Vercel

```bash
vercel link
```

### 2. Deploy

```bash
vercel --prod
```

## Post-Deployment

### 1. Fund Relayer

Send AVAX to relayer wallet address.

### 2. Seed Initial Data

```bash
npx ts-node scripts/seed-demo-data.ts
```

### 3. Verify Functionality

- [ ] Frontend loads
- [ ] Registration works
- [ ] Investment flow completes
- [ ] Document sealing works

## Monitoring

### Recommended Setup

1. **Sentry** for error tracking
2. **Vercel Analytics** for performance
3. **Custom alerts** for relayer balance
```

### Step 4: Commit Documentation

```bash
git add README.md docs/ARCHITECTURE.md docs/DEPLOYMENT.md
git commit -m "docs: add comprehensive project documentation

- Project README with quick start and architecture overview
- Detailed architecture documentation
- Step-by-step deployment guide

```

---

## Task 6.5: Final Deployment & Testing

**Objective:** Deploy to Fuji testnet and verify all functionality.

### Step 1: Deploy Contracts to Fuji

```bash
cd contracts

# Ensure correct network
echo "Deploying to Fuji testnet..."

# Deploy all contracts
npx hardhat run scripts/deploy/deploy-all.ts --network fuji

# Save addresses to .env
# NEXT_PUBLIC_BIOMETRIC_REGISTRY=0x...
# etc.
```

### Step 2: Verify All Contracts

```bash
# Verify each contract on Snowtrace
npx hardhat verify --network fuji $BIOMETRIC_REGISTRY_ADDRESS
npx hardhat verify --network fuji $CREDENTIAL_VERIFIER_ADDRESS $BIOMETRIC_REGISTRY_ADDRESS
npx hardhat verify --network fuji $RWA_GATEWAY_ADDRESS $CREDENTIAL_VERIFIER_ADDRESS $RWA_TOKEN_ADDRESS $USDC_ADDRESS
npx hardhat verify --network fuji $RWA_TOKEN_ADDRESS $RWA_GATEWAY_ADDRESS
npx hardhat verify --network fuji $DOCUMENT_SEAL_ADDRESS $BIOMETRIC_REGISTRY_ADDRESS
```

### Step 3: Deploy Frontend to Vercel

```bash
cd frontend

# Ensure production env vars are set
vercel env pull .env.production.local

# Deploy to production
vercel --prod

# Note the deployment URL
echo "Deployed to: https://rwa-gateway.vercel.app"
```

### Step 4: Run Production Smoke Tests

```bash
# Run E2E tests against production
BASE_URL=https://rwa-gateway.vercel.app npx playwright test tests/e2e/smoke.spec.ts
```

### Step 5: Final Checklist

```markdown
## Pre-Submission Checklist

### Contracts
- [ ] All 5 contracts deployed to Fuji
- [ ] All contracts verified on Snowtrace
- [ ] Test transactions successful
- [ ] Gas costs within targets

### Frontend
- [ ] Deployed to Vercel
- [ ] Custom domain configured (optional)
- [ ] All pages loading
- [ ] WebAuthn working on Chrome, Safari, Firefox

### Backend
- [ ] Database migrated
- [ ] API endpoints responding
- [ ] Relayer funded and functional
- [ ] Rate limiting active

### Documentation
- [ ] README complete
- [ ] Architecture documented
- [ ] API documented
- [ ] Deployment guide complete

### Demo
- [ ] Demo script practiced
- [ ] Demo data seeded
- [ ] Backup plans ready
- [ ] Screen recording done (backup)

### Security
- [ ] Audit report complete
- [ ] All high/medium issues fixed
- [ ] Security headers configured
- [ ] No secrets in code

### Submission
- [ ] GitHub repository public
- [ ] License added
- [ ] Video demo recorded
- [ ] Submission form completed
```

### Step 6: Final Commit

```bash
git add .
git commit -m "chore: final deployment and verification for competition submission

- All contracts deployed and verified on Fuji
- Frontend deployed to Vercel
- E2E tests passing
- Documentation complete
- Ready for Avalanche Build Games 2026


git push origin main
```

---

## Phase 6 Definition of Done

- [ ] Security audit complete with no high/critical findings
- [ ] All identified security issues fixed
- [ ] Contract gas optimized (registration < 200k, auth < 50k)
- [ ] Frontend bundle < 300KB gzipped
- [ ] API response time < 200ms (p95)
- [ ] Demo script practiced and timed (< 5 min)
- [ ] All contracts deployed and verified on Fuji
- [ ] Frontend deployed and accessible
- [ ] Documentation complete
- [ ] Submission materials ready

---

## Competition Submission Checklist

```markdown
## Avalanche Build Games 2026 Submission

### Required Materials
- [ ] GitHub repository URL
- [ ] Live demo URL
- [ ] Video demo (< 5 minutes)
- [ ] Project description (< 500 words)
- [ ] Team information

### Technical Requirements
- [ ] Uses Avalanche C-Chain
- [ ] Contracts verified on Snowtrace
- [ ] Working demo on Fuji testnet

### Judging Criteria Addressed
- [ ] Innovation: ACP-204 biometric verification
- [ ] Technical Execution: Full-stack implementation
- [ ] User Experience: Gasless, walletless UX
- [ ] Potential Impact: RWA democratization
- [ ] Avalanche Utilization: Exclusive features
```

---

Congratulations on completing the RWA Gateway implementation plan! This document covers the final phase of hardening, optimization, and preparation for the Avalanche Build Games 2026 competition.
