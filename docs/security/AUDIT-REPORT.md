# RWA Gateway Security Audit Report

**Date:** 2026-02-05
**Auditor:** Self-Audit (Pre-Competition)
**Version:** 1.0

---

## Executive Summary

This document summarizes security findings from the self-audit of RWA Gateway smart contracts, backend services, and frontend application conducted prior to Avalanche Build Games 2026 submission.

The audit identified **4 critical/high severity issues** and **5 medium severity issues**. All critical issues have remediation plans and will be addressed before submission.

---

## Scope

### Smart Contracts
- `BiometricRegistry.sol` - Core identity and signature verification
- `libraries/P256Verifier.sol` - ACP-204 precompile wrapper

### Backend Services
- `services/webauthn.service.ts` - WebAuthn registration/authentication
- `routes/auth.routes.ts` - Authentication endpoints
- `middleware/rateLimit.middleware.ts` - Rate limiting (defined but not applied)
- `middleware/auth.middleware.ts` - JWT verification

### Frontend
- `stores/authStore.ts` - Authentication state management
- `lib/api.ts` - API client with token handling
- `lib/flows/*.ts` - WebAuthn flow orchestration

---

## Methodology

1. Manual code review
2. Security checklist verification
3. Test coverage analysis
4. Dependency audit (npm audit)

*Note: Automated tools (Slither, Mythril) not run in this audit due to time constraints. Recommended for pre-mainnet deployment.*

---

## Findings Summary

| Severity | Count | Fixed | Acknowledged |
|----------|-------|-------|--------------|
| Critical | 1 | 1 | 0 |
| High | 3 | 2 | 0 |
| Medium | 5 | 3 | 2 |
| Low | 2 | 0 | 2 |
| Informational | 3 | - | - |

---

## Critical Findings

### SEC-001: JWT Secret Fallback Allows Token Forgery

**Severity:** Critical
**Contract/File:** `backend/src/services/webauthn.service.ts`
**Line:** 25-27

**Description:**
The JWT secret has a hardcoded fallback value. If `JWT_SECRET` environment variable is not set, the application will use a known secret, allowing attackers to forge valid tokens.

```typescript
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "development-secret-change-in-production"
);
```

**Impact:**
- Complete authentication bypass
- Token forgery for any user
- Session hijacking

**Recommendation:**
```typescript
const JWT_SECRET_RAW = process.env.JWT_SECRET;
if (!JWT_SECRET_RAW) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW);
```

**Status:** ✅ Fixed (2026-02-05)

---

## High Findings

### SEC-002: JWT Token Stored in localStorage (XSS Risk)

**Severity:** High
**File:** `frontend/src/stores/authStore.ts`
**Line:** 23-58

**Description:**
Authentication tokens are stored in localStorage via Zustand's persist middleware. Any XSS vulnerability would allow attackers to steal tokens.

**Impact:**
- Token theft via XSS
- Session hijacking
- No CSRF protection

**Recommendation:**
1. Store tokens in httpOnly, secure, sameSite cookies
2. Remove token from Zustand persist
3. Use `credentials: 'include'` in fetch calls

**Status:** Pending Fix

---

### SEC-003: Rate Limiting Not Applied to Auth Endpoints

**Severity:** High
**File:** `backend/src/index.ts`, `backend/src/routes/auth.routes.ts`

**Description:**
Rate limiting middleware is defined in `rateLimit.middleware.ts` but not imported or applied to authentication routes. This allows unlimited brute force attempts.

**Impact:**
- Brute force attacks on login
- Credential stuffing
- Denial of service

**Recommendation:**
Apply rate limiters to auth routes:
```typescript
import { authLimiter, registrationLimiter } from '../middleware/rateLimit.middleware.js';

router.post('/register-options', registrationLimiter, async (req, res) => { ... });
router.post('/login-options', authLimiter, async (req, res) => { ... });
```

**Status:** ✅ Fixed (2026-02-05)

---

### SEC-004: Smart Contract Counter Logic Allows Replay

**Severity:** High
**File:** `contracts/src/BiometricRegistry.sol`
**Line:** 163, 173-174

**Description:**
The counter check `counter < identity.counter` combined with increment `identity.counter = counter + 1` allows the same signature to be replayed if submitted with the same counter value multiple times in the same block.

```solidity
if (counter < identity.counter) revert CounterTooLow();
// ... verification ...
if (valid) {
    identity.counter = counter + 1;
```

**Impact:**
- Signature replay within same block
- Double-spend potential in derived contracts

**Recommendation:**
1. Change check to `counter != identity.counter` (exact match)
2. Increment counter BEFORE verification (CEI pattern)
3. Add used signature tracking

```solidity
uint256 expectedNonce = identity.counter;
require(counter == expectedNonce, "Invalid nonce");
identity.counter = expectedNonce + 1;  // Increment first
// Then verify signature
```

**Status:** ✅ Fixed (2026-02-05) - Implemented exact counter match, CEI pattern, and counter rollback on failure

---

## Medium Findings

### SEC-005: Session Not Validated on App Load

**Severity:** Medium
**File:** `frontend/src/stores/authStore.ts`

**Description:**
When the application loads, persisted session data is used without validating against the backend. Expired tokens remain "active" in the UI until an API call fails.

**Recommendation:**
Add session validation in Providers.tsx or app initialization.

**Status:** ✅ Fixed (2026-02-05) - Added validateSession() to authStore, called in app layout on load

---

### SEC-006: COSE Key Parsing is Fragile

**Severity:** Medium
**File:** `backend/src/services/webauthn.service.ts`
**Line:** 457-509

**Description:**
The public key extraction uses heuristic byte scanning rather than proper CBOR parsing. This may fail on valid credentials from certain authenticators.

**Recommendation:**
Use a proper CBOR parser (e.g., `cbor-x` package).

**Status:** Acknowledged (Demo acceptable)

---

### SEC-007: Transaction Polling Race Condition

**Severity:** Medium
**File:** `frontend/src/lib/flows/investment-flow.ts`

**Description:**
If component unmounts during transaction polling, the polling continues, potentially causing memory leaks or state updates on unmounted components.

**Recommendation:**
Add AbortController to polling logic.

**Status:** ✅ Fixed (2026-02-05) - Added AbortController to InvestmentFlowOrchestrator with abort() method

---

### SEC-008: Missing Chain ID in Contract Signatures

**Severity:** Medium
**File:** `contracts/src/BiometricRegistry.sol`

**Description:**
The verify() function doesn't include chain ID in message hash verification, potentially allowing cross-chain replay of signatures.

*Note: registerViaRelayer correctly includes block.chainid.*

**Recommendation:**
Ensure all signature verification includes chain ID in the signed message.

**Status:** Acknowledged (Single chain deployment)

---

### SEC-009: API Timeout Too Short for Blockchain Operations

**Severity:** Medium
**File:** `frontend/src/lib/api.ts`
**Line:** 5

**Description:**
Default timeout of 30 seconds may not be sufficient for blockchain transactions that require confirmation.

**Recommendation:**
Increase to 60 seconds or add per-endpoint timeout configuration.

**Status:** ✅ Fixed (2026-02-05) - Added BLOCKCHAIN_TIMEOUT (90s) for invest, redeem, and document seal endpoints

---

## Low Findings

### SEC-010: PrismaClient Created Multiple Times

**Severity:** Low
**File:** `backend/src/routes/auth.routes.ts`
**Line:** 266-267

**Description:**
PrismaClient is instantiated dynamically in check-email endpoint, which could cause connection pool issues.

**Recommendation:**
Import the shared prisma instance from index.ts.

**Status:** Acknowledged

---

### SEC-011: Error Messages Could Leak User Existence

**Severity:** Low
**File:** `backend/src/routes/auth.routes.ts`

**Description:**
The check-email endpoint explicitly reveals whether an email is registered.

**Recommendation:**
Consider rate limiting this endpoint more aggressively or removing it.

**Status:** Acknowledged (UX tradeoff)

---

## Informational

### INFO-001: No Multi-sig for Admin Functions

Admin functions (pause, setTrustedRelayer) use single-owner pattern. Consider Gnosis Safe for production.

### INFO-002: No Bug Bounty Program

Recommend establishing bug bounty before mainnet launch.

### INFO-003: Logging Could Include More Context

Consider structured logging with request IDs for debugging.

---

## Recommendations

1. **Before Demo:**
   - Fix SEC-001 (JWT secret fallback)
   - Fix SEC-003 (Apply rate limiting)

2. **Before Mainnet:**
   - Fix all Critical and High findings
   - Commission professional audit
   - Implement multi-sig for admin functions
   - Add monitoring and alerting

3. **Ongoing:**
   - Regular dependency updates
   - Security testing in CI/CD
   - Bug bounty program

---

## Conclusion

The RWA Gateway codebase demonstrates solid security fundamentals with proper use of ReentrancyGuard, input validation, and secure WebAuthn implementation. The identified issues are common in MVP-stage projects and can be remediated quickly.

The application is suitable for **testnet demonstration** with noted caveats. All Critical and High issues must be resolved before any mainnet deployment or handling of real user funds.

---

## Appendix: Fix Implementation Order

1. ~~SEC-001: JWT Secret~~ ✅ Fixed (2026-02-05)
2. ~~SEC-003: Rate Limiting~~ ✅ Fixed (2026-02-05)
3. ~~SEC-004: Contract Counter~~ ✅ Fixed (2026-02-05)
4. SEC-002: httpOnly Cookies *(Pending - 2 hours estimated)*
5. ~~SEC-005: Session Validation~~ ✅ Fixed (2026-02-05)
6. ~~SEC-007: Polling Abort~~ ✅ Fixed (2026-02-05)
7. ~~SEC-009: API Timeout~~ ✅ Fixed (2026-02-05)
