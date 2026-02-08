
# Deposit Integration Roadmap

**Status:** PLANNED
**Priority:** High
**Goal:** Enable real USDC deposits from wallets and bank accounts for all user types

## Current State

Currently using **MockUSDC** on Fuji testnet:
- Users get test tokens via faucet
- No real money movement
- Good for testing flows, not production

## Target State

Both user types can deposit real USDC via multiple methods:

| Deposit Method | Wallet Users | Passkey Users | Notes |
|----------------|--------------|---------------|-------|
| External Wallet | ✅ | ✅ | Bridge/transfer USDC from any chain |
| Bank Account (Fiat On-ramp) | ✅ | ✅ | Card/ACH via provider |
| Cross-chain Bridge | ✅ | ✅ | From Ethereum, Polygon, etc. |

---

## Phase 1: Wallet-to-Wallet USDC Deposits

### 1.1 Native AVAX USDC Support
Replace MockUSDC with real USDC on Avalanche C-Chain.

**Real USDC Addresses:**
- Mainnet: `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E` (Native USDC)
- Mainnet (Bridged): `0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664` (USDC.e)

**Tasks:**
- [ ] Update contract addresses in .env for mainnet
- [ ] Add network detection (testnet vs mainnet)
- [ ] Use MockUSDC on testnet, real USDC on mainnet
- [ ] Update UI to show correct token info

### 1.2 Deposit Flow for Wallet Users
User has USDC in their MetaMask, wants to invest.

```
Current Flow (Working):
1. User connects MetaMask
2. User has USDC in wallet (from faucet/external)
3. User signs EIP-2612 permit
4. Relayer submits investment
```

**No changes needed** - flow already supports real USDC once addresses are updated.

### 1.3 Deposit Flow for Passkey Users
User has USDC in external wallet, wants to invest via passkey account.

```
New Flow Needed:
1. User logged in with passkey (has smart wallet address)
2. User clicks "Deposit from External Wallet"
3. UI shows their smart wallet address + QR code
4. User sends USDC from MetaMask/Coinbase/etc to smart wallet
5. USDC arrives in smart wallet
6. User can now invest via UserOperation
```

**Tasks:**
- [ ] Add "Deposit" page/modal showing smart wallet address
- [ ] Generate QR code for address
- [ ] Add balance refresh/polling
- [ ] Show pending deposits

---

## Phase 2: Fiat On-Ramp (Bank Account Deposits)

### 2.1 Provider Selection

| Provider | Pros | Cons |
|----------|------|------|
| **MoonPay** | Wide coverage, established | Higher fees |
| **Transak** | Good UX, many payment methods | Regional limits |
| **Ramp** | Low fees, fast | Less coverage |
| **Coinbase Pay** | Trusted brand | US-focused |
| **Stripe Crypto** | Developer-friendly | Limited availability |

**Recommendation:** Start with **Transak** or **MoonPay** for broad coverage.

### 2.2 Integration Architecture

```
User clicks "Deposit from Bank"
        ↓
Embed on-ramp widget (iframe/redirect)
        ↓
User completes KYC (first time only)
        ↓
User pays via card/bank transfer
        ↓
Provider sends USDC to user's address:
  - Wallet users → EOA address
  - Passkey users → Smart wallet address
        ↓
Balance updates, user can invest
```

### 2.3 Implementation Tasks

- [ ] Select and sign up with on-ramp provider
- [ ] Implement provider SDK/widget
- [ ] Handle webhooks for deposit confirmation
- [ ] Add deposit history tracking
- [ ] KYC status management
- [ ] Error handling for failed deposits

---

## Phase 3: Cross-Chain Bridge Integration

### 3.1 Use Case
User has USDC on Ethereum/Polygon/Arbitrum, wants to use on Avalanche.

### 3.2 Options

| Bridge | Type | Speed |
|--------|------|-------|
| **LayerZero/Stargate** | Liquidity bridge | Fast (~minutes) |
| **Avalanche Bridge** | Official | Medium (~15 min) |
| **LI.FI** | Aggregator | Variable |
| **Socket** | Aggregator | Variable |

### 3.3 Integration Approach

**Option A: Link to external bridge**
- Simple: Just link to bridge UI
- User bridges manually, then deposits

**Option B: Embedded bridge widget**
- Better UX: Bridge within our app
- More complex integration

**Recommendation:** Start with Option A, upgrade to B later.

---

## Phase 4: Unified Deposit UI

### 4.1 Deposit Modal Design

```
┌─────────────────────────────────────┐
│         Deposit USDC                │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │  Wallet │  │  Bank   │          │
│  │   ↓     │  │   $     │          │
│  └────┬────┘  └────┬────┘          │
│       │            │               │
│  [Transfer]   [Buy USDC]           │
│                                     │
├─────────────────────────────────────┤
│  Your deposit address:              │
│  0x1234...5678  [Copy] [QR]        │
│                                     │
│  Current Balance: $1,234.56 USDC   │
└─────────────────────────────────────┘
```

### 4.2 Tasks

- [ ] Design unified deposit modal
- [ ] Implement wallet transfer tab
- [ ] Implement fiat on-ramp tab
- [ ] Add balance display with refresh
- [ ] Transaction history for deposits

---

## Technical Considerations

### Smart Wallet Deposits (Passkey Users)
- Smart wallet must be deployed before receiving funds
- First deposit might need special handling
- Consider: deploy wallet on first login vs first deposit

### Gas for Transactions
- Wallet users: Relayer pays via permit flow
- Passkey users: Paymaster sponsors gas
- On-ramp deposits: Provider handles gas to user address

### Security
- Validate deposit addresses
- Confirm chain before deposit
- Clear warnings about wrong chain transfers

---

## Priority Order

1. **Phase 1.3** - Deposit UI for passkey users (shows address)
2. **Phase 2** - Fiat on-ramp (biggest user need)
3. **Phase 1.1** - Real USDC for mainnet
4. **Phase 3** - Cross-chain bridges

---

## Success Metrics

- [ ] Users can deposit from external wallets
- [ ] Users can buy USDC with card/bank
- [ ] Deposit → Invest flow < 5 minutes
- [ ] Zero failed deposits due to wrong address/chain
