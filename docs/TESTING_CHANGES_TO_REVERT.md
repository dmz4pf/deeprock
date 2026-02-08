# Temporary Testing Changes to Revert



**Created:** 2026-02-05
**Purpose:** Track changes made for testing that should be reverted before production

## Changes Made

### 1. Rate Limiter - Increased limits for development

**File:** `backend/src/middleware/rateLimit.middleware.ts`

**Lines 141 & 151** - Changed from fixed values to conditional:
```typescript
// BEFORE (production values):
max: 5,  // authLimiter
max: 3,  // registrationLimiter

// AFTER (testing - current):
max: process.env.NODE_ENV === "development" ? 100 : 5,  // authLimiter
max: process.env.NODE_ENV === "development" ? 100 : 3,  // registrationLimiter
```

**Action needed:** These are OK for production since they check NODE_ENV, but verify NODE_ENV=production in prod deployment.

---

## Production Changes Needed

### 1. Google OAuth - Add production redirect URI
**Location:** Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client

**Current (dev):** `http://localhost:3001/api/auth/google/callback`

**Add for production:** `https://YOUR_PRODUCTION_DOMAIN/api/auth/google/callback`

### 2. Google OAuth credentials in .env
**File:** `backend/.env`
- Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` if using different project for prod
- Update `GOOGLE_REDIRECT_URI` to production URL

### 3. Resend - Verify domain for production
**Location:** [resend.com/domains](https://resend.com/domains)
- Add and verify your production domain
- Update `EMAIL_FROM` in `.env` to use your domain (e.g., `noreply@yourdomain.com`)

---

## Completed Fixes (Keep These)

1. ✅ Passkey discoverable credentials - `webauthn.service.ts` - Made email optional
2. ✅ Wallet EIP-55 checksum - `wallet.service.ts` - Added getAddress() for checksumming
3. ✅ Resend API key - `backend/.env` - Configured for real email sending
4. ✅ CSRF exempt paths - `csrf.middleware.ts` - Added email, wallet, and Google auth endpoints to exempt list
5. ✅ Session endpoint format - `auth.routes.ts` - Return user object with id, displayName (was returning userId without displayName)
6. ✅ Biometric prompt after OAuth - `authStore.ts` - Preserve biometric-prompt step in validateSession
7. ✅ OAuth callback navigation - `callback/page.tsx` + `login/page.tsx` - Pass isNewUser via URL param since authStep isn't persisted
8. ✅ BiometricLinkingPrompt - Support wallet users (use walletAddress when no email)
