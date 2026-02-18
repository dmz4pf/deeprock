# DeepRock — Institutional RWA Platform on Avalanche

Tokenized real-world assets: treasury bills, private credit, and real estate on-chain.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Avalanche](https://img.shields.io/badge/Avalanche-Fuji-E84142)](https://www.avax.network/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-363636)](https://soliditylang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

![DeepRock Landing](docs/images/landing.png)

## Live Demo

**[deeprock-app.vercel.app](https://deeprock-app.vercel.app)**

---

## Screenshots

| Login | Investment Pools |
|-------|-----------------|
| ![Login](docs/images/login.png) | ![Pools](docs/images/pools.png) |

| Portfolio | Pool Detail |
|-----------|------------|
| ![Portfolio](docs/images/portfolio.png) | ![Pool Detail](docs/images/pool-detail.png) |

---

## What Is DeepRock?

DeepRock lets investors put USDC into on-chain pools backed by real-world assets. Pools are NAV-priced daily to reflect actual yield. No seed phrases. Wallets are created with a passkey (biometric). Gas is covered by an ERC-4337 Paymaster so investors only ever deal with USDC.

---

## Features

- **RWA investment pools**: USDC deposits with daily NAV updates that reflect real yield
- **Biometric auth**: Passkey (WebAuthn/P256) wallet creation, no seed phrases
- **Gasless transactions**: ERC-4337 Paymaster covers gas so investors only need USDC
- **Portfolio dashboard**: Track positions, yields, and transaction history
- **Document vault**: On-chain document registry for compliance materials
- **Smart account wallets**: P256 smart wallets with biometric signing

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Blockchain | Avalanche (Fuji Testnet), Hardhat, Solidity 0.8.24 |
| Account Abstraction | ERC-4337, P256SmartWallet, RWAPaymaster |
| Auth | WebAuthn / Passkeys (SimpleWebAuthn) |
| Backend | Node.js, TypeScript, Relayer, Indexer |
| State | Zustand, viem |

---

## Testing the App

The app runs on Avalanche Fuji testnet. No real funds needed.

---

### Step 1: Create an account

Go to [deeprock-app.vercel.app](https://deeprock-app.vercel.app) and click **Launch App**.

You have three sign-in options:

**Passkey (recommended)**: Click "Sign in with Passkey". Your device creates a biometric credential (Face ID, fingerprint, or PIN). No password, no seed phrase. A smart wallet is generated and linked to your passkey automatically.

**Google**: Click "Google" for a quick sign-in. A smart wallet is created and linked to your Google account.

**MetaMask**: Click "MetaMask" and connect your wallet if you already have one.

---

### Step 2: Get test USDC

Once logged in, go to the **Portfolio** page. Click the **"Get Test USDC"** button. This mints test USDC directly to your smart wallet. No faucet needed.

---

### Step 3: Browse the pools

Click **Pools** in the sidebar. You will see five categories:

- **Treasury Bills**: Short-duration government-backed instruments, lower risk, lower APY
- **Real Estate**: Tokenized property exposure
- **Private Credit**: Higher yield, longer lock periods
- **Corporate Bonds**: Investment-grade debt instruments
- **Commodities**: Commodity-backed asset pools

Click any pool to see the APY, TVL, lock period, risk rating, and minimum deposit.

---

### Step 4: Make an investment

1. Open a pool and click **Invest**
2. Enter the USDC amount
3. Confirm with your passkey (biometric) or wallet
4. The transaction is submitted via the ERC-4337 Paymaster. Gas is covered — you only spend USDC

---

### Step 5: Track your portfolio

Go to **Portfolio** to see:

- Total balance and 30-day performance
- Active investments with current value and APY
- Allocation breakdown by pool category
- Portfolio health score

---

### Step 6: Withdraw

Open any active investment from the portfolio and click **Withdraw**. If the pool has a lock period, withdrawals are available after it expires. Flexible pools allow withdrawal any time.

---

## Smart Contracts

| Contract | Description |
|----------|-------------|
| `RWAPool` | Investment pool with USDC deposits, NAV-based pricing, fee logic |
| `P256SmartWallet` | ERC-4337 smart wallet with biometric P256 signature verification |
| `BiometricRegistry` | On-chain registry mapping passkeys to wallet addresses |
| `RWAPaymaster` | Sponsors gas for verified smart wallet users |
| `P256WalletFactory` | Factory for deterministic smart wallet deployment |

---

## Architecture

```
Investor
    |
    v
Passkey authentication (WebAuthn)
    |
    v
P256 smart wallet (ERC-4337)
    |
    +-- Deposit USDC -> RWAPool
    |       |
    |       v
    |   NAV-priced pool shares issued
    |   (backed by treasury bills / private credit / real estate)
    |
    +-- Withdraw -> USDC returned at current NAV

RWAPaymaster covers all gas costs
```

---

## Running Locally

```bash
git clone https://github.com/dmustapha/deeprock.git
cd deeprock
npm install

# Start frontend
npm run frontend:dev

# Start backend
npm run backend:dev

# Compile contracts
npm run contracts:compile
```

---

## Project Structure

```
deeprock/
├── frontend/          # Next.js app
│   ├── src/app/
│   │   ├── (app)/
│   │   │   ├── pools/       # Browse and invest in RWA pools
│   │   │   ├── portfolio/   # Track your positions
│   │   │   └── documents/   # Compliance documents
│   │   └── (auth)/          # Passkey login / registration
├── backend/           # Node.js relayer + indexer
│   └── src/
│       ├── routes/    # REST API (pools, portfolio, auth, relayer)
│       └── services/  # Indexer, UserOp relayer, NAV updater
└── contracts/         # Solidity smart contracts
    └── src/
        ├── RWAPool.sol
        ├── P256SmartWallet.sol
        ├── BiometricRegistry.sol
        └── RWAPaymaster.sol
```

---

## License

MIT
