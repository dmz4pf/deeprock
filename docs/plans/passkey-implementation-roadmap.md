# Passkey Implementation Roadmap

## Executive Summary

Our passkey implementation works but is missing critical features that production apps (GitHub, Google, Apple) have. This plan addresses security gaps and UX improvements in priority order.

---

## Phase 1: Critical Security (Week 1)

### 1.1 Add Recovery Codes

**Why:** User loses device = permanent account lockout to tokenized assets

**Implementation:**

```typescript
// New model in schema.prisma
model RecoveryCode {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  codeHash  String   @map("code_hash")  // bcrypt hash
  used      Boolean  @default(false)
  usedAt    DateTime? @map("used_at")
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("recovery_codes")
}
```

**Endpoints:**
- `POST /api/auth/recovery/generate` - Generate 10 codes (during passkey setup)
- `POST /api/auth/recovery/verify` - Verify code and allow new passkey registration
- `GET /api/auth/recovery/status` - Check if codes exist, how many unused

**Flow:**
1. User registers passkey → generate 10 recovery codes
2. Show codes ONCE → user must save them
3. User loses device → enters recovery code
4. Valid code → allow new passkey registration
5. Code marked as used → can't reuse

---

### 1.2 Remove Single Passkey Limit

**Why:** No backup device = high lockout risk

**Current Code (DELETE):**
```typescript
if (existingUser?.biometricIdentities.length > 0) {
  throw new Error("User already has biometrics registered");
}
```

**New Code:**
```typescript
const MAX_PASSKEYS = 10;
if (existingUser?.biometricIdentities.length >= MAX_PASSKEYS) {
  throw new Error(`Maximum ${MAX_PASSKEYS} passkeys per account`);
}
```

---

### 1.3 Add Email Recovery Flow

**Why:** Secondary recovery method for users who lose recovery codes

**Endpoints:**
- `POST /api/auth/recover/request` - Send recovery email
- `POST /api/auth/recover/verify` - Verify token, allow passkey registration

**Flow:**
1. User clicks "Lost access to passkey"
2. Enter email → send time-limited token (15 min)
3. Click link → verify identity
4. Register new passkey
5. Optionally: revoke old passkeys

**Security:**
- Rate limit: 3 requests/hour per email
- Token expires in 15 minutes
- Require email to be verified before recovery

---

### 1.4 Store AAGUID Metadata

**Why:** Track authenticator models, enable mass revocation if compromised

**Schema Change:**
```typescript
model BiometricIdentity {
  // ... existing fields
  aaguid            String?  @map("aaguid")  // Authenticator model ID
  attestationFormat String?  @map("attestation_format")
  registrationIp    String?  @map("registration_ip")
  registrationUa    String?  @map("registration_ua")
}
```

**Code Change:**
```typescript
// In verifyRegistration()
const { aaguid } = verification.registrationInfo;

await tx.biometricIdentity.create({
  data: {
    // ... existing fields
    aaguid: aaguid ? Buffer.from(aaguid).toString('hex') : null,
    registrationIp: req.ip,
    registrationUa: req.headers['user-agent'],
  },
});
```

---

## Phase 2: Device Management (Week 2)

### 2.1 Enhanced Passkey Listing

**Current:** Basic list of passkeys
**New:** Rich device information

**Response Format:**
```typescript
interface PasskeyDevice {
  id: string;
  deviceName: string;        // User-editable
  deviceType: string;        // "platform" | "cross-platform"
  authenticatorModel: string; // Derived from AAGUID
  createdAt: string;
  lastUsedAt: string;
  lastUsedIp: string;
  lastUsedLocation: string;  // City, Country from IP
  isSynced: boolean;         // credentialBackedUp flag
  isCurrentDevice: boolean;
}
```

### 2.2 Device Naming

**Endpoint:** `PATCH /api/auth/passkeys/:id`

```typescript
{
  "deviceName": "Work MacBook Pro"
}
```

**Auto-suggest from User Agent:**
```typescript
import { UAParser } from 'ua-parser-js';

const parser = new UAParser(userAgent);
const suggestedName = `${parser.getOS().name} ${parser.getBrowser().name}`;
// Example: "macOS Chrome", "iOS Safari", "Windows Edge"
```

### 2.3 Last Used Tracking

**On every authentication:**
```typescript
await prisma.biometricIdentity.update({
  where: { id: credential.id },
  data: {
    authCounter: newCounter,
    lastUsedAt: new Date(),
    lastUsedIp: req.ip,
  },
});
```

### 2.4 Attestation Verification (Optional but Recommended)

**For high-security RWA operations:**

```typescript
import { verifyAttestationObject } from '@simplewebauthn/server';

// During registration
const attestationVerified = await verifyAttestationObject({
  attestationObject,
  clientDataHash,
  credentialPublicKey,
  expectedOrigin: ORIGIN,
  expectedRPID: RP_ID,
});

if (!attestationVerified) {
  // Log but don't block - most authenticators don't support attestation
  console.warn('Attestation verification failed for credential');
}

// Store attestation for future reference
await prisma.biometricIdentity.update({
  data: {
    attestationVerified: attestationVerified,
    attestationFormat: verification.registrationInfo.fmt,
  },
});
```

---

## Phase 3: Frontend UX (Week 3)

### 3.1 Conditional UI (Autofill)

**HTML:**
```html
<input
  type="email"
  name="username"
  autocomplete="username webauthn"
/>
```

**JavaScript:**
```typescript
// Enable conditional UI
const credential = await navigator.credentials.get({
  publicKey: {
    challenge: challengeBuffer,
    allowCredentials: [], // Empty for conditional UI
    userVerification: 'required',
  },
  mediation: 'conditional', // KEY: Enable autofill
});
```

### 3.2 Device Management Page

**Location:** `/settings/passkeys`

**Features:**
- List all registered passkeys with device info
- Edit device name (inline edit)
- Show last used time/location
- Delete button (with confirmation)
- "Add new passkey" button
- Warning if only 1 passkey registered
- Recovery codes section

### 3.3 Setup Wizard

**First-time passkey setup flow:**

```
Step 1: Explain passkeys
  "Passkeys let you sign in with Face ID, Touch ID, or Windows Hello"

Step 2: Create passkey
  [Browser prompt]

Step 3: Save recovery codes
  "Save these codes somewhere safe. You'll need them if you lose access."
  [Show 10 codes]
  [Download as .txt]
  [Checkbox: "I've saved these codes"]

Step 4: Add backup device (optional)
  "We recommend adding a second device as backup"
  [Add another passkey] or [Skip for now]
```

### 3.4 Error Handling

**User-friendly error messages:**

| Error | Message |
|-------|---------|
| `NotAllowedError` | "Passkey authentication was cancelled. Please try again." |
| `InvalidStateError` | "This passkey is already registered on your account." |
| `NotSupportedError` | "Your browser doesn't support passkeys. Try Chrome, Safari, or Edge." |
| `SecurityError` | "Passkeys require a secure connection (HTTPS)." |
| Credential not found | "This passkey isn't registered. Please sign in with email first, then add this passkey." |

---

## Phase 4: Advanced Features (Week 4+)

### 4.1 Cross-Device Authentication

**Flow:**
1. Desktop shows QR code
2. User scans with phone
3. Phone authenticates with passkey
4. Desktop receives auth token

**Implementation:**
```typescript
// Desktop initiates
POST /api/auth/cross-device/initiate
→ { qrCode: "data:image/png;...", sessionId: "..." }

// Phone scans, authenticates
POST /api/auth/cross-device/authenticate
{ sessionId, webauthnResponse }

// Desktop polls
GET /api/auth/cross-device/poll/:sessionId
→ { status: "pending" | "completed" | "expired", token?: "..." }
```

### 4.2 Anomaly Detection

**Track and alert on:**
- New device + new location
- Different time zone than usual
- Multiple failed attempts
- Credential used from unusual IP range

**Implementation:**
```typescript
interface AuthEvent {
  userId: string;
  credentialId: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
}

// After authentication
if (isNewDevice && isNewLocation) {
  await sendSecurityEmail(user.email, {
    subject: 'New device sign-in',
    message: `A new device signed into your account from ${location}`,
    action: 'If this wasn't you, secure your account immediately.',
  });
}
```

### 4.3 FIDO Metadata Service Integration

**For detecting compromised authenticators:**

```typescript
import { MetadataService } from '@simplewebauthn/server';

const mds = new MetadataService();
await mds.initialize();

// During registration
const metadata = await mds.getStatement(aaguid);
if (metadata?.statusReports.some(r =>
  ['REVOKED', 'USER_VERIFICATION_BYPASS'].includes(r.status)
)) {
  throw new Error('This authenticator has known security issues');
}
```

---

## Database Migrations

### Migration 1: Recovery Codes
```sql
CREATE TABLE recovery_codes (
  id VARCHAR(30) PRIMARY KEY,
  user_id VARCHAR(30) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash VARCHAR(60) NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_recovery_codes_user ON recovery_codes(user_id);
```

### Migration 2: Enhanced BiometricIdentity
```sql
ALTER TABLE biometric_identities
ADD COLUMN aaguid VARCHAR(36),
ADD COLUMN attestation_format VARCHAR(20),
ADD COLUMN attestation_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN registration_ip VARCHAR(45),
ADD COLUMN registration_ua TEXT,
ADD COLUMN last_used_at TIMESTAMP,
ADD COLUMN last_used_ip VARCHAR(45),
ADD COLUMN device_name VARCHAR(100);
```

---

## Testing Checklist

### Phase 1
- [ ] Generate recovery codes during registration
- [ ] Verify recovery code allows new passkey registration
- [ ] Recovery code marked as used after verification
- [ ] Can register multiple passkeys (up to 10)
- [ ] Email recovery sends token
- [ ] Email recovery token expires after 15 min
- [ ] AAGUID stored correctly

### Phase 2
- [ ] Passkey list shows all devices
- [ ] Can rename device
- [ ] Last used time updates on auth
- [ ] Can delete passkey (except last one)
- [ ] Attestation verification logged

### Phase 3
- [ ] Conditional UI works in Chrome
- [ ] Setup wizard shows recovery codes
- [ ] Device management page functional
- [ ] Error messages user-friendly

### Phase 4
- [ ] Cross-device QR code works
- [ ] Security alerts sent on new device
- [ ] FIDO MDS blocks compromised authenticators

---

## Effort Estimates

| Phase | Scope | Backend | Frontend | Testing | Total |
|-------|-------|---------|----------|---------|-------|
| 1 | Critical Security | 8h | 2h | 4h | 14h |
| 2 | Device Management | 6h | 8h | 4h | 18h |
| 3 | Frontend UX | 2h | 16h | 6h | 24h |
| 4 | Advanced | 12h | 8h | 8h | 28h |

**Total:** ~84 hours (~2 weeks full-time)

---

## Priority Recommendation

**Before any production deployment:**
1. Recovery codes (1.1)
2. Remove single-passkey limit (1.2)
3. Store AAGUID (1.4)

**Before public launch:**
4. Email recovery (1.3)
5. Device management page (2.1-2.3)
6. Setup wizard with recovery codes (3.3)

**Nice-to-have:**
7. Conditional UI
8. Cross-device auth
9. Anomaly detection
10. FIDO MDS
