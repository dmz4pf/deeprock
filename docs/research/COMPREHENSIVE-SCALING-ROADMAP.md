# RWA Gateway Comprehensive Scaling Roadmap

**Date:** 2026-02-07
**Vision:** "Touch to Invest. Prove Without Exposing. Own the Real World."
**Target Market:** $33B RWA market → $500B-3T by 2030

---

## Executive Summary

This document provides a complete scaling roadmap for RWA Gateway, covering ALL features needed to transform the MVP into a production-ready institutional-grade platform. Based on extensive research of industry best practices, competitor analysis, and emerging standards.

---

## Part 1: Core Pool Infrastructure (CRITICAL)

### Current State vs. Production Requirements

| Feature | Current (MVP) | Production Required | Standard |
|---------|---------------|---------------------|----------|
| NAV Calculation | 1:1 share ratio | Dynamic NAV oracle | Chainlink/RedStone |
| Yield Accrual | None | Continuous drip | ERC-4626 |
| Vault Standard | Custom | Tokenized vault | ERC-4626 |
| Redemption | Instant | Queue + T+3 settlement | FIFO queue |
| Compliance | Relayer trust | On-chain identity | ERC-3643 (T-REX) |
| Fee Structure | None | Mgmt + Performance | 2/20 model |

### 1.1 NAV Oracle Integration

**Why:** Tokenized assets need real-time pricing. Without NAV, shares can't reflect true asset value.

**Implementation:**
```solidity
interface INavOracle {
    function getNav(uint256 poolId) external view returns (uint256 nav, uint8 decimals, uint256 timestamp);
    function getSharePrice(uint256 poolId) external view returns (uint256 pricePerShare);
}
```

**Providers:**
- **Chainlink**: Industry standard, 15+ chains, Proof of Reserves
- **Chronicle Labs**: Proof of Asset framework, used by major institutions
- **RedStone**: Pull-based oracles, lower gas costs

**APY Dynamics Research:**
- APYs are NOT static - they change based on:
  - Federal Reserve rate changes
  - Market demand for underlying assets
  - Credit events (defaults, restructuring)
  - Pool utilization rate
  - Liquidity premiums

### 1.2 ERC-4626 Tokenized Vault

**Why:** Industry standard for yield-bearing vaults. Required for DeFi composability.

**Key Functions:**
```solidity
// Deposit USDC, receive shares
function deposit(uint256 assets, address receiver) external returns (uint256 shares);

// Redeem shares for assets
function redeem(uint256 shares, address receiver, address owner) external returns (uint256 assets);

// Preview conversions
function previewDeposit(uint256 assets) external view returns (uint256 shares);
function previewRedeem(uint256 shares) external view returns (uint256 assets);

// Total assets under management
function totalAssets() external view returns (uint256);
```

**Yield Distribution Models:**
1. **Accumulating** (Recommended): Share price increases, balance stays same
   - Example: BUIDL by BlackRock
   - Better for tax efficiency

2. **Rebasing**: Balance increases, share price stays same
   - Example: stETH by Lido
   - More intuitive for users

### 1.3 Redemption Queue System

**Why:** RWAs have liquidity constraints. T-bill redemption takes T+1 to T+3 days.

**Queue Mechanism:**
```solidity
struct RedemptionRequest {
    address investor;
    uint256 shares;
    uint256 requestedAt;
    uint256 processAfter;  // T+notice period
    bool processed;
}

// FIFO processing
function requestRedemption(uint256 poolId, uint256 shares) external;
function processRedemptions(uint256 poolId, uint256 maxRequests) external;
```

**Notice Periods by Asset Type:**
| Asset | Settlement | Notice |
|-------|------------|--------|
| T-Bills | T+1 | 24 hours |
| MMF | T+1 | 24 hours |
| Private Credit | T+30-90 | 30 days |
| Real Estate | T+90+ | 90 days |

### 1.4 ERC-3643 Compliance (T-REX)

**Why:** Regulatory-compliant token standard. Required for securities.

**Components:**
- **Identity Registry**: On-chain KYC status
- **Compliance Module**: Transfer restrictions
- **Trusted Issuers Registry**: Approved claim verifiers
- **Claim Topics Registry**: Required credentials

```solidity
// Transfer only if both parties are verified
function transfer(address to, uint256 amount) public override returns (bool) {
    require(identityRegistry.isVerified(msg.sender), "Sender not verified");
    require(identityRegistry.isVerified(to), "Receiver not verified");
    require(compliance.canTransfer(msg.sender, to, amount), "Transfer not compliant");
    return super.transfer(to, amount);
}
```

### 1.5 Fee Structure

**Standard RWA Fee Model:**
- **Management Fee**: 0.5-2% annual (accrued daily on AUM)
- **Performance Fee**: 10-20% of yield above benchmark
- **Entry/Exit Fee**: 0-0.5% (optional, for illiquid assets)

```solidity
function _accrueManagementFee(uint256 poolId) internal {
    uint256 timePassed = block.timestamp - pool.lastFeeAccrual;
    uint256 annualFee = (pool.totalAssets * pool.managementFeeRate) / 10000;
    uint256 accruedFee = (annualFee * timePassed) / 365 days;
    pool.accruedFees += accruedFee;
    pool.lastFeeAccrual = block.timestamp;
}
```

---

## Part 2: Account Abstraction & Wallet UX (HIGH PRIORITY)

### 2.1 Current State

- BiometricRegistry for WebAuthn passkeys
- SimpleSmartWallet with ACP-204 precompile
- Gasless transactions via relayer

### 2.2 ERC-4337 Full Implementation

**Why:** 40M+ smart accounts deployed. Industry standard for account abstraction.

**Key Enhancements:**

| Feature | Current | Production |
|---------|---------|------------|
| Wallet Type | SimpleSmartWallet | ERC-4337 Modular |
| Gas Sponsorship | Relayer pays | Paymaster contract |
| Recovery | None | Social recovery |
| Session Keys | None | Time-limited delegated signing |
| Batching | None | Multi-call bundling |

**Session Keys for DApps:**
```solidity
struct SessionKey {
    address key;
    uint256 validAfter;
    uint256 validUntil;
    address[] allowedTargets;
    bytes4[] allowedMethods;
    uint256 spendLimit;
}

// User signs once, dApp can execute within limits
function validateSession(SessionKey memory session, UserOperation calldata op) internal view;
```

**Social Recovery:**
```solidity
struct Guardian {
    address guardian;
    uint256 addedAt;
}

// 2-of-3 guardians can recover wallet
function initiateRecovery(address newOwner) external onlyGuardian;
function executeRecovery(address newOwner) external; // After timelock
```

### 2.3 Paymaster Enhancements

**Gas Policies:**
1. **Free Tier**: First 10 transactions/month sponsored
2. **Fee Deduction**: Deduct gas from USDC balance
3. **Subscription**: Monthly fee for unlimited transactions
4. **Staking**: Stake RWA tokens for gas credits

```solidity
function _validatePaymasterUserOp(UserOperation calldata userOp) internal returns (bytes memory context) {
    address user = userOp.sender;

    // Check free tier
    if (monthlyTxCount[user] < FREE_TIER_LIMIT) {
        return abi.encode(GasPolicy.FREE);
    }

    // Check USDC balance for fee deduction
    uint256 maxGasCost = userOp.maxFeePerGas * userOp.callGasLimit;
    require(usdc.balanceOf(user) >= maxGasCost, "Insufficient balance");

    return abi.encode(GasPolicy.USDC_DEDUCT, maxGasCost);
}
```

---

## Part 3: DeFi Integration (HIGH PRIORITY)

### 3.1 Aave Horizon Integration

**Why:** Aave Horizon is a permissioned market for RWA collateral. $176M+ loans already.

**Use Cases:**
1. **RWA as Collateral**: Deposit T-bill tokens, borrow USDC
2. **Yield Optimization**: Leverage RWA positions
3. **Institutional Lending**: Banks lend against tokenized collateral

**Integration Requirements:**
- Chainlink NAV oracle for collateral valuation
- ERC-4626 compatibility for share price
- Compliance checks on liquidations

### 3.2 Lending Protocol

**Native Lending Pool:**
```solidity
struct LendingPool {
    IERC4626 collateralVault;    // RWA vault shares as collateral
    IERC20 borrowAsset;          // USDC
    uint256 liquidationThreshold; // 80%
    uint256 borrowRate;          // Dynamic based on utilization
    INavOracle navOracle;        // For collateral valuation
}

function borrow(uint256 poolId, uint256 amount) external {
    Position storage pos = positions[poolId][msg.sender];
    uint256 collateralValue = navOracle.getNav(poolId) * pos.collateralShares / 1e18;
    uint256 maxBorrow = collateralValue * liquidationThreshold / 10000;
    require(pos.borrowed + amount <= maxBorrow, "Exceeds LTV");
    // ...
}
```

### 3.3 Yield Aggregation

**Auto-Compound Strategies:**
1. **T-Bill Ladder**: Spread across maturities for consistent yield
2. **MMF Rotation**: Move between funds based on rates
3. **Yield Farming**: Stake LP tokens for additional rewards

---

## Part 4: Secondary Market Trading (MEDIUM PRIORITY)

### 4.1 AMM for RWA Tokens

**Why:** Create liquidity for tokenized assets without traditional market makers.

**Considerations:**
- **Compliance**: Only verified addresses can trade
- **Price Discovery**: NAV-anchored pricing with small deviation bands
- **Liquidity**: Incentive programs for LPs

**Compliant AMM Design:**
```solidity
function swap(
    address tokenIn,
    address tokenOut,
    uint256 amountIn
) external returns (uint256 amountOut) {
    // Compliance check
    require(identityRegistry.isVerified(msg.sender), "Not verified");
    require(compliance.canTransfer(msg.sender, address(this), amountIn), "Transfer blocked");

    // NAV-bounded pricing
    uint256 navPrice = navOracle.getNav(tokenOut);
    uint256 ammPrice = getSpotPrice(tokenIn, tokenOut);
    require(
        ammPrice >= navPrice * 995 / 1000 && ammPrice <= navPrice * 1005 / 1000,
        "Price outside NAV bounds"
    );

    // Execute swap
    amountOut = _swap(tokenIn, tokenOut, amountIn);
}
```

### 4.2 Order Book (Optional)

For larger trades, order book matching provides better execution:
- Limit orders for institutional traders
- RFQ (Request for Quote) system
- Dark pool for large block trades

---

## Part 5: Cross-Chain Infrastructure (MEDIUM PRIORITY)

### 5.1 Chainlink CCIP Integration

**Why:** SWIFT + 12 major institutions use CCIP for cross-chain RWA transfers.

**Use Cases:**
1. **Multi-Chain Deposits**: Invest from any chain
2. **Cross-Chain Redemptions**: Withdraw to preferred chain
3. **Unified Liquidity**: Single pool, multi-chain access

**Implementation:**
```solidity
function investCrossChain(
    uint64 destinationChainSelector,
    uint256 poolId,
    uint256 amount
) external payable {
    // Prepare CCIP message
    Client.EVM2AnyMessage memory message = Client.EVM2AnyMessage({
        receiver: abi.encode(rwaGatewayOnDestChain),
        data: abi.encode(poolId, msg.sender, amount),
        tokenAmounts: new Client.EVMTokenAmount[](1),
        extraArgs: "",
        feeToken: address(0)
    });

    message.tokenAmounts[0] = Client.EVMTokenAmount({
        token: address(usdc),
        amount: amount
    });

    // Send cross-chain message
    IRouterClient(ccipRouter).ccipSend{value: msg.value}(
        destinationChainSelector,
        message
    );
}
```

### 5.2 Supported Chains

**Priority Order:**
1. **Avalanche C-Chain** (Primary) - Sub-second finality
2. **Ethereum Mainnet** - Institutional liquidity
3. **Base** - Low fees, Coinbase ecosystem
4. **Arbitrum** - DeFi liquidity
5. **Polygon** - High throughput

---

## Part 6: Governance (MEDIUM PRIORITY)

### 6.1 DAO Structure

**Why:** Decentralized governance builds trust. 1% whale control is a known issue.

**Anti-Whale Mechanisms:**
1. **Quadratic Voting**: sqrt(tokens) = voting power
2. **Delegation**: Small holders delegate to representatives
3. **Time-Weighted Voting**: Longer holders have more weight
4. **Soulbound Reputation**: Non-transferable voting power

### 6.2 Governance Scope

| Decision Type | Mechanism |
|---------------|-----------|
| Pool Parameters | Token vote |
| Fee Changes | Token vote + Timelock |
| Emergency Pause | Multisig (immediate) |
| Smart Contract Upgrades | Token vote + 7-day timelock |
| Treasury Allocation | Token vote |

### 6.3 Governor Contract

```solidity
contract RWAGovernor is Governor, GovernorVotes, GovernorTimelockControl {
    // Quadratic voting
    function getVotes(address account, uint256 blockNumber) public view override returns (uint256) {
        uint256 balance = token.getPastVotes(account, blockNumber);
        return sqrt(balance);
    }

    // 3-day voting period
    function votingPeriod() public pure override returns (uint256) {
        return 3 days;
    }

    // 4% quorum
    function quorum(uint256) public pure override returns (uint256) {
        return token.totalSupply() * 4 / 100;
    }
}
```

---

## Part 7: Analytics & Reporting (MEDIUM PRIORITY)

### 7.1 Portfolio Dashboard

**Features:**
- Real-time portfolio value (NAV-based)
- Yield tracking and projections
- Transaction history
- Tax reporting (cost basis, gains/losses)
- Performance benchmarks

### 7.2 Institutional Reporting

**Requirements:**
- Daily NAV reports
- Monthly statements
- Quarterly audited financials
- On-demand compliance reports
- API access for integration

### 7.3 On-Chain Analytics Integration

**Providers:**
- **RWA.xyz**: Industry-standard RWA analytics
- **Nansen**: Smart money tracking, 500M+ labeled wallets
- **Artemis**: Fundamental metrics, automated spreadsheets
- **Chainalysis**: Compliance and transaction monitoring

---

## Part 8: Notifications & Alerts (MEDIUM PRIORITY)

### 8.1 Push Protocol Integration

**Why:** Web3-native notifications tied to wallet address. Off-chain, gasless.

**Notification Types:**
1. **Transaction Confirmations**: Deposit/withdrawal confirmed
2. **Yield Updates**: Daily yield distribution
3. **Price Alerts**: NAV changes beyond threshold
4. **Governance**: New proposals, voting reminders
5. **Security**: Suspicious activity, recovery initiated

**Implementation:**
```typescript
// Push SDK integration
const sendNotification = async (userWallet: string, title: string, body: string) => {
  await PushAPI.payloads.sendNotification({
    signer,
    type: 3, // Targeted notification
    identityType: 2,
    notification: { title, body },
    payload: { title, body, cta: '', img: '' },
    recipients: `eip155:43114:${userWallet}`, // Avalanche
    channel: channelAddress,
    env: 'prod'
  });
};
```

### 8.2 Multi-Channel Delivery

- Push Protocol (in-app)
- Email (via backend)
- Telegram (via bot)
- Discord (via webhook)
- SMS (for critical alerts)

---

## Part 9: Referral & Rewards Program (LOWER PRIORITY)

### 9.1 Tokenized Incentives

**Earning Mechanisms:**
1. **Deposits**: Earn points on investment amounts
2. **Referrals**: 5-10% of referee's rewards for 12 months
3. **Staking**: Lock tokens for multiplied rewards
4. **Governance**: Vote participation rewards
5. **Loyalty**: Duration-based tier upgrades

### 9.2 Reward Token Design

```solidity
struct RewardTier {
    uint256 minStaked;
    uint256 rewardMultiplier;  // 1x, 1.5x, 2x
    uint256 feeDiscount;       // 0%, 10%, 25%
    bool governanceAccess;
}

// Bronze: 100 tokens, 1x, 0%
// Silver: 1000 tokens, 1.5x, 10%
// Gold: 10000 tokens, 2x, 25%
```

### 9.3 Referral Commission Structure

| Tier | Requirement | Commission |
|------|-------------|------------|
| Basic | 0-10 referrals | 5% of referee fees |
| Pro | 10-50 referrals | 7.5% of referee fees |
| Elite | 50+ referrals | 10% of referee fees |

---

## Part 10: Mobile & PWA (LOWER PRIORITY)

### 10.1 Current Biometric Integration

RWA Gateway already has WebAuthn passkey authentication, which is the foundation for mobile biometric auth.

### 10.2 PWA Enhancements

**Features:**
- Offline mode (view-only when disconnected)
- Push notifications (via Push Protocol)
- Home screen installation
- Camera access for document scanning (KYC)
- Biometric login (Face ID, Touch ID)

### 10.3 Mobile-Specific UX

- Simplified investment flow (3 taps to invest)
- Quick action buttons for common operations
- Swipe gestures for navigation
- Large touch targets for accessibility

---

## Part 11: Internationalization (LOWER PRIORITY)

### 11.1 Language Support

**Priority Languages:**
1. English (default)
2. Spanish (LATAM market)
3. Portuguese (Brazil)
4. Chinese (Simplified)
5. Arabic (Middle East, RTL support)
6. Hindi (India)

### 11.2 i18n Implementation

Using next-intl for Next.js:

```typescript
// messages/en.json
{
  "invest": {
    "title": "Invest in Real World Assets",
    "amount": "Amount",
    "confirm": "Confirm Investment",
    "success": "Successfully invested {amount} USDC"
  }
}

// Component usage
import { useTranslations } from 'next-intl';

function InvestPage() {
  const t = useTranslations('invest');
  return <h1>{t('title')}</h1>;
}
```

### 11.3 Regional Compliance

- GDPR (Europe)
- CCPA (California)
- Regional KYC requirements
- Local payment methods

---

## Part 12: KYC/AML Infrastructure (CRITICAL)

### 12.1 Current State

CredentialVault stores encrypted credentials. Need to integrate professional KYC providers.

### 12.2 Provider Integration

**Recommended Providers:**
| Provider | Strength | Coverage |
|----------|----------|----------|
| Jumio | Continuous monitoring | 200+ countries, 5000+ doc types |
| Onfido | Enterprise compliance | 195 countries, Atlas AI |
| Sumsub | End-to-end KYC/KYB/AML | Fast integration |
| Veriff | Speed | Sub-minute verification |

### 12.3 Verification Flow

```typescript
interface KYCResult {
  userId: string;
  status: 'approved' | 'pending' | 'rejected';
  level: 'basic' | 'enhanced' | 'accredited';
  country: string;
  expiresAt: Date;
  claims: {
    name: boolean;
    dateOfBirth: boolean;
    address: boolean;
    accreditedInvestor: boolean;
  };
}

// On-chain credential registration
async function registerKYCCredential(result: KYCResult) {
  const encryptedClaim = await encrypt(result, userPublicKey);
  await credentialVault.addCredential(
    userId,
    ClaimType.KYC,
    encryptedClaim,
    result.expiresAt
  );
}
```

### 12.4 Accredited Investor Verification

For securities, need proof of accredited investor status:
- Income verification ($200k+/year)
- Net worth verification ($1M+ excluding primary residence)
- Professional certification (Series 7, 65, 82)

---

## Part 13: Legal & Compliance Structure (CRITICAL)

### 13.1 SPV Structure

**Why:** Isolate assets legally, enable fractional ownership.

**Common Wrappers:**
| Wrapper | Use Case | Jurisdiction |
|---------|----------|--------------|
| Delaware LLC | US investors | USA |
| Cayman SPC | International fund | Cayman |
| Luxembourg RAIF | EU AIFMD compliant | EU |
| BVI BC | Offshore flexibility | BVI |

### 13.2 Regulatory Framework by Asset Type

| Asset | Regulation | Requirements |
|-------|------------|--------------|
| T-Bills | SEC Rule 144A | Accredited investors only |
| Private Credit | Reg D 506(c) | Accredited + verification |
| Real Estate | Reg A+ | Up to $75M, non-accredited allowed |
| MMF | 1940 Act | Full SEC registration |

### 13.3 Smart Contract Compliance

Embed compliance directly in token transfer logic:
- Transfer restrictions by jurisdiction
- Holding period enforcement
- Investor cap limits
- Whitelist management

---

## Part 14: Developer Platform (LOWER PRIORITY)

### 14.1 API Design

**REST API Endpoints:**
```
GET  /v1/pools                    # List all pools
GET  /v1/pools/{id}               # Pool details + NAV
GET  /v1/pools/{id}/positions     # User positions
POST /v1/pools/{id}/invest        # Create investment intent
POST /v1/pools/{id}/redeem        # Create redemption request
GET  /v1/user/portfolio           # Full portfolio
GET  /v1/user/transactions        # Transaction history
```

**WebSocket Streams:**
```
ws://api/v1/stream/prices         # Real-time NAV updates
ws://api/v1/stream/transactions   # User transaction updates
ws://api/v1/stream/notifications  # Push notifications
```

### 14.2 SDK

```typescript
import { RWAGateway } from '@rwa-gateway/sdk';

const gateway = new RWAGateway({
  network: 'avalanche',
  apiKey: process.env.RWA_API_KEY
});

// Invest
const result = await gateway.invest({
  poolId: 1,
  amount: parseUnits('1000', 6), // 1000 USDC
  investor: walletAddress
});

// Get portfolio
const portfolio = await gateway.getPortfolio(walletAddress);
```

### 14.3 Widget Embeds

Allow third-party sites to embed RWA investment widgets:
- Iframe-based investment widget
- React component library
- White-label solutions

---

## Part 15: Security Infrastructure (CRITICAL)

### 15.1 Smart Contract Security

**Requirements:**
- [ ] Multiple audits (Halborn, Trail of Bits, OpenZeppelin)
- [ ] Formal verification for critical functions
- [ ] Bug bounty program (Immunefi)
- [ ] Timelock on upgrades
- [ ] Emergency pause mechanism

### 15.2 Infrastructure Security

- HSM for relayer key management
- Multi-sig for admin operations
- Rate limiting on all endpoints
- DDoS protection
- WAF (Web Application Firewall)

### 15.3 Custody Standards

For institutional adoption:
- SOC 2 Type II compliance
- Segregated cold storage
- Insurance coverage
- Regular proof-of-reserves

---

## Implementation Priority Matrix

### Phase 1: Foundation (Weeks 1-4)
**Goal:** Production-ready pool infrastructure

| Feature | Priority | Complexity | Dependencies |
|---------|----------|------------|--------------|
| ERC-4626 Vault | CRITICAL | High | NAV Oracle |
| NAV Oracle (Chainlink) | CRITICAL | Medium | None |
| Redemption Queue | CRITICAL | Medium | ERC-4626 |
| Fee Structure | HIGH | Low | ERC-4626 |
| Enhanced Paymaster | HIGH | Medium | None |

### Phase 2: Compliance (Weeks 5-8)
**Goal:** Regulatory readiness

| Feature | Priority | Complexity | Dependencies |
|---------|----------|------------|--------------|
| ERC-3643 Compliance | CRITICAL | High | Identity Registry |
| KYC Provider Integration | CRITICAL | Medium | Backend |
| SPV Legal Structure | CRITICAL | N/A (Legal) | External |
| Security Audit | CRITICAL | N/A | Phase 1 complete |

### Phase 3: Scale (Weeks 9-12)
**Goal:** Growth features

| Feature | Priority | Complexity | Dependencies |
|---------|----------|------------|--------------|
| Push Notifications | HIGH | Low | None |
| Analytics Dashboard | HIGH | Medium | Backend |
| Aave Integration | HIGH | High | ERC-4626 |
| Referral Program | MEDIUM | Low | Backend |

### Phase 4: Expansion (Weeks 13-16)
**Goal:** Multi-chain and advanced features

| Feature | Priority | Complexity | Dependencies |
|---------|----------|------------|--------------|
| CCIP Cross-Chain | MEDIUM | High | Phase 1 |
| Governance DAO | MEDIUM | Medium | Token |
| AMM Trading | MEDIUM | High | Compliance |
| i18n (4 languages) | LOWER | Low | Frontend |

### Phase 5: Ecosystem (Weeks 17+)
**Goal:** Developer platform and network effects

| Feature | Priority | Complexity | Dependencies |
|---------|----------|------------|--------------|
| Public API | LOWER | Medium | Backend stable |
| SDK Release | LOWER | Medium | API |
| Widget Embeds | LOWER | Low | SDK |
| Mobile App | LOWER | High | All above |

---

## Cost Estimates

### Development Resources

| Phase | Duration | Engineers | Cost Range |
|-------|----------|-----------|------------|
| Phase 1 | 4 weeks | 2 Solidity, 1 Backend | $40-60k |
| Phase 2 | 4 weeks | 1 Solidity, 2 Backend | $40-60k |
| Phase 3 | 4 weeks | 1 Full-stack, 1 Backend | $30-50k |
| Phase 4 | 4 weeks | 2 Solidity, 1 Frontend | $40-60k |
| Phase 5 | 4+ weeks | 2 Full-stack | $30-50k |

### External Costs

| Item | Cost Range | Notes |
|------|------------|-------|
| Security Audit | $50-150k | Multiple auditors recommended |
| Legal (SPV Setup) | $50-100k | Per jurisdiction |
| KYC Provider | $1-5/verification | Volume discounts available |
| Oracle Fees | $0-500/month | Chainlink has free tier |
| Bug Bounty | $50-500k | Critical vulnerability reserve |

---

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Smart contract exploit | Low | Critical | Multiple audits, formal verification |
| Regulatory action | Medium | High | Proactive compliance, legal counsel |
| Oracle failure | Low | High | Multiple oracle sources, circuit breakers |
| Liquidity crisis | Medium | Medium | Reserve requirements, queue system |
| Key compromise | Low | Critical | HSM, multi-sig, insurance |

---

## Success Metrics

### Phase 1 (Foundation)
- [ ] ERC-4626 vault deployed and audited
- [ ] NAV updates within 1 minute of source
- [ ] Redemption queue processing within SLA

### Phase 2 (Compliance)
- [ ] SEC no-action letter or Reg D exemption
- [ ] 3 KYC providers integrated
- [ ] First institutional investor onboarded

### Phase 3 (Scale)
- [ ] $10M TVL
- [ ] 1,000 unique investors
- [ ] 95% notification delivery rate

### Phase 4 (Expansion)
- [ ] 3 chains supported
- [ ] First governance vote executed
- [ ] Secondary market trading live

### Phase 5 (Ecosystem)
- [ ] 10 third-party integrations
- [ ] SDK 1.0 released
- [ ] Mobile app launched

---

## HACKATHON vs POST-HACKATHON PRIORITIZATION

> **Context:** This project is for Avalanche Build Games 2026 (6-week hackathon).
> Features are categorized by what's needed for a functional demo vs. production deployment.

### Tier 1: Hackathon Essential (Must Have for Demo)

These features are **ALREADY IMPLEMENTED** or being completed for the hackathon:

| Feature | Status | Notes |
|---------|--------|-------|
| Passkey Authentication (WebAuthn) | ✅ Complete | BiometricRegistry + ACP-204 |
| Smart Wallet (SimpleSmartWallet) | ✅ Complete | Gasless UX |
| Gasless Transactions (Relayer) | ✅ Complete | Backend relayer pays gas |
| Basic Deposit/Withdraw | ✅ Complete | RWAPool with 1:1 shares |
| APY Display | ✅ Complete | Static display from backend |
| CredentialVault (KYC storage) | ✅ Complete | Encrypted credential storage |
| Pool Selection UI | ✅ Complete | Frontend pool browsing |

### Tier 2: Hackathon Nice-to-Have (If Time Permits)

| Feature | Complexity | Demo Value |
|---------|------------|------------|
| Simulated NAV Growth | Low | Shows yield accrual visually |
| Transaction History | Low | User activity tracking |
| Portfolio Dashboard | Medium | Aggregated holdings view |
| Push Notifications (Basic) | Medium | Transaction confirmations |

### Tier 3: Post-Hackathon (Production Features)

**ALL features in this document are Tier 3 unless listed above.** These require:
- Significant development time (weeks to months)
- External integrations (KYC providers, oracles, legal)
- Security audits ($50-150k)
- Legal/regulatory compliance

#### Priority Order for Post-Hackathon Development:

**Phase 1: Core Infrastructure (Weeks 1-4)**
| Feature | Why First | Estimated Effort |
|---------|-----------|------------------|
| ERC-4626 Vault | Industry standard, DeFi composability | 2 weeks |
| Chainlink NAV Oracle | Real-time pricing for shares | 1 week |
| Redemption Queue | RWA liquidity constraints | 1 week |
| Fee Structure (2/20) | Revenue model | 1 week |

**Phase 2: Compliance (Weeks 5-8)**
| Feature | Why Second | Estimated Effort |
|---------|------------|------------------|
| ERC-3643 Compliance | Securities regulations | 2 weeks |
| KYC Provider (Jumio/Onfido) | Institutional requirements | 2 weeks |
| Legal/SPV Structure | Delaware LLC or Cayman SPC | Legal work |
| Security Audit | Required before mainnet | 4-6 weeks |

**Phase 3: Scale (Weeks 9-12)**
| Feature | Why Third | Estimated Effort |
|---------|-----------|------------------|
| Push Protocol Notifications | User engagement | 1 week |
| Analytics Dashboard | Operations visibility | 2 weeks |
| Aave Horizon Integration | RWA collateral lending | 2 weeks |
| Referral Program | Growth mechanism | 1 week |

**Phase 4: Expansion (Weeks 13-16)**
| Feature | Why Fourth | Estimated Effort |
|---------|------------|------------------|
| Chainlink CCIP Cross-Chain | Multi-chain deposits | 3 weeks |
| DAO Governance | Decentralization | 2 weeks |
| AMM Trading | Secondary market liquidity | 3 weeks |
| Full i18n | International expansion | 1 week |

**Phase 5: Ecosystem (Weeks 17+)**
| Feature | Why Last | Estimated Effort |
|---------|----------|------------------|
| Public API | Third-party integrations | 2 weeks |
| SDK Release | Developer adoption | 3 weeks |
| Widget Embeds | Distribution channels | 1 week |
| Mobile App (Native) | Enhanced UX | 8+ weeks |
| Custom Subnet | High-volume scaling | 4+ weeks |

### Cost Estimates for Production

| Category | Estimated Cost |
|----------|----------------|
| Phase 1-5 Development | $180-280k |
| Security Audit (Tier 1) | $50-150k |
| Legal (per jurisdiction) | $50-100k |
| KYC Provider (annual) | $10-50k |
| Infrastructure (annual) | $20-50k |
| **Total to Production** | **$310-630k** |

### What's NOT Needed for Hackathon Demo

The following are explicitly **post-hackathon** and should not distract from the demo:

- Real NAV oracles (use simulated data)
- ERC-4626 compliance (1:1 shares work for demo)
- ERC-3643 compliance (relayer trust is fine for testnet)
- Real KYC provider integration (mock KYC flow)
- Cross-chain anything (single chain is sufficient)
- DAO governance (admin control for demo)
- Security audit (testnet doesn't need it)
- Legal structure (not selling real securities)
- Multi-language support (English only)

---

## References

### Standards
- [ERC-4626: Tokenized Vault Standard](https://eips.ethereum.org/EIPS/eip-4626)
- [ERC-3643: T-REX Token Standard](https://eips.ethereum.org/EIPS/eip-3643)
- [ERC-4337: Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)

### Research Sources
- [Chainlink CCIP Documentation](https://chain.link/cross-chain)
- [Aave Horizon](https://docs.aave.com)
- [Push Protocol](https://push.org/docs)
- [RWA.xyz Analytics](https://rwa.xyz)
- [Jumio KYC](https://www.jumio.com)
- [Securitize Infrastructure](https://securitize.io)

---

## Appendix A: Current RWAPool.sol Gap Analysis

```solidity
// CURRENT: 1:1 share ratio (Line 281)
uint256 shares = amount;

// REQUIRED: NAV-based share calculation
uint256 sharePrice = navOracle.getSharePrice(chainPoolId);
uint256 shares = amount * 1e18 / sharePrice;

// CURRENT: Instant redemption (Line 321)
usdc.safeTransfer(investor, amount);

// REQUIRED: Queue-based redemption
redemptionQueue.push(RedemptionRequest({
    investor: investor,
    shares: shares,
    requestedAt: block.timestamp,
    processAfter: block.timestamp + pool.noticePeriod
}));
```

---

## Appendix B: Recommended Tech Stack

| Layer | Current | Recommended |
|-------|---------|-------------|
| Frontend | Next.js 15 | Keep (add i18n) |
| Backend | Express | Keep (add Redis streams) |
| Database | PostgreSQL + Prisma | Keep (add TimescaleDB for time-series) |
| Blockchain | Avalanche C-Chain | Keep + Add L2s |
| Oracles | None | Chainlink + RedStone |
| KYC | None | Jumio + Onfido |
| Notifications | None | Push Protocol |
| Analytics | None | RWA.xyz + Custom |
| Cross-Chain | None | Chainlink CCIP |

---

---

## Part 16: TESTNET vs MAINNET FEATURE SPLIT

> **Updated:** 2026-02-08
> **Context:** Practical split of what can be built on Fuji testnet NOW vs what requires mainnet.

### 16.1 TESTNET-ACHIEVABLE FEATURES

These features work with MockUSDC, simulated yields, and test infrastructure.

#### Infrastructure & UX (Build Now)

| Feature | Effort | Feasibility | Dependencies |
|---------|--------|-------------|--------------|
| Multi-Passkey Support | 3-5 days | ✅ HIGH | BiometricRegistry update |
| Social Recovery | 5-7 days | ✅ HIGH | Guardian contract |
| Session Keys | 5-7 days | ⚠️ MEDIUM | SmartWallet upgrade |
| Auto-Compound Toggle | 2-3 days | ✅ HIGH | Backend job |
| Tax Report Export | 2-3 days | ✅ HIGH | Frontend only |
| Portfolio Simulation | 3-5 days | ✅ HIGH | Frontend only |
| Pool Analytics Dashboard | 2-3 days | ✅ HIGH | Read-only queries |

#### Revenue Infrastructure (Prep)

| Feature | Effort | Feasibility | Dependencies |
|---------|--------|-------------|--------------|
| Fee Collection Contract | 5-7 days | ✅ HIGH | Deploy + test with MockUSDC |
| Redemption Queue | 5-7 days | ✅ HIGH | FIFO queue logic |
| NAV Oracle Integration | 5-7 days | ✅ HIGH | Chainlink Fuji feeds exist |
| ERC-4626 Vault Upgrade | 7-10 days | ⚠️ MEDIUM | Significant refactor |

#### Security Hardening

| Feature | Effort | Feasibility | Dependencies |
|---------|--------|-------------|--------------|
| Timelock on Admin | 2-3 days | ✅ HIGH | OpenZeppelin Timelock |
| Multi-sig for Pools | 3-5 days | ✅ HIGH | Gnosis Safe |
| Circuit Breaker | 2-3 days | ✅ HIGH | Emergency pause logic |
| Audit Prep | Ongoing | ✅ HIGH | Documentation + tests |

#### Governance Skeleton

| Feature | Effort | Feasibility | Dependencies |
|---------|--------|-------------|--------------|
| Test Governance Token | 3-5 days | ✅ HIGH | ERC20Votes |
| Basic Voting Contract | 5-7 days | ✅ HIGH | OpenZeppelin Governor |
| Staking Mechanism | 5-7 days | ⚠️ MEDIUM | Reward distribution |

#### Frontend/UX

| Feature | Effort | Feasibility | Dependencies |
|---------|--------|-------------|--------------|
| Mobile PWA | 3-5 days | ✅ HIGH | Wrapper around web app |
| Push Notifications | 2-3 days | ✅ HIGH | Firebase/OneSignal |
| Dark Mode | 1-2 days | ✅ HIGH | CSS/theme change |
| Onboarding Tour | 2-3 days | ✅ HIGH | UI overlay |

### 16.2 MAINNET-ONLY FEATURES

These require real money, real assets, or real regulatory compliance.

#### Real Money Features

| Feature | Why Mainnet-Only |
|---------|------------------|
| Fiat On-Ramp | MoonPay/Transak require real KYC + real bank transfers |
| Real Yield Distribution | Requires real RWA assets generating real returns |
| Fee Collection (Live) | Collecting real fees requires legal entity |
| Insurance Integration | Nexus Mutual covers mainnet TVL only |

#### Institutional Features

| Feature | Why Mainnet-Only |
|---------|------------------|
| Proof of Reserves | Requires real custodian attestations |
| ERC-3643 Compliance | Real KYC/accreditation verification |
| Institutional API | Real money flows need SLAs, security audits |
| Tiered Products | Real risk tranching with real defaults |

#### Advanced DeFi Features

| Feature | Why Mainnet-Only |
|---------|------------------|
| Pool-to-Pool Swaps | RWAs have T+1 to T+5 settlement - atomic swaps don't match reality. Requires redemption queue → investment queue flow, or internal liquidity pool with reserves. |
| Cross-Chain Bridges | Bridge security requires mainnet validation |
| Multi-Chain Deployment | Each chain needs separate audit |
| Lending (Live) | Liquidations with real money need battle-testing |
| Flash Loans | Attack surface too high without mainnet security |
| Secondary Market | Real P2P trading needs liquidity |

> **Note on Pool-to-Pool Swaps:** The atomic `executeBatch()` pattern (redeem → approve → invest) works for liquid DeFi tokens but not for RWAs. Real-world assets have settlement periods, NAV calculations at specific times, and liquidity constraints. A production swap feature would need:
> - Redemption queue integration (T+N settlement)
> - Internal liquidity pool with protocol reserves
> - Or market maker integration for instant swaps with spread

---

## Part 17: TESTNET FEASIBILITY DEEP DIVE

### 17.1 Multi-Passkey Support

**Current State:** 1 passkey per user in BiometricIdentity table.

**What's Needed:**
```typescript
// Schema change
model BiometricIdentity {
  id            String   @id @default(uuid())
  userId        String
  credentialId  String   @unique
  publicKeyX    String
  publicKeyY    String
  deviceName    String?  // NEW: "iPhone 15 Pro"
  isPrimary     Boolean  @default(false) // NEW
  // ... rest
}
```

**Contract Change:** None - BiometricRegistry already supports multiple registrations per address.

**Backend Changes:**
- `POST /api/auth/passkey/register` - Add to existing user
- `GET /api/auth/passkeys` - List user's passkeys
- `DELETE /api/auth/passkey/:id` - Remove passkey

**Feasibility:** ✅ **HIGH** - Mostly database + API changes, 3-5 days.

---

### 17.2 Social Recovery

**Architecture:**
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Guardian 1 │     │  Guardian 2 │     │  Guardian 3 │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           │
                    ┌──────▼──────┐
                    │  2-of-3     │
                    │  Threshold  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  48hr       │
                    │  Timelock   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  New Owner  │
                    │  Set        │
                    └─────────────┘
```

**New Contract:** `SocialRecoveryModule.sol`
```solidity
function initiateRecovery(address wallet, address newOwner) external onlyGuardian;
function approveRecovery(address wallet) external onlyGuardian;
function executeRecovery(address wallet) external; // After timelock
function cancelRecovery(address wallet) external onlyWalletOwner;
```

**Feasibility:** ✅ **HIGH** - Standard pattern, 5-7 days.

---

### 17.3 Session Keys

**Use Case:** "Allow auto-compound for 30 days, max $10K per tx"

**Complexity:** Requires SmartWallet upgrade (UUPS).

**New Struct:**
```solidity
struct SessionKey {
    address key;
    uint48 validAfter;
    uint48 validUntil;
    address[] allowedTargets;
    bytes4[] allowedSelectors;
    uint256 spendLimit;
    uint256 spent;
}
```

**Feasibility:** ⚠️ **MEDIUM** - Wallet upgrade needed, 5-7 days.

---

### 17.4 Pool-to-Pool Swaps

**Simple Router Pattern:**
```solidity
function swap(
    uint256 fromPoolId,
    uint256 toPoolId,
    uint256 shares
) external returns (uint256 newShares) {
    // 1. Redeem from source pool
    uint256 usdcAmount = pools[fromPoolId].redeem(shares, msg.sender);

    // 2. Deduct 0.25% fee
    uint256 fee = usdcAmount * 25 / 10000;
    uint256 netAmount = usdcAmount - fee;

    // 3. Invest in destination pool
    newShares = pools[toPoolId].invest(netAmount, msg.sender);

    emit Swap(msg.sender, fromPoolId, toPoolId, shares, newShares, fee);
}
```

**Feasibility:** ✅ **HIGH** - Simple router, 3-5 days.

---

### 17.5 Fee Collection Contract

**Design:**
```solidity
contract FeeCollector {
    uint16 public managementFeeBps = 75;  // 0.75%
    uint16 public performanceFeeBps = 1500; // 15%
    address public treasury;

    function accrueManagementFee(uint256 poolId) external {
        uint256 timePassed = block.timestamp - lastAccrual[poolId];
        uint256 aum = pools[poolId].totalAssets();
        uint256 fee = (aum * managementFeeBps * timePassed) / (10000 * 365 days);
        accruedFees[poolId] += fee;
    }

    function collectFees(uint256 poolId) external onlyTreasury {
        uint256 fees = accruedFees[poolId];
        accruedFees[poolId] = 0;
        usdc.transfer(treasury, fees);
    }
}
```

**Feasibility:** ✅ **HIGH** - Standard pattern, 5-7 days.

---

### 17.6 Redemption Queue

**FIFO Queue:**
```solidity
struct RedemptionRequest {
    address investor;
    uint256 shares;
    uint256 usdcValue;      // Locked at request time
    uint256 requestedAt;
    uint256 processableAt;  // requestedAt + noticePeriod
    bool processed;
}

mapping(uint256 => RedemptionRequest[]) public queues;  // poolId => requests

function requestRedemption(uint256 poolId, uint256 shares) external {
    uint256 value = calculateRedemptionValue(poolId, shares);
    queues[poolId].push(RedemptionRequest({
        investor: msg.sender,
        shares: shares,
        usdcValue: value,
        requestedAt: block.timestamp,
        processableAt: block.timestamp + pools[poolId].noticePeriod,
        processed: false
    }));
}

function processQueue(uint256 poolId, uint256 count) external {
    // Process up to `count` requests that are past their notice period
    // Transfer USDC from pool to investors
}
```

**Feasibility:** ✅ **HIGH** - 5-7 days.

---

### 17.7 NAV Oracle Integration

**Chainlink on Fuji:** Price feeds exist for major assets.

```solidity
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract NavOracle {
    mapping(uint256 => AggregatorV3Interface) public priceFeeds;

    function getNav(uint256 poolId) external view returns (uint256 nav, uint256 timestamp) {
        (, int256 price, , uint256 updatedAt, ) = priceFeeds[poolId].latestRoundData();
        require(block.timestamp - updatedAt < 1 days, "Stale price");
        return (uint256(price), updatedAt);
    }
}
```

**For testnet:** Can use mock oracle with admin-controlled NAV updates.

**Feasibility:** ✅ **HIGH** - 5-7 days (mock), 7-10 days (Chainlink).

---

### 17.8 ERC-4626 Vault Upgrade

**Current:** Custom RWAPool with 1:1 shares.

**Required:** Full ERC-4626 interface.

**Key Functions to Add:**
```solidity
// Already have equivalent
function deposit(uint256 assets, address receiver) → invest()
function withdraw(uint256 assets, address receiver, address owner) → redeem()

// Need to add
function convertToShares(uint256 assets) public view returns (uint256);
function convertToAssets(uint256 shares) public view returns (uint256);
function previewDeposit(uint256 assets) public view returns (uint256);
function previewMint(uint256 shares) public view returns (uint256);
function previewWithdraw(uint256 assets) public view returns (uint256);
function previewRedeem(uint256 shares) public view returns (uint256);
function maxDeposit(address) public view returns (uint256);
function maxMint(address) public view returns (uint256);
function maxWithdraw(address owner) public view returns (uint256);
function maxRedeem(address owner) public view returns (uint256);
```

**Feasibility:** ⚠️ **MEDIUM** - Significant refactor, 7-10 days.

---

### 17.9 Governance Token + Voting

**Token:** Standard ERC20Votes
```solidity
contract RWAToken is ERC20, ERC20Votes {
    constructor() ERC20("RWA Governance", "RWA") ERC20Permit("RWA Governance") {}
}
```

**Governor:** OpenZeppelin Governor
```solidity
contract RWAGovernor is Governor, GovernorVotes, GovernorTimelockControl {
    function votingDelay() public pure override returns (uint256) { return 1 days; }
    function votingPeriod() public pure override returns (uint256) { return 3 days; }
    function quorum(uint256) public pure override returns (uint256) { return 100e18; }
}
```

**Feasibility:** ✅ **HIGH** - Standard OZ contracts, 5-7 days total.

---

### 17.10 Staking Mechanism

**Simple Staking:**
```solidity
contract RWAStaking {
    mapping(address => uint256) public staked;
    mapping(address => uint256) public rewards;

    uint256 public rewardRate = 1e16; // 0.01 tokens per second per staked token

    function stake(uint256 amount) external {
        _updateReward(msg.sender);
        rwaToken.transferFrom(msg.sender, address(this), amount);
        staked[msg.sender] += amount;
    }

    function unstake(uint256 amount) external {
        _updateReward(msg.sender);
        staked[msg.sender] -= amount;
        rwaToken.transfer(msg.sender, amount);
    }

    function claimRewards() external {
        _updateReward(msg.sender);
        uint256 reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        rwaToken.transfer(msg.sender, reward);
    }
}
```

**Feasibility:** ⚠️ **MEDIUM** - Reward math needs care, 5-7 days.

---

## Part 18: RECOMMENDED TESTNET SPRINT PLAN

### Sprint 1 (Week 1-2): Security Foundation
- [ ] Multi-passkey support
- [ ] Recovery codes improvement
- [ ] Timelock on admin functions
- [ ] Circuit breaker

**Deliverable:** More secure account management

### Sprint 2 (Week 3-4): Revenue Prep
- [ ] Fee collection contract
- [ ] Redemption queue
- [ ] Mock NAV oracle

**Deliverable:** Revenue infrastructure ready for mainnet

### Sprint 3 (Week 5-6): DeFi Primitives
- [ ] Pool-to-pool swaps
- [ ] Auto-compound toggle
- [ ] ERC-4626 upgrade (if time)

**Deliverable:** Capital efficiency features

### Sprint 4 (Week 7-8): Governance
- [ ] Test governance token
- [ ] Basic voting
- [ ] Staking rewards

**Deliverable:** Decentralization skeleton

### Sprint 5 (Week 9-10): UX Polish
- [ ] Tax report exports
- [ ] Analytics dashboard
- [ ] Mobile PWA
- [ ] Onboarding tour

**Deliverable:** Production-ready UX

---

*Document Version: 1.1*
*Last Updated: 2026-02-08*

