# RWA Gateway Architecture Documentation
## Master Index

**Version:** 1.0
**Date:** February 5, 2026
**Status:** COMPLETE
**Project:** RWA Gateway - Biometric Real-World Asset Tokenization on Avalanche

---

## Overview

RWA Gateway is a biometric-authenticated real-world asset tokenization platform built on Avalanche. This documentation spans **15,435 lines** across 6 comprehensive architecture documents covering every aspect of the system.

**Core Innovation:** WebAuthn/Passkey authentication verified on-chain via ACP-204 secp256r1 precompile, enabling gasless biometric transactions for institutional RWA investment.

---

## Quick Reference

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Blockchain** | Avalanche C-Chain (Fuji → Mainnet) |
| **Smart Contracts** | Solidity 0.8.24, Hardhat, OpenZeppelin 5.x |
| **Frontend** | Next.js 14, TypeScript, TailwindCSS, shadcn/ui |
| **Backend** | Node.js 20, Express, Prisma 5.x |
| **Database** | PostgreSQL 16, Redis 7.x |
| **Authentication** | WebAuthn/Passkeys (primary), MetaMask (fallback) |
| **Privacy** | eERC encrypted tokens, zk-SNARKs |

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Chain | C-Chain (not Subnet) | Stability, competition timeline, ecosystem compatibility |
| Token Standard | ERC-20 + hooks (not ERC-3643) | 70% less code, faster development |
| Auth Primary | WebAuthn/Passkeys | Hardware-backed, phishing-resistant |
| Gas Model | Relayer (meta-transactions) | Gasless UX for users |
| Data Layer | PostgreSQL + Redis | Hybrid caching, blockchain as source of truth |
| Deployment | Vercel + Supabase | Serverless, auto-scaling |
| Privacy | eERC with plaintext fallback | Compliance + privacy, graceful degradation |

---

## Phase Documents

| Phase | Title | Lines | Size | Focus |
|-------|-------|-------|------|-------|
| [1](#phase-1-executive-overview) | Executive Overview | 1,247 | 77KB | System architecture, security principles, competitive analysis |
| [2](#phase-2-smart-contracts) | Smart Contracts | 2,883 | 123KB | 5 core contracts, Solidity specifications, testing |
| [3](#phase-3-frontend) | Frontend | 3,404 | 99KB | Next.js 14, WebAuthn UI, components, state management |
| [4](#phase-4-backend-database) | Backend & Database | 3,087 | 91KB | Node.js APIs, PostgreSQL schemas, Redis caching |
| [5](#phase-5-avalanche-security) | Avalanche Security | 1,553 | ~60KB | ACP-204, eERC, cryptography, threat model |
| [6](#phase-6-infrastructure-devops) | Infrastructure & DevOps | 3,261 | 108KB | CI/CD, monitoring, deployment, disaster recovery |
| **Total** | | **15,435** | **~558KB** | |

---

## Phase 1: Executive Overview

**File:** [PHASE-1-EXECUTIVE-OVERVIEW.md](./PHASE-1-EXECUTIVE-OVERVIEW.md)

### Sections
1. Introduction & Vision
2. System Architecture
   - 2.1 Three-Layer Architecture (BiometricAuth → CredentialVault → RWAGateway)
   - 2.2 Component Interaction Diagram
3. Security Principles
   - 3.1 Defense in Depth Model
   - 3.2 Five Security Layers
4. Competitive Analysis
5. Timeline & Milestones

### Key Content
- Three-layer architecture diagram
- Security layering model (5 layers)
- Competitor comparison (Securitize, Ondo, Centrifuge)
- 6-week development timeline

---

## Phase 2: Smart Contracts

**File:** [PHASE-2-SMART-CONTRACTS.md](./PHASE-2-SMART-CONTRACTS.md)

### Sections
1. Contract Overview
2. BiometricRegistry (~200 lines)
   - 2.1 State Variables
   - 2.2 Functions
   - 2.3 Events
   - 2.4 Security Considerations
3. CredentialVerifier (~300 lines)
   - 3.1-3.4 Same structure
4. RWAGateway (~500 lines)
   - 4.1-4.4 Same structure
5. RWAToken (~150 lines)
6. DocumentSeal (~200 lines)
7. Contract Interactions
8. Deployment Scripts
9. Testing Strategy
10. Gas Optimization
11. Security Testing

### Key Content
- Complete Solidity specifications with NatSpec
- Function-by-function documentation
- Gas estimates per operation
- Test coverage requirements (95%+)
- Slither/Mythril security analysis

---

## Phase 3: Frontend

**File:** [PHASE-3-FRONTEND.md](./PHASE-3-FRONTEND.md)

### Sections
1. Architecture Overview
2. Project Structure
3. Component Library
   - 3.1 Core Components
   - 3.2 Feature Components
   - 3.3 Layout Components
4. State Management
   - 4.1 Zustand Stores
   - 4.2 React Query Integration
5. WebAuthn Integration
   - 5.1 Registration Flow
   - 5.2 Authentication Flow
6. Wallet Integration
   - 6.1 RainbowKit Setup
   - 6.2 MetaMask Fallback
7. Pages & Routing
8. API Integration
9. Styling (Tailwind + shadcn/ui)
10. Testing (Vitest + Playwright)
11. Performance Optimization

### Key Content
- 40+ component specifications
- WebAuthn registration/authentication code
- Zustand store schemas
- React Query patterns
- Responsive design breakpoints
- Accessibility requirements (WCAG 2.1 AA)

---

## Phase 4: Backend & Database

**File:** [PHASE-4-BACKEND-DATABASE.md](./PHASE-4-BACKEND-DATABASE.md)

### Sections
1. Architecture Overview
2. API Design
   - 2.1 RESTful Endpoints
   - 2.2 Error Handling
   - 2.3 Rate Limiting
3. Authentication Service
   - 3.1 WebAuthn Ceremony Management
   - 3.2 JWT Token Handling
   - 3.3 Session Management
4. Database Schema (PostgreSQL)
   - 4.1 User Tables
   - 4.2 Credential Tables
   - 4.3 Transaction Tables
5. Redis Integration
   - 5.1 Session Storage
   - 5.2 Rate Limit Counters
   - 5.3 Cache Patterns
6. Relayer Service
   - 6.1 Transaction Queue
   - 6.2 Gas Management
   - 6.3 Error Recovery
7. External Integrations
   - 7.1 KYC Providers
   - 7.2 Price Oracles
8. Testing Strategy

### Key Content
- 30+ API endpoint specifications
- Prisma schema definitions
- Redis key patterns
- Relayer transaction flow
- KYC integration patterns

---

## Phase 5: Avalanche Security

**File:** [PHASE-5-AVALANCHE-SECURITY.md](./PHASE-5-AVALANCHE-SECURITY.md)

### Sections
1. Executive Summary
2. ACP-204 Secp256r1 Integration
   - 2.1 Precompile Specification
   - 2.2 P256Verifier Solidity Library
   - 2.3 WebAuthn Message Construction
   - 2.4 Gas Optimization
3. eERC Encrypted Token Integration
   - 3.1 Architecture Overview
   - 3.2 Encrypted Balance Architecture
   - 3.3 Privacy-Preserving Compliance
   - 3.4 Auditor Key Management
   - 3.5 RWAToken Integration
4. WebAuthn-to-Blockchain Authentication Flow
   - 4.1 End-to-End Flow
   - 4.2 Challenge-Response Protocol
   - 4.3 Session Management
   - 4.4 Signature Relay Architecture
5. Security Architecture
   - 5.1 Comprehensive Threat Model
   - 5.2 Defense in Depth
   - 5.3 Attack Vector Deep Dives
6. Cryptographic Security
   - 6.1 Key Generation
   - 6.2 Signature Schemes
   - 6.3 Secure Random Number Generation
7. Operational Security
   - 7.1 Key Ceremony Procedures
   - 7.2 Incident Response
   - 7.3 Compliance Framework
- Appendix A: Pre-Deployment Checklist
- Appendix B: Attack Vectors Reference
- Appendix C: Glossary

### Key Content
- Complete P256Verifier Solidity library
- ACP-204 precompile specification
- eERC integration patterns
- Comprehensive threat model (12 vectors)
- Defense in depth diagram (6 layers)
- Incident response playbook
- Pre-deployment security checklist

---

## Phase 6: Infrastructure & DevOps

**File:** [PHASE-6-INFRASTRUCTURE-DEVOPS.md](./PHASE-6-INFRASTRUCTURE-DEVOPS.md)

### Sections
1. Infrastructure Overview
2. Deployment Architecture
   - 2.1 Vercel (Frontend)
   - 2.2 Supabase (Database)
   - 2.3 Redis Cloud
3. CI/CD Pipeline
   - 3.1 GitHub Actions Workflows
   - 3.2 Testing Pipeline
   - 3.3 Deployment Pipeline
4. Smart Contract Deployment
   - 4.1 Hardhat Scripts
   - 4.2 Verification
   - 4.3 Upgrade Procedures
5. Relayer Infrastructure
   - 5.1 Architecture
   - 5.2 Key Management
   - 5.3 Monitoring
   - 5.4 Security Considerations
6. Environment Management
7. Monitoring & Observability
   - 7.1 Metrics
   - 7.2 Logging
   - 7.3 Alerting
8. Backup & Recovery
9. Disaster Recovery
10. Cost Estimation

### Key Content
- GitHub Actions workflow YAML
- Hardhat deployment scripts
- Docker configurations
- Monitoring dashboards
- Disaster recovery procedures
- Monthly cost breakdown

---

## Cross-Reference Matrix

| Topic | Phase(s) | Primary Section |
|-------|----------|-----------------|
| **System Architecture** | 1 | Section 2 |
| **Security Principles** | 1, 5 | Phase 1: 3.2, Phase 5: 5.2 |
| **BiometricRegistry** | 2, 5 | Phase 2: Section 2 |
| **CredentialVerifier** | 2 | Phase 2: Section 3 |
| **RWAGateway** | 2 | Phase 2: Section 4 |
| **RWAToken** | 2, 5 | Phase 2: Section 5, Phase 5: 3.5 |
| **WebAuthn Flow** | 3, 4, 5 | Phase 5: Section 4 |
| **API Endpoints** | 4 | Phase 4: Section 2 |
| **Database Schema** | 4 | Phase 4: Section 4 |
| **Relayer Service** | 4, 6 | Phase 4: 6, Phase 6: 5 |
| **ACP-204 Precompile** | 5 | Phase 5: Section 2 |
| **eERC Tokens** | 5 | Phase 5: Section 3 |
| **Threat Model** | 5 | Phase 5: Section 5.1 |
| **CI/CD Pipeline** | 6 | Phase 6: Section 3 |
| **Monitoring** | 6 | Phase 6: Section 7 |
| **Deployment** | 6 | Phase 6: Section 2 |

---

## Reading Paths by Role

### Full-Stack Developer
**Goal:** Understand the complete system
```
1 → 2 → 3 → 4 → 6 → 5
```
Start with architecture, then contracts, then frontend/backend, deployment, and finally security deep-dive.

### Smart Contract Developer
**Goal:** Focus on blockchain layer
```
1 (Sections 2-3) → 2 → 5 (Sections 2-3)
```
Architecture overview, complete contract specs, then Avalanche-specific integrations.

### Frontend Developer
**Goal:** Build the user interface
```
1 (Section 2) → 3 → 4 (Sections 2-3) → 5 (Section 4)
```
Architecture, frontend specs, API reference, WebAuthn flow.

### Security Auditor
**Goal:** Assess security posture
```
1 (Section 3) → 5 → 2 (Sections 2.7, 3.4, 4.4) → 6 (Section 5.4)
```
Security principles, full security doc, contract security sections, relayer security.

### DevOps Engineer
**Goal:** Set up infrastructure
```
1 (Section 2) → 6 → 4 (Section 5-6)
```
Architecture, infrastructure/deployment, backend services.

### Project Manager / Executive
**Goal:** High-level understanding
```
1 only
```
Executive overview covers architecture, security, timeline, and competitive positioning.

---

## Document Conventions

### Code Blocks
- **Solidity:** Full contracts with SPDX license, pragma, NatSpec documentation
- **TypeScript:** Implementation examples with type annotations
- **Bash:** Commands with descriptions

### Diagrams
- **ASCII Art:** Complex flows, layered architectures
- **Mermaid:** Sequence diagrams, flowcharts (where rendered)

### Tables
- **Specifications:** Function signatures, gas costs, parameters
- **Comparisons:** Technology choices, threat vectors
- **Checklists:** Pre-deployment, testing requirements

### Cross-References
- Internal: `[Section Name](#anchor)` within same document
- External: `[Document](./FILENAME.md)` for other phases

---

## Getting Started

### For New Team Members
1. Read Phase 1 completely (1-2 hours)
2. Read your role-specific path sections (2-4 hours)
3. Set up development environment (Phase 6, Section 6)
4. Run through the demo flow (Phase 3, Section 7)

### For Auditors
1. Read Phase 5 completely
2. Cross-reference with Phase 2 contract specifications
3. Review Phase 6 Section 5.4 (Relayer Security)
4. Check Appendix A checklist in Phase 5

### For Competition Judges
1. Phase 1: Executive Overview (architecture, differentiation)
2. Phase 5: Sections 2-3 (ACP-204, eERC - Avalanche innovations)
3. Phase 2: Section 2 (BiometricRegistry - core innovation)

---

## Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-05 | RWA Gateway Team | Complete 6-phase documentation |

---

## Repository Structure

```
/docs/architecture/
├── ARCHITECTURE-INDEX.md          ← You are here
├── PHASE-1-EXECUTIVE-OVERVIEW.md
├── PHASE-2-SMART-CONTRACTS.md
├── PHASE-3-FRONTEND.md
├── PHASE-4-BACKEND-DATABASE.md
├── PHASE-5-AVALANCHE-SECURITY.md
└── PHASE-6-INFRASTRUCTURE-DEVOPS.md

/contracts/                        (Implementation)
├── BiometricRegistry.sol
├── CredentialVerifier.sol
├── RWAGateway.sol
├── RWAToken.sol
└── DocumentSeal.sol

/frontend/                         (Implementation)
├── src/
│   ├── components/
│   ├── hooks/
│   ├── pages/
│   └── stores/
└── ...

/backend/                          (Implementation)
├── src/
│   ├── routes/
│   ├── services/
│   └── middleware/
└── ...
```

---

*This index was generated from 15,435 lines of architecture documentation for the RWA Gateway project.*
