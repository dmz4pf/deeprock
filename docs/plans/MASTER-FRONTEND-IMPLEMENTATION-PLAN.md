# Master Frontend Implementation Plan

**Date:** 2026-02-07
**Purpose:** Complete all missing frontend features for hackathon and early production

---

## Gap Analysis Summary

Based on audit of `COMPREHENSIVE-SCALING-ROADMAP.md` and backend routes:

### Tier 1: Critical (Hackathon Essential - Missing)

| Feature | Backend | Frontend | Priority |
|---------|---------|----------|----------|
| **Redemption UI** | ✅ `POST /pools/:id/redeem` | ❌ Missing | P0 |

### Tier 2: High (Hackathon Nice-to-Have - Missing)

| Feature | Backend | Frontend | Priority |
|---------|---------|----------|----------|
| **Push Notifications** | ❌ None | ❌ None | P2 |

### Security Features (Backend exists, Frontend missing)

| Feature | Backend | Frontend | Priority |
|---------|---------|----------|----------|
| **Recovery Codes** | ✅ Generate/Status APIs | ❌ Missing | P1 |
| **Account Recovery** | ✅ Start/Verify APIs | ❌ Missing | P1 |

---

## Implementation Plan

### Task 1: Redemption UI (P0 - Critical)
**Effort:** 2-3 hours

**Backend Exists:**
- `POST /api/pools/:id/redeem` - Takes `{ shares }`, returns redemption result

**Frontend Needs:**
1. Add "Redeem" tab/button to pool detail page or portfolio holdings
2. Create `RedemptionForm` component (similar to InvestmentForm)
3. Show user's current shares and their value
4. Passkey signing flow (same as investment)
5. Success/error handling

**Files to Modify:**
- `frontend/src/app/(app)/portfolio/page.tsx` - Add redeem button to holdings
- `frontend/src/components/features/pools/RedemptionForm.tsx` - NEW
- `frontend/src/lib/api.ts` - Add redeem API methods (already partial)

**UI Flow:**
```
User clicks "Redeem" on holding
  → Modal opens with:
    - Current shares: X
    - Current value: $Y (NAV × shares)
    - Shares to redeem: [input]
    - Expected return: $Z
  → User enters amount
  → Passkey authentication
  → Transaction submitted
  → Success: Balance updated
```

---

### Task 2: Recovery Codes UI (P1 - Security)
**Effort:** 1-2 hours

**Backend Exists:**
- `GET /api/auth/recovery-codes/status` - Check if codes exist
- `POST /api/auth/recovery-codes/generate` - Generate new codes

**Frontend Needs:**
1. Add "Recovery Codes" section to Settings page
2. Show status (generated or not)
3. Generate button with warning modal
4. Display codes once (user must save them)
5. Option to regenerate (invalidates old codes)

**Files to Modify:**
- `frontend/src/app/(app)/settings/page.tsx` - Add recovery codes section
- `frontend/src/components/features/settings/RecoveryCodes.tsx` - NEW

**UI Flow:**
```
Settings → Security → Recovery Codes
  If not generated:
    [Generate Recovery Codes] button
    → Warning: "Save these codes. They can only be shown once."
    → Generate
    → Display 8 codes in grid
    → [Copy All] [Download] [I've Saved Them]
  If generated:
    "✓ Recovery codes active"
    [Regenerate] (with confirmation)
```

---

### Task 3: Account Recovery Flow (P1 - Security)
**Effort:** 2-3 hours

**Backend Exists:**
- `POST /api/auth/recovery/start` - Start recovery with email
- `POST /api/auth/recovery/verify` - Verify with code + register new passkey

**Frontend Needs:**
1. Add "Lost your passkey?" link on login page
2. Create recovery flow pages/modals
3. Email verification step
4. Recovery code entry
5. New passkey registration

**Files to Create:**
- `frontend/src/app/(auth)/recover/page.tsx` - NEW
- `frontend/src/components/features/auth/RecoveryFlow.tsx` - NEW

**UI Flow:**
```
Login page → "Lost your passkey?"
  → Enter email
  → Enter recovery code (one of 8)
  → If valid:
    → Register new passkey
    → Redirect to dashboard
  → If invalid:
    → "Code incorrect" with retry limit
```

---

### Task 4: Push Notifications (P2 - Nice to Have)
**Effort:** 4-6 hours (requires backend work too)

**Backend Needs:**
- Push Protocol SDK integration
- Notification triggers for:
  - Transaction confirmations
  - Yield distributions
  - NAV updates

**Frontend Needs:**
- Push Protocol client
- Notification preferences in settings
- In-app notification center

**Can be deferred to post-hackathon.**

---

## Implementation Order

```
Day 1:
  [x] Task 1: Redemption UI (P0) - COMPLETE

Day 2:
  [x] Task 2: Recovery Codes UI (P1) - COMPLETE
  [x] Task 3: Account Recovery Flow (P1) - COMPLETE

Post-Hackathon:
  [ ] Task 4: Push Notifications (P2)
```

---

## Verification Checklist

### After Task 1 (Redemption):
- [x] User can see "Redeem" button on holdings
- [x] Redeem form shows correct share balance
- [x] Backend doesn't require passkey (simpler flow)
- [ ] Transaction succeeds on chain (needs runtime test)
- [x] Balance updates after redemption (refresh on complete)

### After Task 2 (Recovery Codes):
- [x] Settings shows recovery codes section
- [x] Can generate codes if none exist
- [x] Codes display properly (10 codes, copy/download)
- [x] Can regenerate with confirmation

### After Task 3 (Account Recovery):
- [x] "Lost passkey" link visible on login
- [x] Email entry step works (UI complete)
- [x] Recovery code verification works (UI complete)
- [x] New passkey registration flow (UI complete)
- [ ] End-to-end test (needs runtime verification)

---

## Notes

- All backend APIs already exist for Tasks 1-3
- Passkey signing flow already implemented for investment - reuse pattern
- Push notifications require backend work, defer if time-constrained
- Focus on P0 (Redemption) first - it's the only Tier 1 missing feature
