# RWA Gateway Architecture Document
## Phase 6: Infrastructure, DevOps & Integration Flows

**Version:** 1.0
**Date:** February 4, 2026
**Status:** DRAFT
**Project:** RWA Gateway - Biometric Real-World Asset Tokenization on Avalanche

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Infrastructure Architecture](#2-infrastructure-architecture)
3. [CI/CD Pipeline](#3-cicd-pipeline)
4. [Event Indexing & Background Processing](#4-event-indexing--background-processing)
5. [Relayer Service Architecture](#5-relayer-service-architecture)
6. [Testing Architecture](#6-testing-architecture)
7. [Monitoring & Observability](#7-monitoring--observability)
8. [End-to-End Integration Flows](#8-end-to-end-integration-flows)
9. [Disaster Recovery](#9-disaster-recovery)
10. [Operational Runbooks](#10-operational-runbooks)

---

## 1. Executive Summary

The RWA Gateway infrastructure is designed around three core principles: **simplicity** (leveraging managed services for rapid iteration), **reliability** (event-driven architecture with guaranteed delivery), and **security** (defense-in-depth with multiple validation layers). The deployment architecture uses Vercel for frontend and API hosting, managed PostgreSQL for persistence, Upstash Redis for caching and job queues, and Avalanche C-Chain for blockchain state.

**Key Infrastructure Decisions:**
- Single-region deployment (MVP) with multi-region scalability path
- GitHub Actions for CI/CD with automated quality gates
- Event-driven blockchain indexing with reorg handling
- Meta-transaction relayer for gasless user experience
- Comprehensive monitoring with Vercel Analytics and Sentry

**Deployment Model:**
```
                    Production Environment

    +-------------+     +-------------+     +-------------+
    |   Vercel    |     |  Supabase   |     |   Upstash   |
    |   (CDN +    |     | (PostgreSQL)|     |   (Redis)   |
    |    API)     |     |             |     |             |
    +------+------+     +------+------+     +------+------+
           |                   |                   |
           +-------------------+-------------------+
                               |
                    +----------+----------+
                    |   Avalanche C-Chain |
                    |   (Smart Contracts) |
                    +---------------------+
```

---

## 2. Infrastructure Architecture

### 2.1 Cloud Architecture Diagram

```
+-----------------------------------------------------------------------------------+
|                           INFRASTRUCTURE TOPOLOGY                                   |
+-----------------------------------------------------------------------------------+

                                    INTERNET
                                        |
                          +-------------+-------------+
                          |      Cloudflare DNS       |
                          |   (Optional: DDoS Shield) |
                          +-------------+-------------+
                                        |
                    +-------------------+-------------------+
                    |                                       |
                    v                                       v
    +-------------------------------+       +-------------------------------+
    |        VERCEL EDGE CDN        |       |     EXTERNAL SERVICES         |
    |                               |       |                               |
    |  +-------------------------+  |       |  +-------------------------+  |
    |  |   Edge Functions       |  |       |  |  Avalanche RPC Nodes    |  |
    |  |   - Rate Limiting      |  |       |  |  - api.avax.network     |  |
    |  |   - Geo-routing        |  |       |  |  - Infura (fallback)    |  |
    |  |   - Request ID inject  |  |       |  +-------------------------+  |
    |  +-------------------------+  |       |                               |
    |                               |       |  +-------------------------+  |
    |  +-------------------------+  |       |  |  KYC Provider API       |  |
    |  |   Static Assets        |  |       |  |  - Synaps/Sumsub        |  |
    |  |   - Next.js pages      |  |       |  |  - Webhook callbacks    |  |
    |  |   - Images/fonts       |  |       |  +-------------------------+  |
    |  |   - JS bundles         |  |       |                               |
    |  +-------------------------+  |       |  +-------------------------+  |
    |                               |       |  |  Sentry Error Tracking  |  |
    +-------------------------------+       |  +-------------------------+  |
                    |                       +-------------------------------+
                    v
    +-------------------------------+
    |       VERCEL SERVERLESS       |
    |                               |
    |  +-------------------------+  |
    |  |   Next.js API Routes   |  |
    |  |   /api/auth/*          |  |
    |  |   /api/pools/*         |  |
    |  |   /api/portfolio/*     |  |
    |  |   /api/credentials/*   |  |
    |  +-------------------------+  |
    |                               |
    |  +-------------------------+  |
    |  |   Background Workers   |  |
    |  |   (Vercel Cron Jobs)   |  |
    |  +-------------------------+  |
    +-------------------------------+
                    |
      +-------------+-------------+
      |             |             |
      v             v             v
+-----------+ +-----------+ +-----------+
| Supabase  | |  Upstash  | | Avalanche |
|PostgreSQL | |   Redis   | |  C-Chain  |
|           | |           | |           |
| - Users   | | - Session | | - Biometric|
| - Pools   | | - Cache   | |   Registry|
| - Invests | | - Queue   | | - Cred    |
| - Docs    | | - Limits  | |   Verifier|
+-----------+ +-----------+ | - RWA     |
                            |   Gateway |
                            +-----------+
```

### 2.2 Service Topology

| Component | Service Provider | Tier | Purpose |
|-----------|------------------|------|---------|
| **Frontend** | Vercel | Pro (free for hackathon) | Next.js hosting, CDN, edge functions |
| **API** | Vercel Serverless | Pro | API routes, WebSocket (limited) |
| **Database** | Supabase | Free | PostgreSQL 16, 500MB storage |
| **Cache/Queue** | Upstash | Free | Redis 7.x, 10K commands/day |
| **Blockchain RPC** | Avalanche Public | Free | Primary RPC endpoint |
| **Blockchain RPC (Backup)** | Infura | Free | Fallback RPC endpoint |
| **Error Tracking** | Sentry | Free | Error aggregation, performance |
| **Analytics** | Vercel Analytics | Free | Page views, web vitals |
| **Domain** | Vercel | Free | *.vercel.app subdomain |

### 2.3 Network Architecture

```
+-----------------------------------------------------------------------------------+
|                            NETWORK SECURITY ZONES                                  |
+-----------------------------------------------------------------------------------+

    ZONE 1: PUBLIC                  ZONE 2: PRIVATE                ZONE 3: RESTRICTED
    (Internet-facing)               (Internal services)            (Blockchain/Secrets)

    +-------------------+           +-------------------+          +-------------------+
    |                   |           |                   |          |                   |
    |  Vercel Edge      |           |  Supabase DB      |          |  Relayer Wallet   |
    |  - HTTPS only     |           |  - SSL connection |          |  - Private key    |
    |  - WAF enabled    |  -------> |  - IP allowlist   |  ------> |  - HSM (future)   |
    |  - Rate limited   |           |  - Row-level sec  |          |  - Multi-sig      |
    |                   |           |                   |          |                   |
    +-------------------+           +-------------------+          +-------------------+

    +-------------------+           +-------------------+          +-------------------+
    |                   |           |                   |          |                   |
    |  API Routes       |           |  Upstash Redis    |          |  Contract Admin   |
    |  - JWT auth       |           |  - TLS required   |          |  - Timelock       |
    |  - Input validate |  -------> |  - Password auth  |  ------> |  - Multi-sig      |
    |  - CORS enforced  |           |                   |          |    (production)   |
    |                   |           |                   |          |                   |
    +-------------------+           +-------------------+          +-------------------+


TRAFFIC FLOW:
============

Browser --> Vercel Edge --> API Routes --> Database/Cache --> Blockchain
   ^                            |
   |                            v
   +-------- WebSocket --------[Real-time updates]


PORT ASSIGNMENTS:
================
Production (Vercel):
- HTTPS: 443 (automatic)
- WebSocket: 443 (same origin)

Development (Local):
- Frontend: 3000 (Next.js)
- Database: 5432 (PostgreSQL)
- Redis: 6379 (Redis)
- WebSocket: 3001 (Socket.io)
```

### 2.4 Scaling Strategy

```
+-----------------------------------------------------------------------------------+
|                           HORIZONTAL SCALING MODEL                                 |
+-----------------------------------------------------------------------------------+

    USER LOAD              INFRASTRUCTURE RESPONSE              COST ESTIMATE
    =========              ======================              ==============

    0 - 1,000 users        Vercel Free + Supabase Free         $0/month
    |                      |
    |                      +-- Single PostgreSQL instance
    |                      +-- Single Redis instance
    |                      +-- Vercel auto-scaling (free tier)
    |
    1,000 - 10,000 users   Vercel Pro + Supabase Pro           $50-100/month
    |                      |
    |                      +-- PostgreSQL with connection pooling
    |                      +-- Upstash Pro (higher limits)
    |                      +-- Consider read replica
    |
    10,000 - 50,000 users  Vercel Enterprise + Dedicated DB    $500-1000/month
    |                      |
    |                      +-- Primary + Read replicas
    |                      +-- Redis cluster
    |                      +-- Multiple relayer wallets
    |                      +-- Geographic distribution
    |
    50,000+ users          Custom Infrastructure               $2000+/month
                           |
                           +-- Kubernetes cluster
                           +-- Multi-region deployment
                           +-- Dedicated Avalanche Subnet (optional)
                           +-- Enterprise RPC provider


SCALING TRIGGERS:
================

| Metric                    | Threshold      | Action                           |
|---------------------------|----------------|----------------------------------|
| API response time (p95)   | > 500ms        | Add read replica, optimize cache |
| Database connections      | > 80% pool     | Increase pool size, add replica  |
| Redis memory usage        | > 80%          | Upgrade tier, eviction policy    |
| Error rate                | > 1%           | Investigate, scale if load-based |
| Relayer balance           | < 0.5 AVAX     | Alert + auto-refill              |
| Transaction queue depth   | > 100 pending  | Add relayer wallet               |


VERTICAL SCALING LIMITS:
=======================

| Component      | Free Tier Limit    | Pro Tier Limit      | Note                    |
|----------------|--------------------|--------------------|-------------------------|
| Vercel         | 100GB bandwidth    | 1TB bandwidth      | Auto-scales horizontally|
| Supabase       | 500MB storage      | 8GB storage        | Can add replicas        |
| Upstash        | 10K commands/day   | 1M commands/day    | Serverless, no cap      |
| Avalanche RPC  | Rate limited       | Higher limits      | Use multiple providers  |
```

### 2.5 Environment Configuration

```
+-----------------------------------------------------------------------------------+
|                         ENVIRONMENT VARIABLE MATRIX                                |
+-----------------------------------------------------------------------------------+

| Variable                        | Development (Fuji)      | Production (Mainnet)  |
|---------------------------------|-------------------------|-----------------------|
| NEXT_PUBLIC_CHAIN_ID            | 43113                   | 43114                 |
| NEXT_PUBLIC_RPC_URL             | https://api.avax-test.network/ext/bc/C/rpc | https://api.avax.network/ext/bc/C/rpc |
| NEXT_PUBLIC_APP_URL             | http://localhost:3000   | https://rwa-gateway.vercel.app |
| NEXT_PUBLIC_BIOMETRIC_REGISTRY  | 0x... (Fuji address)    | 0x... (Mainnet address) |
| NEXT_PUBLIC_CREDENTIAL_VERIFIER | 0x... (Fuji address)    | 0x... (Mainnet address) |
| NEXT_PUBLIC_RWA_GATEWAY         | 0x... (Fuji address)    | 0x... (Mainnet address) |
| NEXT_PUBLIC_DOCUMENT_SEAL       | 0x... (Fuji address)    | 0x... (Mainnet address) |
|                                 |                         |                       |
| DATABASE_URL                    | postgresql://localhost:5432/rwa_dev | [Supabase connection string] |
| REDIS_URL                       | redis://localhost:6379  | [Upstash connection string] |
| JWT_SECRET                      | dev-secret-32-chars-min | [Generated secure secret] |
| RELAYER_PRIVATE_KEY             | [Fuji test wallet]      | [Secured mainnet wallet] |
| WEBAUTHN_RP_NAME                | RWA Gateway (Dev)       | RWA Gateway           |
| WEBAUTHN_RP_ID                  | localhost               | rwa-gateway.vercel.app |
| SENTRY_DSN                      | (optional)              | [Sentry project DSN]  |
| INFURA_API_KEY                  | [Infura API key]        | [Infura API key]      |


SECRET MANAGEMENT:
=================

Development:
- .env.local (gitignored)
- Local password manager for sensitive values

Production:
- Vercel Environment Variables (encrypted at rest)
- Separate values for Preview vs Production deployments
- No secrets in repository

Rotation Policy:
- JWT_SECRET: Rotate monthly (grace period for existing tokens)
- RELAYER_PRIVATE_KEY: Rotate quarterly or after suspected compromise
- DATABASE_URL: Managed by Supabase, rotate on security events
- API Keys: Rotate quarterly
```

---

## 3. CI/CD Pipeline

### 3.1 Pipeline Architecture Diagram

```mermaid
flowchart TB
    subgraph "GitHub Repository"
        PUSH[Push to Branch]
        PR[Pull Request]
        MAIN[Push to Main]
    end

    subgraph "Quality Gates"
        LINT[Lint & Format Check]
        TYPE[TypeScript Check]
        SLITHER[Slither Analysis]
        UNIT[Unit Tests]
        CONTRACT[Contract Tests]
        E2E[E2E Tests]
    end

    subgraph "Build Stage"
        COMPILE[Compile Contracts]
        BUILD[Build Next.js]
        DOCKER[Build Docker Images]
    end

    subgraph "Deploy Stage"
        PREVIEW[Deploy Preview]
        STAGING[Deploy Staging]
        PROD[Deploy Production]
        VERIFY[Verify Contracts]
    end

    subgraph "Post-Deploy"
        SMOKE[Smoke Tests]
        MONITOR[Enable Monitoring]
        NOTIFY[Notify Team]
    end

    PUSH --> PR
    PR --> LINT
    LINT --> TYPE
    TYPE --> SLITHER
    SLITHER --> UNIT
    UNIT --> CONTRACT
    CONTRACT --> BUILD
    BUILD --> PREVIEW
    PREVIEW --> E2E

    MAIN --> LINT
    E2E --> STAGING
    STAGING --> SMOKE
    SMOKE --> PROD
    PROD --> VERIFY
    VERIFY --> MONITOR
    MONITOR --> NOTIFY
```

### 3.2 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'
  PNPM_VERSION: '8'

jobs:
  # ============================================================
  # STAGE 1: Code Quality Checks (Parallel)
  # ============================================================

  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run ESLint
        run: pnpm lint

      - name: Run Prettier check
        run: pnpm format:check

      - name: Run Solhint
        run: pnpm lint:contracts

  typecheck:
    name: TypeScript Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run TypeScript compiler
        run: pnpm typecheck

  security:
    name: Security Analysis
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Python (for Slither)
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Slither
        run: pip install slither-analyzer

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Compile contracts
        run: pnpm hardhat compile

      - name: Run Slither analysis
        run: slither . --config-file slither.config.json
        continue-on-error: false

  # ============================================================
  # STAGE 2: Test Suite (Depends on quality checks)
  # ============================================================

  unit-tests:
    name: Unit Tests (Vitest)
    needs: [lint, typecheck]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run unit tests
        run: pnpm test:unit --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unit

  contract-tests:
    name: Contract Tests (Hardhat)
    needs: [lint, typecheck, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run contract tests
        run: pnpm test:contracts --coverage

      - name: Check coverage threshold
        run: |
          COVERAGE=$(cat coverage/contracts/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 95" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 95% threshold"
            exit 1
          fi

  integration-tests:
    name: Integration Tests
    needs: [unit-tests, contract-tests]
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: rwa_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Setup test database
        run: pnpm prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/rwa_test

      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/rwa_test
          REDIS_URL: redis://localhost:6379

  # ============================================================
  # STAGE 3: Build (Depends on tests)
  # ============================================================

  build:
    name: Build Application
    needs: [integration-tests]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build Next.js
        run: pnpm build
        env:
          NEXT_PUBLIC_CHAIN_ID: 43113
          NEXT_PUBLIC_RPC_URL: https://api.avax-test.network/ext/bc/C/rpc

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: nextjs-build
          path: .next
          retention-days: 7

  # ============================================================
  # STAGE 4: Deploy Preview (PRs only)
  # ============================================================

  deploy-preview:
    name: Deploy Preview
    if: github.event_name == 'pull_request'
    needs: [build]
    runs-on: ubuntu-latest
    environment:
      name: preview
      url: ${{ steps.deploy.outputs.url }}
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel Preview
        id: deploy
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

      - name: Comment PR with preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Deploy Preview Ready\n\nURL: ${{ steps.deploy.outputs.url }}\n\nCommit: ${{ github.sha }}`
            })

  # ============================================================
  # STAGE 5: E2E Tests (Against Preview)
  # ============================================================

  e2e-tests:
    name: E2E Tests (Playwright)
    needs: [deploy-preview]
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Install Playwright browsers
        run: pnpm exec playwright install --with-deps chromium

      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          BASE_URL: ${{ needs.deploy-preview.outputs.url }}
          TEST_USER_EMAIL: test@example.com

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-results
          path: playwright-report

  # ============================================================
  # STAGE 6: Production Deploy (Main branch only)
  # ============================================================

  deploy-production:
    name: Deploy Production
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: [build]
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://rwa-gateway.vercel.app
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  # ============================================================
  # STAGE 7: Post-Deploy Verification
  # ============================================================

  verify-contracts:
    name: Verify Contracts on Snowtrace
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: [deploy-production]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Verify BiometricRegistry
        run: |
          pnpm hardhat verify --network mainnet \
            ${{ secrets.BIOMETRIC_REGISTRY_ADDRESS }} \
        continue-on-error: true

      - name: Verify CredentialVerifier
        run: |
          pnpm hardhat verify --network mainnet \
            ${{ secrets.CREDENTIAL_VERIFIER_ADDRESS }} \
            ${{ secrets.BIOMETRIC_REGISTRY_ADDRESS }}
        continue-on-error: true

  smoke-tests:
    name: Production Smoke Tests
    needs: [deploy-production]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Health check - Frontend
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://rwa-gateway.vercel.app)
          if [ $STATUS -ne 200 ]; then
            echo "Frontend health check failed with status $STATUS"
            exit 1
          fi

      - name: Health check - API
        run: |
          STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://rwa-gateway.vercel.app/api/health)
          if [ $STATUS -ne 200 ]; then
            echo "API health check failed with status $STATUS"
            exit 1
          fi

      - name: Check blockchain connectivity
        run: |
          RESPONSE=$(curl -s https://rwa-gateway.vercel.app/api/health/blockchain)
          if ! echo $RESPONSE | jq -e '.connected' > /dev/null; then
            echo "Blockchain connectivity check failed"
            exit 1
          fi

  notify:
    name: Notify Team
    needs: [smoke-tests, verify-contracts]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Send Slack notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
        if: env.SLACK_WEBHOOK_URL != ''
```

### 3.3 Quality Gates Definition

```
+-----------------------------------------------------------------------------------+
|                            QUALITY GATE MATRIX                                     |
+-----------------------------------------------------------------------------------+

| Gate                  | Tool           | Threshold        | Blocking? | Stage    |
|-----------------------|----------------|------------------|-----------|----------|
| Linting (TypeScript)  | ESLint         | 0 errors         | Yes       | Lint     |
| Linting (Solidity)    | Solhint        | 0 errors         | Yes       | Lint     |
| Formatting            | Prettier       | No diff          | Yes       | Lint     |
| Type checking         | tsc            | 0 errors         | Yes       | Type     |
| Security (Contracts)  | Slither        | 0 high/critical  | Yes       | Security |
| Unit test coverage    | Vitest         | >= 80% lines     | Yes       | Test     |
| Contract coverage     | Hardhat        | >= 95% lines     | Yes       | Test     |
| E2E critical paths    | Playwright     | 100% pass        | Yes       | E2E      |
| Build success         | Next.js        | 0 errors         | Yes       | Build    |
| Smoke tests           | Custom         | 100% pass        | Yes       | Deploy   |


GATE BYPASS RULES:
=================

| Scenario                          | Allowed Bypass                              |
|-----------------------------------|---------------------------------------------|
| Hotfix for production incident    | Skip E2E tests, require manual approval     |
| Documentation-only changes        | Skip all tests, lint only                   |
| Dependency updates (Dependabot)   | Skip Slither (may have false positives)     |
| Emergency security patch          | Expedited review, post-deploy audit         |

Bypass requires:
1. GitHub issue documenting reason
2. Approval from 2+ maintainers
3. Follow-up PR to restore coverage within 48h
```

### 3.4 Deployment Strategies

```
+-----------------------------------------------------------------------------------+
|                          DEPLOYMENT STRATEGIES                                     |
+-----------------------------------------------------------------------------------+

CURRENT (MVP): ROLLING DEPLOYMENT
================================

    Vercel handles this automatically:

    1. New deployment built in parallel
    2. Traffic gradually shifted
    3. Old deployment kept warm for 10 minutes
    4. Automatic rollback if health checks fail

    [Old Instance] -----> [Traffic] -----> [New Instance]
         100%                  |                 0%
                               |
         50%  <----------------+--------------> 50%
                               |
         0%   <----------------+--------------> 100%


FUTURE: BLUE-GREEN DEPLOYMENT
============================

    For critical production releases:

    +-------------------+              +-------------------+
    |   BLUE (Live)     |              |   GREEN (Staging) |
    |                   |              |                   |
    |  - Production DB  |              |  - Shadow DB      |
    |  - Live contracts |              |  - Test contracts |
    |  - Real users     |              |  - Smoke tests    |
    +-------------------+              +-------------------+
            |                                   |
            +-----------------------------------+
                            |
                      [Load Balancer]
                            |
                       [DNS Switch]

    Cutover process:
    1. Deploy to GREEN
    2. Run smoke tests on GREEN
    3. Warm up GREEN caches
    4. DNS switch BLUE -> GREEN
    5. Monitor for 15 minutes
    6. Previous BLUE becomes new GREEN


CANARY DEPLOYMENT (Future at Scale)
===================================

    For high-risk changes:

    +-------------------+
    |   STABLE (95%)    |  <-- Most traffic
    +-------------------+
            |
    +-------------------+
    |   CANARY (5%)     |  <-- New version
    +-------------------+

    Metrics monitored:
    - Error rate (must be <= stable)
    - Latency (must be <= stable + 10%)
    - Conversion rate (must be >= stable - 5%)

    Automatic rollback if metrics degrade
```

### 3.5 Rollback Procedures

```
+-----------------------------------------------------------------------------------+
|                            ROLLBACK PROCEDURES                                     |
+-----------------------------------------------------------------------------------+

SCENARIO 1: Vercel Deployment Failure
=====================================

Automatic:
- Vercel retains last 10 successful deployments
- Dashboard: Settings > Deployments > Redeploy previous version
- CLI: vercel rollback [deployment-url]

Time to rollback: < 30 seconds


SCENARIO 2: Database Migration Failure
=====================================

Process:
1. Identify failing migration in Prisma logs
2. Check if migration was partially applied

If clean failure (no changes):
$ pnpm prisma migrate resolve --rolled-back [migration_name]

If partial application:
1. Assess data state
2. Write corrective migration
3. Apply forward (never modify applied migrations)

Time to recover: 5-30 minutes


SCENARIO 3: Smart Contract Bug (No Upgrade Path)
================================================

Immediate actions:
1. Call pause() on affected contracts
2. Assess impact and funds at risk
3. Communicate to users

Recovery options:
A. Deploy patched contracts + migrate state
B. Time-lock migration for funds
C. Social layer coordination (worst case)

Time to recover: Hours to days


SCENARIO 4: Compromised Relayer Wallet
======================================

Immediate actions:
1. Rotate relayer private key
2. Assess unauthorized transactions
3. Fund new relayer wallet

Recovery steps:
1. Generate new wallet
2. Update RELAYER_PRIVATE_KEY in Vercel
3. Redeploy application
4. Monitor for 24h

Time to recover: 15-30 minutes


ROLLBACK DECISION MATRIX:
========================

| Symptom                      | Immediate Action        | Rollback?        |
|------------------------------|-------------------------|------------------|
| Error rate > 5%              | Alert on-call           | If > 10%, yes    |
| API latency > 2s (p95)       | Check database load     | If > 5s, yes     |
| Blank page / 500 errors      | Check Vercel logs       | Immediate yes    |
| Contract revert spike        | Check transaction data  | Pause + assess   |
| User reports data loss       | Stop writes, assess     | Immediate yes    |
```

---

## 4. Event Indexing & Background Processing

### 4.1 Event Indexer Architecture

```
+-----------------------------------------------------------------------------------+
|                         EVENT INDEXER ARCHITECTURE                                 |
+-----------------------------------------------------------------------------------+

                         AVALANCHE C-CHAIN
                               |
                               | WebSocket subscription
                               | (eth_subscribe)
                               |
                    +----------v----------+
                    |   EVENT LISTENER    |
                    |                     |
                    |  - Filter by topics |
                    |  - Parse log data   |
                    |  - Validate events  |
                    +----------+----------+
                               |
                               | Raw events
                               |
                    +----------v----------+
                    |   CONFIRMATION      |
                    |   MANAGER           |
                    |                     |
                    |  - Track block #    |
                    |  - Wait for confs   |
                    |  - Handle reorgs    |
                    +----------+----------+
                               |
                               | Confirmed events
                               |
                    +----------v----------+
                    |   BULLMQ QUEUE      |
                    |   (index-events)    |
                    |                     |
                    |  - Priority queue   |
                    |  - Retry logic      |
                    |  - Dead letter Q    |
                    +----------+----------+
                               |
                               | Job dispatch
                               |
         +---------------------+---------------------+
         |                     |                     |
         v                     v                     v
+----------------+    +----------------+    +----------------+
|  BIOMETRIC     |    |  CREDENTIAL    |    |  INVESTMENT    |
|  HANDLER       |    |  HANDLER       |    |  HANDLER       |
|                |    |                |    |                |
| - Sync user    |    | - Update cred  |    | - Record       |
| - Cache pubkey |    | - Index status |    |   investment   |
| - Emit WS      |    | - Emit WS      |    | - Update pool  |
+-------+--------+    +-------+--------+    +-------+--------+
        |                     |                     |
        +---------------------+---------------------+
                              |
                    +---------v---------+
                    |    POSTGRESQL     |
                    |    (indexed_events|
                    |     table)        |
                    +-------------------+


EVENT TYPE TO HANDLER MAPPING:
=============================

| Event                    | Contract            | Handler              | Priority |
|--------------------------|---------------------|----------------------|----------|
| BiometricRegistered      | BiometricRegistry   | handleBiometricReg   | HIGH     |
| IdentityRevoked          | BiometricRegistry   | handleBiometricRev   | HIGH     |
| CredentialIssued         | CredentialVerifier  | handleCredentialIss  | HIGH     |
| CredentialRevoked        | CredentialVerifier  | handleCredentialRev  | HIGH     |
| PoolCreated              | RWAGateway          | handlePoolCreated    | MEDIUM   |
| Investment               | RWAGateway          | handleInvestment     | HIGH     |
| Redemption               | RWAGateway          | handleRedemption     | HIGH     |
| YieldDistributed         | RWAGateway          | handleYieldDist      | MEDIUM   |
| DocumentSealed           | DocumentSeal        | handleDocSealed      | LOW      |
| Transfer (RWAToken)      | RWAToken            | handleTokenTransfer  | MEDIUM   |
```

### 4.2 Message Queue Design

```typescript
// /src/lib/queue.ts

import { Queue, Worker, QueueEvents } from 'bullmq';
import { redis } from './redis';
import { logger } from './logger';

// Queue definitions
export const queues = {
  indexEvents: new Queue('index-events', {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 1000, // Keep last 1000 completed jobs
      removeOnFail: 5000,     // Keep last 5000 failed jobs for debugging
    },
  }),

  yieldCalculation: new Queue('yield-calculation', {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'fixed', delay: 5000 },
    },
  }),

  notifications: new Queue('notifications', {
    connection: redis,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
    },
  }),
};

// Queue configuration table
/*
+-----------------------------------------------------------------------------------+
|                           QUEUE CONFIGURATION                                      |
+-----------------------------------------------------------------------------------+

| Queue Name         | Concurrency | Rate Limit      | Retry Strategy           |
|--------------------|-------------|-----------------|--------------------------|
| index-events       | 5           | 100/minute      | Exponential (1s base)    |
| yield-calculation  | 1           | 10/minute       | Fixed (5s)               |
| notifications      | 10          | 50/minute       | Exponential (2s base)    |
| cleanup-sessions   | 1           | 1/minute        | Fixed (10s)              |
| health-check       | 1           | 12/minute       | None (fire-and-forget)   |

Dead Letter Queue Policy:
========================
- Jobs that fail all retry attempts go to DLQ
- DLQ retention: 7 days
- Alert if DLQ depth > 100 jobs
- Manual review required for DLQ items
*/
```

### 4.3 Job Scheduling

```
+-----------------------------------------------------------------------------------+
|                            BACKGROUND JOB SCHEDULE                                 |
+-----------------------------------------------------------------------------------+

| Job Name                 | Schedule          | Description                        |
|--------------------------|-------------------|------------------------------------|
| IndexEvents              | Continuous        | Process blockchain events          |
| UpdateYield              | */60 * * * *      | Calculate yield for all pools      |
| CheckExpiredCredentials  | 0 */6 * * *       | Flag credentials approaching expiry|
| SyncPoolStats            | */15 * * * *      | Update pool TVL, investor count    |
| CleanupSessions          | 0 0 * * *         | Remove expired JWT sessions        |
| HealthCheck              | */5 * * * *       | Verify RPC, database, Redis health |
| RelayerBalance           | */10 * * * *      | Check and alert on low balance     |
| DatabaseBackup           | 0 3 * * *         | Trigger Supabase backup            |


JOB IMPLEMENTATION PATTERN:
==========================

// /src/jobs/updateYield.ts

import { Job } from 'bullmq';
import { prisma } from '@/lib/prisma';
import { redis } from '@/lib/redis';
import { getPoolContract } from '@/lib/contracts';
import { logger } from '@/lib/logger';

interface UpdateYieldJobData {
  poolId?: string; // If not provided, update all pools
}

export async function processUpdateYield(job: Job<UpdateYieldJobData>) {
  const startTime = Date.now();
  const { poolId } = job.data;

  try {
    // 1. Get pools to update
    const pools = poolId
      ? [await prisma.pool.findUnique({ where: { id: poolId } })]
      : await prisma.pool.findMany({ where: { status: 'ACTIVE' } });

    // 2. Calculate yield for each pool
    for (const pool of pools.filter(Boolean)) {
      const contract = getPoolContract(pool.rwaTokenAddress);

      // Fetch on-chain data
      const totalSupply = await contract.totalSupply();
      const yieldAccrued = await contract.pendingYield();

      // Calculate APY
      const currentYield = calculateAPY(
        pool.totalDeposited,
        yieldAccrued,
        pool.lastYieldDistribution
      );

      // Update database
      await prisma.pool.update({
        where: { id: pool.id },
        data: {
          currentYieldBps: currentYield,
          lastYieldCalculation: new Date(),
        },
      });

      // Invalidate cache
      await redis.del(`pool:${pool.id}:yield`);
      await redis.del(`pools:list`);
    }

    const duration = Date.now() - startTime;
    logger.info({
      job: 'updateYield',
      poolsProcessed: pools.length,
      durationMs: duration
    });

    return { success: true, poolsProcessed: pools.length };

  } catch (error) {
    logger.error({ job: 'updateYield', error: error.message });
    throw error; // Will trigger retry
  }
}
```

### 4.4 Chain Reorg Handling

```
+-----------------------------------------------------------------------------------+
|                            CHAIN REORG HANDLING                                    |
+-----------------------------------------------------------------------------------+

REORG DETECTION FLOW:
====================

    Normal Flow:                    Reorg Detected:

    Block N confirmed               Block N confirmed
         |                               |
         v                               v
    Block N+1 confirmed             Block N+1 received
         |                               |
         v                               v
    Block N+2 confirmed             Block N+1' received (different hash!)
         |                               |
         v                               v
    Events indexed                  REORG DETECTED
                                         |
                                         v
                                    Rollback to N
                                         |
                                         v
                                    Re-index N+1', N+2'


CONFIRMATION REQUIREMENTS:
=========================

| Network | Required Confirmations | Reasoning                           |
|---------|------------------------|-------------------------------------|
| Fuji    | 2 blocks               | Test network, faster iteration      |
| Mainnet | 12 blocks              | ~24 seconds, very high finality     |


REORG HANDLING ALGORITHM:
========================

```typescript
// Pseudocode for reorg handling

interface BlockState {
  number: number;
  hash: string;
  parentHash: string;
  events: IndexedEvent[];
}

async function handleNewBlock(block: Block) {
  const lastIndexed = await getLastIndexedBlock();

  // Case 1: Normal progression
  if (block.parentHash === lastIndexed.hash) {
    await indexBlockEvents(block);
    return;
  }

  // Case 2: Potential reorg
  const reorgDepth = await detectReorgDepth(block, lastIndexed);

  if (reorgDepth > 0) {
    logger.warn({ reorgDepth, block: block.number });

    // Rollback indexed events
    await prisma.indexedEvent.deleteMany({
      where: {
        blockNumber: { gte: lastIndexed.number - reorgDepth }
      }
    });

    // Update checkpoint
    await setCheckpoint(lastIndexed.number - reorgDepth - 1);

    // Re-index from the fork point
    await reindexFromBlock(lastIndexed.number - reorgDepth);
  }

  // Case 3: Missed blocks
  if (block.number > lastIndexed.number + 1) {
    await backfillBlocks(lastIndexed.number + 1, block.number);
  }
}

async function detectReorgDepth(
  newBlock: Block,
  indexed: BlockState
): Promise<number> {
  let depth = 0;
  let checkBlock = indexed;

  while (depth < MAX_REORG_DEPTH) {
    const chainBlock = await provider.getBlock(checkBlock.number);

    if (chainBlock.hash === checkBlock.hash) {
      return depth;
    }

    depth++;
    checkBlock = await getIndexedBlock(checkBlock.number - 1);
  }

  throw new Error(`Reorg deeper than ${MAX_REORG_DEPTH} blocks`);
}
```

RECOVERY PROCEDURES:
===================

| Scenario                    | Action                                        |
|-----------------------------|-----------------------------------------------|
| Shallow reorg (1-3 blocks)  | Automatic: rollback + re-index                |
| Deep reorg (4-12 blocks)    | Alert + automatic recovery                    |
| Very deep reorg (>12)       | Halt indexer, manual intervention required    |
| Indexer crash               | Resume from last checkpoint                   |
| Database inconsistency      | Full re-index from genesis (last resort)      |
```

---

## 5. Relayer Service Architecture

### 5.1 Meta-Transaction Flow

```
+-----------------------------------------------------------------------------------+
|                          META-TRANSACTION FLOW                                     |
+-----------------------------------------------------------------------------------+

    USER DEVICE                   BACKEND                      BLOCKCHAIN
    ===========                   =======                      ==========

    1. User initiates action
       (e.g., invest $1000)
            |
            v
    2. Build message to sign
       {
         action: "invest",
         poolId: 1,
         amount: "1000000000",
         nonce: 42,
         deadline: 1706745600
       }
            |
            v
    3. WebAuthn signs message
       (biometric prompt)
            |
            | Signature (r, s)
            v
    +------------------+
    | POST /api/invest |
    | {                |
    |   poolId: 1,     |
    |   amount: ...,   |
    |   signature: ... |
    | }                |
    +--------+---------+
             |
             v
    +-----------------+
    | 4. Verify sig   |
    |    matches user |
    |    registered   |
    |    public key   |
    +-----------------+
             |
             v
    +-----------------+
    | 5. Rate limit   |
    |    check        |
    |    (10 tx/min)  |
    +-----------------+
             |
             v
    +-----------------+
    | 6. Build        |
    |    transaction  |
    +-----------------+
             |
             | Signed by relayer wallet
             v
    +-----------------------------------+
    | 7. Submit to Avalanche            |
    |    RWAGateway.invest(             |
    |      poolId,                      |
    |      amount,                      |
    |      userAddress,                 |
    |      biometricSignature           |
    |    )                              |
    +-----------------------------------+
             |
             | Transaction hash
             v
    +-----------------+
    | 8. On-chain     |
    |    verification |
    |    of biometric |
    |    signature    |
    +-----------------+
             |
             | Success/Revert
             v
    +-----------------+          +-----------------+
    | 9. Return       |          | Event indexed   |
    |    tx receipt   |          | to database     |
    +-----------------+          +-----------------+
             |
             v
    [User sees confirmation]


SECURITY MODEL:
==============

The relayer CANNOT:
- Act without a valid biometric signature
- Move funds to unauthorized addresses
- Execute functions not whitelisted
- Bypass on-chain verification

The relayer CAN:
- Pay gas on behalf of users
- Submit valid transactions
- Choose gas price (within limits)
- Order transactions (no MEV risk for RWA)
```

### 5.2 Gas Estimation and Management

```typescript
// /src/services/RelayerService.ts

import { ethers } from 'ethers';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

interface GasEstimation {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedCostWei: bigint;
  estimatedCostAvax: string;
}

export class RelayerService {
  private wallet: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;

  // Gas price bounds
  private readonly MAX_GAS_PRICE = ethers.parseUnits('100', 'gwei');
  private readonly MIN_GAS_PRICE = ethers.parseUnits('25', 'gwei');

  // Gas limits by operation
  private readonly GAS_LIMITS = {
    registerBiometric: 150_000n,
    issueCredential: 200_000n,
    invest: 300_000n,
    redeem: 250_000n,
    sealDocument: 100_000n,
  };

  async estimateGas(
    operation: keyof typeof this.GAS_LIMITS,
    contract: ethers.Contract,
    method: string,
    args: unknown[]
  ): Promise<GasEstimation> {
    // Get current gas prices
    const feeData = await this.provider.getFeeData();

    // Estimate gas for specific call
    let gasLimit: bigint;
    try {
      gasLimit = await contract[method].estimateGas(...args);
      // Add 20% buffer
      gasLimit = (gasLimit * 120n) / 100n;
    } catch {
      // Fallback to predefined limit
      gasLimit = this.GAS_LIMITS[operation];
    }

    // Cap gas price
    let maxFeePerGas = feeData.maxFeePerGas ?? this.MIN_GAS_PRICE;
    if (maxFeePerGas > this.MAX_GAS_PRICE) {
      maxFeePerGas = this.MAX_GAS_PRICE;
    }

    const estimatedCostWei = gasLimit * maxFeePerGas;

    return {
      gasLimit,
      gasPrice: feeData.gasPrice ?? this.MIN_GAS_PRICE,
      maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? ethers.parseUnits('2', 'gwei'),
      estimatedCostWei,
      estimatedCostAvax: ethers.formatEther(estimatedCostWei),
    };
  }

  async checkRelayerBalance(): Promise<{
    balance: bigint;
    balanceAvax: string;
    isLow: boolean;
    estimatedTxRemaining: number;
  }> {
    const balance = await this.provider.getBalance(this.wallet.address);
    const avgTxCost = ethers.parseEther('0.01'); // ~$0.30 at $30/AVAX

    const isLow = balance < ethers.parseEther('0.5');
    const estimatedTxRemaining = Number(balance / avgTxCost);

    if (isLow) {
      logger.warn({
        event: 'relayer_balance_low',
        balance: ethers.formatEther(balance),
        estimatedTxRemaining,
      });

      // Alert via Sentry/PagerDuty
      await this.sendLowBalanceAlert(balance);
    }

    return {
      balance,
      balanceAvax: ethers.formatEther(balance),
      isLow,
      estimatedTxRemaining,
    };
  }
}
```

### 5.3 Rate Limiting Implementation

```
+-----------------------------------------------------------------------------------+
|                           RATE LIMITING CONFIGURATION                              |
+-----------------------------------------------------------------------------------+

RATE LIMIT TIERS:
================

| User Type          | Requests/Minute | Requests/Hour | Daily Limit |
|--------------------|-----------------|---------------|-------------|
| Unauthenticated    | 20              | 100           | 500         |
| Authenticated      | 60              | 500           | 2000        |
| Verified Credential| 100             | 1000          | 5000        |
| Admin              | Unlimited       | Unlimited     | Unlimited   |

TRANSACTION-SPECIFIC LIMITS:
===========================

| Operation          | Per Minute | Per Hour | Daily      | Reasoning              |
|--------------------|------------|----------|------------|------------------------|
| Registration       | 1          | 5        | 10         | Prevent spam           |
| Authentication     | 5          | 30       | 100        | Normal login patterns  |
| Invest             | 3          | 20       | 50         | Gas cost protection    |
| Redeem             | 3          | 20       | 50         | Prevent manipulation   |
| Credential Request | 1          | 3        | 5          | KYC is slow anyway     |
| Document Seal      | 5          | 30       | 100        | Reasonable usage       |


IMPLEMENTATION:
==============

```typescript
// /src/middleware/rateLimit.ts

import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';
import { NextRequest, NextResponse } from 'next/server';

// Sliding window rate limiter
const rateLimiters = {
  default: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true,
    prefix: 'ratelimit:default',
  }),

  transaction: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:tx',
  }),

  registration: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: 'ratelimit:reg',
  }),
};

export async function rateLimitMiddleware(
  req: NextRequest,
  type: 'default' | 'transaction' | 'registration' = 'default'
) {
  // Get identifier (IP or user ID)
  const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? 'unknown';
  const userId = req.headers.get('x-user-id');
  const identifier = userId ?? ip;

  const limiter = rateLimiters[type];
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  // Set rate limit headers
  const headers = {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': reset.toString(),
  };

  if (!success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Try again in ${Math.ceil((reset - Date.now()) / 1000)} seconds.`,
          retryAfter: Math.ceil((reset - Date.now()) / 1000),
        },
      },
      { status: 429, headers }
    );
  }

  return { headers, remaining };
}
```

### 5.4 Relayer Security Considerations

```
+-----------------------------------------------------------------------------------+
|                          RELAYER SECURITY MODEL                                    |
+-----------------------------------------------------------------------------------+

THREAT MODEL:
============

| Threat                          | Mitigation                                     |
|---------------------------------|------------------------------------------------|
| Relayer key compromise          | Limited function access, low balance, rotation |
| Replay attacks                  | Nonce per user, deadline enforcement           |
| Front-running                   | No MEV risk for RWA (no price impact)          |
| Denial of service               | Rate limiting, multiple relayer support        |
| Unauthorized transactions       | On-chain biometric verification required       |
| Gas price manipulation          | Gas price caps, priority fee limits            |


RELAYER WALLET SECURITY:
=======================

Development:
- Fuji testnet wallet
- Private key in .env.local
- Low balance (1-2 test AVAX)

Production:
- Dedicated wallet (never reused)
- Private key in Vercel environment variables
- Minimum viable balance (~5 AVAX)
- Alert on low balance (<0.5 AVAX)
- Weekly balance audit

Future (at scale):
- Hardware Security Module (HSM)
- Multi-signature relayer pool
- Geographic distribution
- Auto-refill from treasury


TRANSACTION VALIDATION CHECKLIST:
================================

Before submitting ANY transaction, relayer verifies:

[ ] 1. User exists in database
[ ] 2. User has valid session (JWT not expired)
[ ] 3. Biometric signature is valid (verified locally first)
[ ] 4. Nonce is correct (prevents replay)
[ ] 5. Deadline has not passed
[ ] 6. Rate limit not exceeded
[ ] 7. Operation is whitelisted
[ ] 8. Gas price is within bounds
[ ] 9. Relayer has sufficient balance
[ ] 10. Contract address is whitelisted

If ANY check fails, transaction is rejected with specific error code.


AUDIT TRAIL:
===========

Every relayer transaction logs:
- User address
- Operation type
- Transaction hash
- Gas used
- Timestamp
- IP address (hashed)
- Success/failure
- Error message (if failed)

Logs retained for: 90 days
Accessible to: Admins only
Format: Structured JSON (Pino)
```

---

## 6. Testing Architecture

### 6.1 Test Pyramid Implementation

```
+-----------------------------------------------------------------------------------+
|                             TEST PYRAMID                                           |
+-----------------------------------------------------------------------------------+

                                    /\
                                   /  \
                                  /    \
                                 / E2E  \        5-10 tests
                                / Tests  \       (Critical user journeys)
                               /----------\
                              /            \
                             / Integration  \    20-50 tests
                            /    Tests       \   (API + Database + Chain)
                           /------------------\
                          /                    \
                         /     Unit Tests       \  200+ tests
                        /  (Components, Utils,   \ (Fast, isolated)
                       /    Services, Contracts)  \
                      /----------------------------\


TEST DISTRIBUTION BY LAYER:
==========================

| Layer              | Tool                    | Count  | Coverage | Run Time  |
|--------------------|-------------------------|--------|----------|-----------|
| Contract Unit      | Hardhat + Chai          | 100+   | 95%+     | 30s       |
| Contract Fuzz      | Hardhat                 | 20     | Critical | 2min      |
| Backend Unit       | Vitest                  | 80+    | 80%+     | 10s       |
| Backend Integration| Vitest + Supertest      | 30     | Core APIs| 45s       |
| Frontend Unit      | Vitest + Testing Library| 50+    | 70%+     | 15s       |
| E2E                | Playwright              | 10     | Critical | 3min      |
| WebAuthn Mock      | Custom + Playwright     | 5      | Auth flow| 1min      |


TOTAL TEST SUITE:
- Tests: ~300
- Run time (all): ~8 minutes
- Run time (unit only): ~1 minute
- CI parallelization: 4 workers
```

### 6.2 Test Environment Setup

```
+-----------------------------------------------------------------------------------+
|                          TEST ENVIRONMENT MATRIX                                   |
+-----------------------------------------------------------------------------------+

| Environment    | Database           | Redis            | Blockchain          |
|----------------|--------------------|-----------------|--------------------|
| Unit Tests     | Mock (in-memory)   | Mock            | Hardhat Network    |
| Integration    | PostgreSQL (Docker)| Redis (Docker)  | Hardhat Network    |
| E2E (Local)    | PostgreSQL (Docker)| Redis (Docker)  | Hardhat Network    |
| E2E (CI)       | PostgreSQL (Service)| Redis (Service) | Fuji Testnet       |
| Staging        | Supabase (Preview) | Upstash (Dev)   | Fuji Testnet       |
| Production     | Supabase (Prod)    | Upstash (Prod)  | Mainnet            |


DOCKER COMPOSE FOR TESTING:
==========================

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
      POSTGRES_DB: rwa_test
    ports:
      - '5433:5432'
    tmpfs:
      - /var/lib/postgresql/data  # RAM disk for speed
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U test']
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - '6380:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 5s
      retries: 5

  hardhat:
    build:
      context: .
      dockerfile: Dockerfile.hardhat
    ports:
      - '8545:8545'
    command: npx hardhat node --hostname 0.0.0.0
```

### 6.3 Mock Strategies

```
+-----------------------------------------------------------------------------------+
|                            MOCK STRATEGIES                                         |
+-----------------------------------------------------------------------------------+

WEBAUTHN MOCK (Critical for Testing):
====================================

```typescript
// /tests/mocks/webauthn.ts

import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
} from '@simplewebauthn/server';
import { p256 } from '@noble/curves/p256';

export class WebAuthnMock {
  private privateKey: Uint8Array;
  private publicKey: Uint8Array;
  private counter: number = 0;

  constructor() {
    // Generate deterministic key pair for testing
    this.privateKey = p256.utils.randomPrivateKey();
    this.publicKey = p256.getPublicKey(this.privateKey);
  }

  async createCredential(
    options: PublicKeyCredentialCreationOptions
  ): Promise<PublicKeyCredential> {
    const credentialId = crypto.randomUUID();

    // Build attestation response
    const clientDataJSON = this.encodeClientData({
      type: 'webauthn.create',
      challenge: options.challenge,
      origin: 'http://localhost:3000',
    });

    const attestationObject = this.buildAttestationObject();

    return {
      id: credentialId,
      rawId: this.base64ToBuffer(credentialId),
      type: 'public-key',
      response: {
        clientDataJSON: this.bufferToBase64(clientDataJSON),
        attestationObject: this.bufferToBase64(attestationObject),
      },
      getClientExtensionResults: () => ({}),
    };
  }

  async getAssertion(
    options: PublicKeyCredentialRequestOptions
  ): Promise<PublicKeyCredential> {
    this.counter++;

    const clientDataJSON = this.encodeClientData({
      type: 'webauthn.get',
      challenge: options.challenge,
      origin: 'http://localhost:3000',
    });

    const authenticatorData = this.buildAuthenticatorData();
    const signature = this.sign(clientDataJSON, authenticatorData);

    return {
      id: options.allowCredentials[0].id,
      rawId: this.base64ToBuffer(options.allowCredentials[0].id),
      type: 'public-key',
      response: {
        clientDataJSON: this.bufferToBase64(clientDataJSON),
        authenticatorData: this.bufferToBase64(authenticatorData),
        signature: this.bufferToBase64(signature),
      },
      getClientExtensionResults: () => ({}),
    };
  }

  // Get public key for on-chain registration
  getPublicKeyCoordinates(): { x: bigint; y: bigint } {
    const point = p256.ProjectivePoint.fromPrivateKey(this.privateKey);
    return {
      x: point.x,
      y: point.y,
    };
  }
}
```


BLOCKCHAIN MOCKS:
================

| Component           | Mock Strategy                                    |
|---------------------|--------------------------------------------------|
| RPC Provider        | Hardhat Network (fast, deterministic)            |
| Block confirmations | Instant mining, configurable delay               |
| Gas estimation      | Fixed values in test mode                        |
| Events              | Hardhat event matchers                           |
| Time manipulation   | hardhat_mine, evm_increaseTime                   |


DATABASE MOCKS:
==============

| Test Type      | Mock Strategy                                      |
|----------------|--------------------------------------------------|
| Unit tests     | Prisma mock client (jest-mock-extended)          |
| Integration    | Real PostgreSQL with test database               |
| E2E            | Real PostgreSQL, seeded test data                |


EXTERNAL SERVICE MOCKS:
======================

| Service        | Mock Strategy                                      |
|----------------|--------------------------------------------------|
| KYC Provider   | Mock webhook responses (MSW)                     |
| Sentry         | Disabled in test environment                     |
| Analytics      | Noop implementation                              |
```

### 6.4 Coverage Requirements

```
+-----------------------------------------------------------------------------------+
|                          COVERAGE REQUIREMENTS                                     |
+-----------------------------------------------------------------------------------+

COVERAGE THRESHOLDS:
===================

| Category                    | Lines  | Branches | Functions | Statements |
|-----------------------------|--------|----------|-----------|------------|
| Smart Contracts             | 95%    | 90%      | 100%      | 95%        |
| Backend Services            | 80%    | 75%      | 85%       | 80%        |
| Backend API Routes          | 85%    | 80%      | 90%       | 85%        |
| Frontend Components         | 70%    | 65%      | 75%       | 70%        |
| Frontend Hooks              | 80%    | 75%      | 85%       | 80%        |
| Utilities                   | 90%    | 85%      | 95%       | 90%        |


CRITICAL PATHS (100% Required):
==============================

Smart Contracts:
- BiometricRegistry.register()
- BiometricRegistry.verify()
- CredentialVerifier.issueCredential()
- CredentialVerifier.verifyCredential()
- RWAGateway.invest()
- RWAGateway.redeem()
- RWAToken._beforeTokenTransfer()

Backend:
- AuthService.verifyWebAuthn()
- RelayerService.submitTransaction()
- PoolService.processInvestment()
- CredentialService.issueCredential()

Frontend:
- BiometricButton authentication flow
- InvestmentForm submission
- CredentialVerification flow


COVERAGE EXCEPTIONS (Documented):
================================

| File/Pattern                  | Reason                           |
|-------------------------------|----------------------------------|
| **/migrations/**              | Generated Prisma migrations      |
| **/types/**                   | Type definitions only            |
| **/constants.ts               | Static configuration             |
| **/mocks/**                   | Test mocks                       |
```

---

## 7. Monitoring & Observability

### 7.1 Metrics Collection

```
+-----------------------------------------------------------------------------------+
|                           METRICS COLLECTION                                       |
+-----------------------------------------------------------------------------------+

APPLICATION METRICS:
===================

| Metric                        | Type      | Labels                    | Alert     |
|-------------------------------|-----------|---------------------------|-----------|
| http_requests_total           | Counter   | method, path, status      | -         |
| http_request_duration_seconds | Histogram | method, path              | p95 > 2s  |
| active_sessions               | Gauge     | -                         | > 10000   |
| authentication_attempts       | Counter   | type, success             | fail > 10%|
| transaction_submitted         | Counter   | type, success             | fail > 5% |
| transaction_gas_used          | Histogram | type                      | -         |
| relayer_balance_avax          | Gauge     | -                         | < 0.5     |
| queue_depth                   | Gauge     | queue_name                | > 100     |
| queue_processing_time         | Histogram | queue_name                | p95 > 30s |
| database_connections          | Gauge     | state                     | > 80%     |
| cache_hit_ratio               | Gauge     | cache_name                | < 70%     |


BUSINESS METRICS:
================

| Metric                        | Type      | Description                          |
|-------------------------------|-----------|--------------------------------------|
| users_registered_total        | Counter   | Total registered users               |
| users_verified_total          | Counter   | Users with valid credentials         |
| investments_total             | Counter   | Total investments made               |
| investments_value_usd         | Counter   | Total USD invested                   |
| redemptions_total             | Counter   | Total redemptions                    |
| pool_tvl_usd                  | Gauge     | Total value locked per pool          |
| active_investors              | Gauge     | Users with non-zero balance          |
| documents_sealed              | Counter   | Documents sealed on-chain            |


INFRASTRUCTURE METRICS (Vercel/Supabase):
========================================

| Metric                        | Source    | Alert Threshold                      |
|-------------------------------|-----------|--------------------------------------|
| Function invocations          | Vercel    | Budget exceeded                      |
| Function duration             | Vercel    | > 10s average                        |
| Edge bandwidth                | Vercel    | > 80% of limit                       |
| Database CPU                  | Supabase  | > 80% sustained                      |
| Database storage              | Supabase  | > 80% of limit                       |
| Redis commands                | Upstash   | > 80% of daily limit                 |
```

### 7.2 Logging Strategy

```
+-----------------------------------------------------------------------------------+
|                            LOGGING STRATEGY                                        |
+-----------------------------------------------------------------------------------+

LOG LEVELS:
==========

| Level   | When to Use                                    | Example                  |
|---------|------------------------------------------------|--------------------------|
| ERROR   | Unrecoverable errors, exceptions               | Database connection fail |
| WARN    | Recoverable issues, degraded state             | Rate limit exceeded      |
| INFO    | Important business events                      | User registered          |
| DEBUG   | Detailed debugging (dev only)                  | Cache miss               |
| TRACE   | Very verbose (never in production)             | Function entry/exit      |


LOG FORMAT (Structured JSON):
============================

```typescript
// /src/lib/logger.ts

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV,
    service: 'rwa-gateway',
  },
});

// Example log output:
{
  "level": "info",
  "time": "2026-02-04T12:00:00.000Z",
  "env": "production",
  "service": "rwa-gateway",
  "requestId": "abc-123",
  "userId": "user-456",
  "event": "investment_completed",
  "poolId": 1,
  "amount": "1000000000",
  "txHash": "0x...",
  "durationMs": 2500
}
```


LOG RETENTION:
=============

| Environment | Retention | Storage         | Access             |
|-------------|-----------|-----------------|-------------------|
| Development | 24 hours  | Local console   | Developer          |
| Staging     | 7 days    | Vercel logs     | Team               |
| Production  | 30 days   | Vercel + Sentry | Team (PII redacted)|


SENSITIVE DATA HANDLING:
=======================

NEVER log:
- Private keys
- Full signatures
- Session tokens
- Email addresses (hash instead)
- IP addresses (hash or anonymize)

ALWAYS log:
- Request IDs (for tracing)
- User IDs (for debugging)
- Transaction hashes
- Error messages
- Performance metrics
```

### 7.3 Alerting Rules

```
+-----------------------------------------------------------------------------------+
|                             ALERTING RULES                                         |
+-----------------------------------------------------------------------------------+

CRITICAL ALERTS (Page immediately):
==================================

| Alert                          | Condition                    | Notification      |
|--------------------------------|------------------------------|-------------------|
| API Down                       | Health check fails 3x        | PagerDuty + Slack |
| Database Unreachable           | Connection timeout > 30s     | PagerDuty + Slack |
| Smart Contract Paused          | Pause event detected         | PagerDuty + Slack |
| Relayer Balance Critical       | < 0.1 AVAX                   | PagerDuty + Slack |
| Error Rate Spike               | > 10% errors in 5 min        | PagerDuty + Slack |
| Security Alert                 | Unusual transaction pattern  | PagerDuty + Slack |


HIGH PRIORITY ALERTS (Response within 1 hour):
=============================================

| Alert                          | Condition                    | Notification      |
|--------------------------------|------------------------------|-------------------|
| Relayer Balance Low            | < 0.5 AVAX                   | Slack + Email     |
| Queue Backlog                  | > 100 pending jobs           | Slack             |
| Slow API Responses             | p95 > 5s for 15 min          | Slack             |
| High Error Rate                | > 5% errors in 15 min        | Slack             |
| Credential Verification Fails  | > 20% fail rate              | Slack             |


MEDIUM PRIORITY ALERTS (Daily review):
=====================================

| Alert                          | Condition                    | Notification      |
|--------------------------------|------------------------------|-------------------|
| Database Storage Growing       | > 70% capacity               | Email             |
| Cache Hit Rate Degraded        | < 70% for 1 hour             | Email             |
| Unusual Traffic Pattern        | 2x normal volume             | Email             |
| Approaching Rate Limits        | > 80% of any limit           | Email             |


ALERT ROUTING:
=============

```yaml
# alerting-config.yml
routes:
  - match:
      severity: critical
    receiver: pagerduty-critical
    continue: true

  - match:
      severity: critical
    receiver: slack-critical

  - match:
      severity: high
    receiver: slack-alerts

  - match:
      severity: medium
    receiver: email-daily-digest
    group_wait: 1h
    group_interval: 4h

receivers:
  - name: pagerduty-critical
    pagerduty_configs:
      - service_key: $PAGERDUTY_KEY

  - name: slack-critical
    slack_configs:
      - channel: '#alerts-critical'

  - name: slack-alerts
    slack_configs:
      - channel: '#alerts'
```

### 7.4 Dashboard Design

```
+-----------------------------------------------------------------------------------+
|                           DASHBOARD LAYOUTS                                        |
+-----------------------------------------------------------------------------------+

DASHBOARD 1: OPERATIONS OVERVIEW
================================

+-----------------------------------------------------------------------+
|  RWA Gateway - Operations Dashboard                    [Auto-refresh] |
+-----------------------------------------------------------------------+
|                                                                       |
|  +-------------------+  +-------------------+  +-------------------+  |
|  |  API Health       |  |  Relayer Status   |  |  Queue Depth      |  |
|  |  [GREEN: UP]      |  |  Balance: 2.3 AVAX|  |  Jobs: 12         |  |
|  |  Latency: 145ms   |  |  Tx/hour: 45      |  |  Failed: 0        |  |
|  +-------------------+  +-------------------+  +-------------------+  |
|                                                                       |
|  +------------------------------------------------------------------+ |
|  |  Request Rate (last 24h)                                         | |
|  |  [LINE CHART: requests over time with error overlay]             | |
|  +------------------------------------------------------------------+ |
|                                                                       |
|  +------------------------------------------------------------------+ |
|  |  Transaction Types (last 24h)                                    | |
|  |  [BAR CHART: invest, redeem, register, credential by count]      | |
|  +------------------------------------------------------------------+ |
|                                                                       |
|  +--------------------------------+  +-------------------------------+ |
|  |  Recent Errors                 |  |  Active Sessions              | |
|  |  [TABLE: time, type, message]  |  |  Current: 234                 | |
|  |                                |  |  Peak today: 567              | |
|  +--------------------------------+  +-------------------------------+ |
+-----------------------------------------------------------------------+


DASHBOARD 2: BUSINESS METRICS
=============================

+-----------------------------------------------------------------------+
|  RWA Gateway - Business Dashboard                      [Auto-refresh] |
+-----------------------------------------------------------------------+
|                                                                       |
|  +-------------------+  +-------------------+  +-------------------+  |
|  |  Total Users      |  |  Total TVL        |  |  24h Volume       |  |
|  |  1,234            |  |  $2.4M            |  |  $45,000          |  |
|  |  +12 today        |  |  +$15K today      |  |  23 transactions  |  |
|  +-------------------+  +-------------------+  +-------------------+  |
|                                                                       |
|  +------------------------------------------------------------------+ |
|  |  TVL by Pool (last 30 days)                                      | |
|  |  [AREA CHART: stacked by pool]                                   | |
|  +------------------------------------------------------------------+ |
|                                                                       |
|  +------------------------------------------------------------------+ |
|  |  User Funnel                                                     | |
|  |  [FUNNEL: registered -> verified -> invested -> active]          | |
|  +------------------------------------------------------------------+ |
|                                                                       |
|  +--------------------------------+  +-------------------------------+ |
|  |  Top Pools by TVL              |  |  Recent Investments           | |
|  |  1. Treasury Fund: $1.2M       |  |  [TABLE: time, pool, amount]  | |
|  |  2. Real Estate: $800K         |  |                               | |
|  |  3. Private Credit: $400K      |  |                               | |
|  +--------------------------------+  +-------------------------------+ |
+-----------------------------------------------------------------------+


DASHBOARD 3: BLOCKCHAIN HEALTH
==============================

+-----------------------------------------------------------------------+
|  RWA Gateway - Blockchain Dashboard                    [Auto-refresh] |
+-----------------------------------------------------------------------+
|                                                                       |
|  +-------------------+  +-------------------+  +-------------------+  |
|  |  RPC Status       |  |  Last Block       |  |  Gas Price        |  |
|  |  [GREEN: OK]      |  |  #12,345,678      |  |  28 gwei          |  |
|  |  Latency: 45ms    |  |  2s ago           |  |  Avg: 25 gwei     |  |
|  +-------------------+  +-------------------+  +-------------------+  |
|                                                                       |
|  +------------------------------------------------------------------+ |
|  |  Contract Event Stream (live)                                    | |
|  |  [LIVE TABLE: time, event, contract, tx hash]                    | |
|  +------------------------------------------------------------------+ |
|                                                                       |
|  +--------------------------------+  +-------------------------------+ |
|  |  Indexer Status                |  |  Pending Transactions         | |
|  |  Last indexed: #12,345,676     |  |  In queue: 3                  | |
|  |  Lag: 2 blocks                 |  |  Oldest: 15s                  | |
|  |  Events today: 156             |  |  [LIST: tx details]           | |
|  +--------------------------------+  +-------------------------------+ |
+-----------------------------------------------------------------------+
```

---

## 8. End-to-End Integration Flows

### 8.1 User Registration Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as User Browser
    participant SE as Secure Enclave
    participant FE as Frontend
    participant API as API Server
    participant R as Redis
    participant DB as PostgreSQL
    participant REL as Relayer
    participant BC as Blockchain

    Note over U,BC: User Registration Flow (~2 minutes)

    U->>FE: Navigate to /register
    FE->>API: POST /api/auth/register-options
    API->>R: Generate & store challenge (5min TTL)
    API-->>FE: WebAuthn creation options

    FE->>U: Display "Create passkey" prompt
    U->>SE: Touch ID / Face ID
    SE->>SE: Generate secp256r1 key pair
    SE-->>U: Attestation with public key

    U->>FE: Submit attestation
    FE->>API: POST /api/auth/register-verify
    API->>R: Verify challenge exists
    API->>API: Extract public key (x, y)
    API->>API: Generate deterministic wallet address

    API->>DB: Create user record (pending)
    API->>REL: Submit registration tx
    REL->>BC: BiometricRegistry.register(pubKeyX, pubKeyY, credentialId)
    BC-->>REL: Transaction receipt

    REL-->>API: Registration confirmed
    API->>DB: Update user (status: active)
    API->>R: Create session token
    API-->>FE: { token, user }

    FE->>U: Redirect to /dashboard
    FE->>U: Show "Set up your identity" CTA
```

### 8.2 Credential Issuance Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant FE as Frontend
    participant API as API Server
    participant KYC as KYC Provider
    participant DB as PostgreSQL
    participant REL as Relayer
    participant BC as Blockchain

    Note over U,BC: Credential Issuance Flow (~24-48 hours)

    U->>FE: Navigate to /credentials
    FE->>U: Show credential status (none)
    U->>FE: Click "Start Verification"

    FE->>API: POST /api/credentials/request
    API->>KYC: Create verification session
    KYC-->>API: { sessionUrl, sessionId }
    API->>DB: Create credential_request (status: pending)
    API-->>FE: { redirectUrl }

    FE->>U: Redirect to KYC provider
    U->>KYC: Complete verification (ID, proof of income)
    KYC->>KYC: AI + Human review

    Note over KYC,API: 24-48 hours later...

    KYC->>API: POST /webhooks/kyc (verification complete)
    API->>API: Validate webhook signature
    API->>DB: Update credential_request (status: approved)

    API->>REL: Submit credential issuance tx
    REL->>BC: CredentialVerifier.issueCredential(user, type, jurisdiction, tier)
    BC-->>REL: CredentialIssued event

    REL-->>API: Issuance confirmed
    API->>DB: Create credential record

    Note over FE,U: User returns to platform

    U->>FE: Navigate to /credentials
    FE->>API: GET /api/credentials/status
    API-->>FE: { status: approved, type: accredited, ... }
    FE->>U: Show "Verified Investor" badge
```

### 8.3 Investment Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant SE as Secure Enclave
    participant FE as Frontend
    participant API as API Server
    participant R as Redis
    participant REL as Relayer
    participant BC as Blockchain
    participant IDX as Indexer
    participant DB as PostgreSQL

    Note over U,DB: Investment Flow (~30 seconds)

    U->>FE: Select pool, enter amount ($10,000)
    FE->>API: GET /api/pools/1
    API->>R: Check cache
    R-->>API: Pool data (or cache miss -> DB)
    API-->>FE: Pool details + compliance requirements

    FE->>FE: Validate: user has credential, amount OK
    FE->>U: Show confirmation modal

    U->>FE: Click "Invest"
    FE->>API: POST /api/pools/1/invest (prepare)
    API->>API: Build message to sign
    API-->>FE: { message, deadline, nonce }

    FE->>U: Prompt biometric
    U->>SE: Touch ID
    SE->>SE: Sign message with private key
    SE-->>FE: Signature (r, s)

    FE->>API: POST /api/pools/1/invest (execute)
    API->>R: Check rate limit
    API->>API: Verify signature locally
    API->>REL: Submit investment tx

    REL->>BC: RWAGateway.invest(poolId, amount, user, signature)
    BC->>BC: Verify biometric signature (ACP-204)
    BC->>BC: Verify credential (CredentialVerifier)
    BC->>BC: Transfer USDC
    BC->>BC: Mint RWA tokens
    BC-->>REL: Investment event + receipt

    REL-->>API: Transaction confirmed
    API-->>FE: { txHash, shares }

    FE->>U: Show success + Snowtrace link

    Note over IDX,DB: Async indexing
    IDX->>BC: Listen for Investment event
    IDX->>DB: Insert investment record
    IDX->>R: Invalidate caches
```

### 8.4 Redemption Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant SE as Secure Enclave
    participant FE as Frontend
    participant API as API Server
    participant REL as Relayer
    participant BC as Blockchain

    Note over U,BC: Redemption Flow (~30 seconds)

    U->>FE: Navigate to /portfolio
    FE->>API: GET /api/portfolio
    API-->>FE: Holdings with current values

    U->>FE: Select position, click "Redeem"
    FE->>U: Enter amount to redeem (5,000 shares)
    FE->>FE: Calculate estimated USDC return
    FE->>U: Show confirmation with fees

    U->>FE: Confirm redemption
    FE->>API: POST /api/pools/1/redeem (prepare)
    API-->>FE: { message, deadline, nonce }

    FE->>U: Prompt biometric
    U->>SE: Face ID
    SE-->>FE: Signature

    FE->>API: POST /api/pools/1/redeem (execute)
    API->>REL: Submit redemption tx

    REL->>BC: RWAGateway.redeem(poolId, shares, user, signature)
    BC->>BC: Verify biometric signature
    BC->>BC: Re-verify credential (still valid?)
    BC->>BC: Burn RWA tokens
    BC->>BC: Transfer USDC to user
    BC-->>REL: Redemption event + receipt

    REL-->>API: Transaction confirmed
    API-->>FE: { txHash, amountRedeemed }

    FE->>U: Show success + updated portfolio
```

### 8.5 Document Signing Flow

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant SE as Secure Enclave
    participant FE as Frontend
    participant API as API Server
    participant REL as Relayer
    participant BC as Blockchain

    Note over U,BC: Document Signing Flow (~15 seconds)

    U->>FE: Navigate to /documents
    FE->>API: GET /api/documents
    API-->>FE: List of pending documents

    U->>FE: Click document to review
    FE->>U: Display document PDF
    U->>FE: Click "Sign Document"

    FE->>FE: Calculate SHA-256 hash of document
    FE->>API: POST /api/documents/seal (prepare)
    API-->>FE: { message containing docHash, nonce }

    FE->>U: "Sign with biometric?"
    U->>SE: Touch ID
    SE-->>FE: Signature

    FE->>API: POST /api/documents/seal (execute)
    API->>REL: Submit seal tx

    REL->>BC: DocumentSeal.seal(docHash, signature)
    BC->>BC: Verify biometric signature
    BC->>BC: Record seal with timestamp
    BC-->>REL: DocumentSealed event

    REL-->>API: Seal confirmed
    API-->>FE: { txHash, timestamp }

    FE->>U: Show "Document Sealed" badge
    FE->>U: Provide Snowtrace verification link
```

---

## 9. Disaster Recovery

### 9.1 Backup Strategy

```
+-----------------------------------------------------------------------------------+
|                            BACKUP STRATEGY                                         |
+-----------------------------------------------------------------------------------+

DATABASE BACKUPS (Supabase):
===========================

| Type              | Frequency   | Retention | Method                    |
|-------------------|-------------|-----------|---------------------------|
| Continuous WAL    | Real-time   | 7 days    | Point-in-time recovery    |
| Daily snapshot    | Daily 3 AM  | 30 days   | Full database dump        |
| Weekly archive    | Sunday 3 AM | 90 days   | Compressed archive        |


BACKUP VERIFICATION:
===================

Weekly automated tests:
1. Restore daily backup to test instance
2. Run integrity checks (foreign keys, constraints)
3. Verify row counts match production
4. Execute sample queries
5. Alert on any discrepancy


BLOCKCHAIN STATE:
================

The blockchain IS the backup for:
- Biometric registrations
- Credentials
- Investments
- Redemptions
- Document seals

Database can be fully reconstructed from chain events via:
1. Deploy fresh database
2. Run full indexer from genesis block
3. Time required: ~30 minutes for current state


CONFIGURATION BACKUPS:
=====================

| Item                    | Location              | Backup Method            |
|-------------------------|-----------------------|--------------------------|
| Environment variables   | Vercel dashboard      | Export to 1Password      |
| Contract addresses      | Git repository        | Version controlled       |
| Prisma schema           | Git repository        | Version controlled       |
| Infrastructure config   | Git repository        | Version controlled       |


RECOVERY TIME OBJECTIVES:
========================

| Scenario                    | RTO         | RPO          |
|-----------------------------|-------------|--------------|
| Frontend failure            | 5 minutes   | 0 (stateless)|
| API failure                 | 5 minutes   | 0 (stateless)|
| Database failure            | 30 minutes  | 5 minutes    |
| Full region failure         | 2 hours     | 5 minutes    |
| Complete data loss          | 4 hours     | 0 (chain is source) |
```

### 9.2 Recovery Procedures

```
+-----------------------------------------------------------------------------------+
|                          RECOVERY PROCEDURES                                       |
+-----------------------------------------------------------------------------------+

PROCEDURE 1: FRONTEND FAILURE
=============================

Symptoms: 5xx errors, blank pages, build failures

Steps:
1. Check Vercel deployment status
2. If failed deployment:
   a. Vercel Dashboard > Deployments > Redeploy previous
   b. Or: `vercel rollback [url]`
3. If build failure:
   a. Check build logs for error
   b. Fix and push (or revert commit)
4. If edge function timeout:
   a. Check for slow dependencies
   b. Increase function timeout (Vercel settings)
   c. Consider caching strategy

Time to recover: 5-15 minutes


PROCEDURE 2: DATABASE FAILURE
=============================

Symptoms: Connection timeouts, query errors, data inconsistency

Steps:
1. Check Supabase status page
2. If Supabase outage:
   a. Wait for resolution (usually <30 min)
   b. Verify data integrity after recovery
3. If connection exhaustion:
   a. Check connection pool settings
   b. Restart application to release connections
   c. Increase pool size if needed
4. If data corruption:
   a. Identify affected tables
   b. Restore from point-in-time backup
   c. Re-index affected blockchain events

Time to recover: 15-60 minutes


PROCEDURE 3: REDIS FAILURE
==========================

Symptoms: Session errors, slow responses, rate limit issues

Steps:
1. Check Upstash status
2. If Upstash outage:
   a. Application should gracefully degrade
   b. Sessions fall back to database
   c. Rate limits become permissive
3. If connection issues:
   a. Verify connection string
   b. Check API key validity
   c. Rotate credentials if needed
4. After recovery:
   a. Warm caches manually
   b. Monitor hit rate

Time to recover: 5-30 minutes


PROCEDURE 4: RELAYER FAILURE
============================

Symptoms: Transactions not submitting, stuck in pending

Steps:
1. Check relayer wallet balance
   - If low: fund immediately
2. Check for stuck transactions
   a. Query pending nonce from chain
   b. If stuck: speed up or cancel
3. Check RPC connectivity
   a. Try alternate RPC endpoint
   b. Update RPC_URL if needed
4. If private key compromise suspected:
   a. IMMEDIATELY rotate key
   b. Generate new wallet
   c. Update RELAYER_PRIVATE_KEY
   d. Fund new wallet
   e. Redeploy

Time to recover: 15-45 minutes


PROCEDURE 5: SMART CONTRACT ISSUE
=================================

Symptoms: Transaction reverts, unexpected behavior, exploit detected

Steps:
1. IMMEDIATELY: Call pause() on affected contracts
2. Assess scope of issue:
   a. Check transaction history
   b. Identify affected users/funds
3. For bugs (no exploit):
   a. Document issue
   b. Develop and test fix
   c. Deploy new contract version
   d. Migrate state if needed
   e. Unpause
4. For exploits:
   a. Contain damage (pause all related contracts)
   b. Engage security response team
   c. Communicate with affected users
   d. Consider time-lock for withdrawals
   e. Legal consultation if funds lost

Time to recover: Hours to days


PROCEDURE 6: FULL ENVIRONMENT REBUILD
=====================================

When: Complete loss of production environment

Steps:
1. Infrastructure (30 min):
   a. Create new Vercel project
   b. Set up Supabase database
   c. Configure Upstash Redis
   d. Import environment variables from backup

2. Database (30 min):
   a. Apply Prisma migrations
   b. OR restore from backup

3. Blockchain sync (1 hour):
   a. Start indexer from genesis
   b. Let it catch up to current block
   c. Verify event counts match chain

4. Verification (30 min):
   a. Run smoke tests
   b. Verify user can authenticate
   c. Verify transactions work
   d. Check all dashboards

Total time: 2-4 hours
```

### 9.3 Business Continuity Plan

```
+-----------------------------------------------------------------------------------+
|                        BUSINESS CONTINUITY PLAN                                    |
+-----------------------------------------------------------------------------------+

INCIDENT SEVERITY LEVELS:
========================

| Level | Description                    | Response Time | Escalation          |
|-------|--------------------------------|---------------|---------------------|
| SEV-1 | Total outage, funds at risk    | Immediate     | All hands + legal   |
| SEV-2 | Major feature broken           | 15 minutes    | On-call + lead      |
| SEV-3 | Minor feature degraded         | 1 hour        | On-call             |
| SEV-4 | Cosmetic issue                 | Next day      | Ticket queue        |


COMMUNICATION PLAN:
==================

| Audience           | Channel              | Timing                          |
|--------------------|---------------------|----------------------------------|
| Internal team      | Slack #incidents    | Immediately on detection         |
| Affected users     | In-app banner       | Within 15 min (SEV-1/2)          |
| All users          | Twitter/Discord     | Within 30 min (SEV-1)            |
| Partners           | Email               | Within 1 hour (SEV-1/2)          |
| Regulators         | Official channels   | As required by jurisdiction      |


STATUS PAGE UPDATES:
===================

Template for incidents:

"""
Incident: [Brief description]
Status: Investigating | Identified | Monitoring | Resolved
Impact: [What users experience]
Last update: [Timestamp]

Timeline:
- [Time] Issue detected
- [Time] Team notified
- [Time] Root cause identified
- [Time] Fix deployed
- [Time] Monitoring
"""


POST-INCIDENT PROCESS:
=====================

1. Immediate (within 24 hours):
   - Write incident timeline
   - Identify root cause
   - Document immediate fixes applied

2. Post-mortem (within 72 hours):
   - Blameless retrospective
   - What went wrong?
   - What went right?
   - What can we improve?
   - Action items with owners

3. Follow-up (within 2 weeks):
   - Implement preventive measures
   - Update runbooks
   - Add monitoring/alerting
   - Share learnings with team
```

---

## 10. Operational Runbooks

### 10.1 Daily Operations Checklist

```
+-----------------------------------------------------------------------------------+
|                        DAILY OPERATIONS CHECKLIST                                  |
+-----------------------------------------------------------------------------------+

MORNING CHECK (9 AM):
====================

[ ] 1. Dashboard Review
    - Check operations dashboard for overnight alerts
    - Review error rates and latency trends
    - Check relayer wallet balance

[ ] 2. Infrastructure Health
    - Verify all services green
    - Check database connection count
    - Check Redis memory usage

[ ] 3. Blockchain Status
    - Verify indexer is current (< 5 blocks behind)
    - Check for any failed transactions
    - Review gas prices

[ ] 4. Business Metrics
    - Check user registrations
    - Review investment/redemption volumes
    - Note any unusual patterns


EVENING CHECK (6 PM):
====================

[ ] 1. Daily Summary
    - Users registered: ___
    - Investments: $___ across ___ transactions
    - Redemptions: $___ across ___ transactions
    - Errors: ___ (____% rate)

[ ] 2. Relayer Status
    - Current balance: ___ AVAX
    - Transactions today: ___
    - Average gas: ___ gwei

[ ] 3. Capacity Check
    - Database usage: ___% of limit
    - Redis commands: ___% of daily limit
    - Vercel bandwidth: ___% of limit

[ ] 4. Tomorrow's Concerns
    - Any deployments scheduled?
    - Any maintenance windows?
    - Any unusual activity expected?
```

### 10.2 Common Issue Resolution

```
+-----------------------------------------------------------------------------------+
|                       COMMON ISSUE RESOLUTION                                      |
+-----------------------------------------------------------------------------------+

ISSUE: "WebAuthn registration fails on mobile Safari"
====================================================
Cause: Safari requires secure context and specific rp.id

Resolution:
1. Verify HTTPS is enabled
2. Check WEBAUTHN_RP_ID matches domain exactly
3. Verify authenticatorSelection settings:
   ```
   authenticatorSelection: {
     authenticatorAttachment: 'platform', // or omit for cross-platform
     residentKey: 'preferred',
     userVerification: 'required'
   }
   ```
4. Test with Safari Tech Preview for debugging


ISSUE: "Transaction stuck in pending"
=====================================
Cause: Low gas price or nonce issues

Resolution:
1. Check transaction status on Snowtrace
2. If pending > 5 minutes:
   a. Get current nonce: `eth_getTransactionCount(address, 'pending')`
   b. Get confirmed nonce: `eth_getTransactionCount(address, 'latest')`
   c. If pending > confirmed, there's a stuck tx
3. Speed up transaction:
   - Resubmit same nonce with higher gas price
   - `gasPrice = currentGasPrice * 1.2`
4. If all else fails, cancel:
   - Submit 0-value tx to self with same nonce and high gas


ISSUE: "Credential verification returns false unexpectedly"
==========================================================
Cause: Credential expired or blockchain state mismatch

Resolution:
1. Check credential in database:
   ```sql
   SELECT * FROM credentials WHERE user_id = '...'
   ```
2. Check on-chain state:
   ```
   CredentialVerifier.getCredential(userAddress)
   ```
3. Compare expiry timestamps
4. If mismatch, re-index events from credential issuance block
5. If credential expired, user needs to re-verify


ISSUE: "Rate limit exceeded for legitimate user"
===============================================
Cause: Aggressive rate limiting or shared IP

Resolution:
1. Verify user is legitimate (check history)
2. Check rate limit keys in Redis:
   ```
   KEYS ratelimit:*<user_id_or_ip>*
   ```
3. Clear specific rate limit:
   ```
   DEL ratelimit:tx:<user_id>
   ```
4. If recurring, consider:
   - Whitelist user ID for higher limits
   - Adjust rate limit tiers
   - Implement progressive backoff


ISSUE: "Pool TVL doesn't match sum of investments"
=================================================
Cause: Indexer missed events or reorg not handled

Resolution:
1. Get on-chain TVL:
   ```
   RWAGateway.getPool(poolId).totalDeposited
   ```
2. Get database TVL:
   ```sql
   SELECT SUM(amount) FROM investments WHERE pool_id = ... AND status = 'confirmed'
   ```
3. If mismatch:
   a. Identify missing transactions
   b. Re-index from last known good block
   c. OR trigger manual sync:
      ```sql
      UPDATE pools SET total_deposited = <chain_value> WHERE id = ...
      ```
4. Investigate why indexer missed events


ISSUE: "Sentry flooded with same error"
======================================
Cause: Recurring error in production

Resolution:
1. Check error frequency and pattern
2. Identify root cause from stack trace
3. If known issue:
   - Add to Sentry ignore list (temporarily)
   - Create ticket for fix
4. If critical:
   - Assess user impact
   - Consider feature flag to disable affected feature
   - Hotfix if warranted
5. Set up Sentry alert deduplication
```

### 10.3 Deployment Checklist

```
+-----------------------------------------------------------------------------------+
|                         DEPLOYMENT CHECKLIST                                       |
+-----------------------------------------------------------------------------------+

PRE-DEPLOYMENT:
==============

[ ] 1. Code Review
    - PR approved by 2+ reviewers
    - All conversations resolved
    - No pending requested changes

[ ] 2. Testing
    - All CI checks passing
    - E2E tests pass on preview deployment
    - Manual testing completed (if UI change)

[ ] 3. Documentation
    - README updated if needed
    - API docs updated for new endpoints
    - CHANGELOG entry added

[ ] 4. Database
    - Migrations reviewed
    - Migrations tested on staging
    - Rollback plan documented (if migration)

[ ] 5. Communication
    - Team notified of deployment
    - User-facing changes documented
    - Support team briefed (if major change)


DEPLOYMENT:
==========

[ ] 1. Merge PR to main
[ ] 2. Monitor GitHub Actions workflow
[ ] 3. Verify Vercel deployment succeeds
[ ] 4. Check deployment logs for errors


POST-DEPLOYMENT:
===============

[ ] 1. Smoke Tests
    - [ ] Homepage loads
    - [ ] API health check passes
    - [ ] Authentication works
    - [ ] One critical user flow works

[ ] 2. Monitoring
    - Check error rate (should be stable)
    - Check latency (should be stable)
    - Check any new alerts

[ ] 3. Verification
    - New feature works as expected
    - No regression in existing features
    - Performance acceptable

[ ] 4. Cleanup
    - Close related tickets
    - Update project board
    - Announce to team


ROLLBACK TRIGGERS:
=================

Roll back immediately if:
- Error rate > 5% (was < 1%)
- P95 latency > 5s (was < 500ms)
- Critical user flow broken
- Security vulnerability discovered

Rollback command:
```
vercel rollback [previous-deployment-url]
```
```

---

## Appendix A: Environment Variable Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment mode | `production` |
| `NEXT_PUBLIC_CHAIN_ID` | Yes | Blockchain chain ID | `43114` |
| `NEXT_PUBLIC_RPC_URL` | Yes | Blockchain RPC endpoint | `https://api.avax.network/...` |
| `NEXT_PUBLIC_APP_URL` | Yes | Application base URL | `https://rwa-gateway.vercel.app` |
| `NEXT_PUBLIC_BIOMETRIC_REGISTRY` | Yes | Contract address | `0x...` |
| `NEXT_PUBLIC_CREDENTIAL_VERIFIER` | Yes | Contract address | `0x...` |
| `NEXT_PUBLIC_RWA_GATEWAY` | Yes | Contract address | `0x...` |
| `NEXT_PUBLIC_DOCUMENT_SEAL` | Yes | Contract address | `0x...` |
| `DATABASE_URL` | Yes | PostgreSQL connection | `postgresql://...` |
| `REDIS_URL` | Yes | Redis connection | `redis://...` |
| `JWT_SECRET` | Yes | JWT signing key (32+ chars) | `[secure random]` |
| `RELAYER_PRIVATE_KEY` | Yes | Relayer wallet key | `0x...` |
| `WEBAUTHN_RP_NAME` | Yes | Relying party name | `RWA Gateway` |
| `WEBAUTHN_RP_ID` | Yes | Relying party ID | `rwa-gateway.vercel.app` |
| `SENTRY_DSN` | No | Sentry error tracking | `https://...@sentry.io/...` |
| `INFURA_API_KEY` | No | Fallback RPC provider | `[api key]` |
| `KYC_WEBHOOK_SECRET` | No | KYC provider webhook key | `[secret]` |

---

## Appendix B: Service Dependencies

```mermaid
graph LR
    subgraph "Core Services"
        FE[Frontend]
        API[API Server]
        REL[Relayer]
        IDX[Indexer]
    end

    subgraph "Data Stores"
        DB[(PostgreSQL)]
        CACHE[(Redis)]
    end

    subgraph "External"
        BC[Avalanche]
        KYC[KYC Provider]
    end

    FE --> API
    API --> DB
    API --> CACHE
    API --> REL
    REL --> BC
    IDX --> BC
    IDX --> DB
    KYC --> API
```

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **Reorg** | Chain reorganization when blocks are replaced |
| **Meta-transaction** | Transaction where relayer pays gas |
| **RTO** | Recovery Time Objective |
| **RPO** | Recovery Point Objective |
| **DLQ** | Dead Letter Queue for failed jobs |
| **WAL** | Write-Ahead Logging for database recovery |
| **HSM** | Hardware Security Module for key storage |
| **Edge Function** | Serverless function at CDN edge |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-04 | Architecture Team | Initial draft |

---

**End of Phase 6: Infrastructure, DevOps & Integration Flows**

*Previous: Phase 4 - Backend & Database Architecture*
*This completes the RWA Gateway Architecture Document series.*
