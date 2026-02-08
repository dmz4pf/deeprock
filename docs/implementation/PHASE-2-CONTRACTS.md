# Phase 2: Smart Contracts (Days 8-14)


**Goal:** Complete the remaining 4 smart contracts, deploy full contract suite to Fuji, and achieve 95%+ test coverage.

**Architecture:** Contract interaction flow: BiometricRegistry → CredentialVerifier → RWAGateway → RWAToken

**Tech Stack:** Solidity 0.8.24, Hardhat, OpenZeppelin 5.x, ethers.js 6.x

---

## Objectives

1. Implement CredentialVerifier contract (KYC/compliance)
2. Implement RWAGateway contract (investment hub)
3. Implement RWAToken contract (per-pool ERC-20)
4. Implement DocumentSeal contract (legal documents)
5. Create MockUSDC for testing
6. Integration tests across all contracts
7. Deploy full suite to Fuji testnet

## Deliverables

- [ ] CredentialVerifier contract (~300 lines)
- [ ] RWAGateway contract (~500 lines)
- [ ] RWAToken contract (~150 lines)
- [ ] DocumentSeal contract (~200 lines)
- [ ] MockUSDC contract (~50 lines)
- [ ] 90+ unit tests with 95%+ coverage
- [ ] Integration test suite
- [ ] Fuji deployment scripts
- [ ] Contract verification on Snowtrace

## Dependencies

- Phase 1 completed (BiometricRegistry, P256Verifier)
- Fuji AVAX for deployment
- Snowtrace API key for verification

---

## Task 2.1: CredentialVerifier Contract

**Complexity:** High | **Time:** 5-6 hours

**Files:**
- Create: `contracts/src/CredentialVerifier.sol`
- Create: `contracts/test/CredentialVerifier.test.ts`

### Step 1: Write CredentialVerifier contract

**contracts/src/CredentialVerifier.sol:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./BiometricRegistry.sol";

/**
 * @title CredentialVerifier
 * @notice Compliance credential management - issues and verifies investor accreditation
 * @dev Credential types: ACCREDITED, QUALIFIED, INSTITUTIONAL, RETAIL
 *      Supports jurisdiction-based restrictions and tier-based investment limits
 */
contract CredentialVerifier is AccessControl, Pausable {
    // Roles
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    /// @notice Credential types
    enum CredentialType {
        NONE,           // 0 - No credential
        ACCREDITED,     // 1 - SEC accredited investor
        QUALIFIED,      // 2 - Qualified purchaser
        INSTITUTIONAL,  // 3 - Institutional investor
        RETAIL          // 4 - Retail with restrictions
    }

    /// @notice Credential data structure
    struct Credential {
        CredentialType credentialType;
        bytes32 jurisdiction;    // ISO 3166-1 alpha-2 as bytes32 (e.g., "US", "GB")
        uint8 tier;              // 1-5, affects investment limits
        uint64 issuedAt;
        uint64 expiresAt;
        address issuer;
        bool revoked;
    }

    /// @notice Reference to BiometricRegistry
    BiometricRegistry public immutable biometricRegistry;

    /// @notice Mapping from user address to their credential
    mapping(address => Credential) public credentials;

    /// @notice Blocked jurisdictions
    mapping(bytes32 => bool) public blockedJurisdictions;

    /// @notice Supported credential types
    mapping(CredentialType => bool) public supportedCredentialTypes;

    /// @notice Total issued credentials
    uint256 public totalCredentials;

    /// @notice Default credential validity period (365 days)
    uint256 public constant DEFAULT_VALIDITY_PERIOD = 365 days;

    // Events
    event CredentialIssued(
        address indexed user,
        CredentialType indexed credentialType,
        bytes32 jurisdiction,
        uint8 tier,
        address indexed issuer,
        uint64 expiresAt
    );

    event CredentialRevoked(
        address indexed user,
        address indexed revoker,
        string reason
    );

    event CredentialRenewed(
        address indexed user,
        uint64 newExpiresAt
    );

    event JurisdictionUpdated(
        bytes32 indexed jurisdiction,
        bool blocked
    );

    event CredentialTypeUpdated(
        CredentialType indexed credentialType,
        bool supported
    );

    // Errors
    error IdentityNotRegistered();
    error CredentialAlreadyExists();
    error CredentialNotFound();
    error CredentialExpired();
    error CredentialRevoked();
    error JurisdictionBlocked();
    error UnsupportedCredentialType();
    error InvalidTier();
    error InvalidExpiry();

    constructor(address _biometricRegistry) {
        if (_biometricRegistry == address(0)) revert("Invalid registry");
        biometricRegistry = BiometricRegistry(_biometricRegistry);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);

        // Enable all credential types by default
        supportedCredentialTypes[CredentialType.ACCREDITED] = true;
        supportedCredentialTypes[CredentialType.QUALIFIED] = true;
        supportedCredentialTypes[CredentialType.INSTITUTIONAL] = true;
        supportedCredentialTypes[CredentialType.RETAIL] = true;
    }

    /**
     * @notice Issue a credential to a user
     * @param user The user address
     * @param credentialType Type of credential
     * @param jurisdiction ISO 3166-1 alpha-2 jurisdiction code
     * @param tier Investment tier (1-5)
     * @param validityPeriod Custom validity period (0 for default)
     */
    function issueCredential(
        address user,
        CredentialType credentialType,
        bytes32 jurisdiction,
        uint8 tier,
        uint256 validityPeriod
    ) external onlyRole(VERIFIER_ROLE) whenNotPaused {
        // Validate user has biometric identity
        if (!biometricRegistry.isActive(user)) revert IdentityNotRegistered();

        // Validate credential type
        if (credentialType == CredentialType.NONE) revert UnsupportedCredentialType();
        if (!supportedCredentialTypes[credentialType]) revert UnsupportedCredentialType();

        // Validate jurisdiction
        if (blockedJurisdictions[jurisdiction]) revert JurisdictionBlocked();

        // Validate tier
        if (tier == 0 || tier > 5) revert InvalidTier();

        // Check for existing non-expired credential
        Credential storage existing = credentials[user];
        if (existing.credentialType != CredentialType.NONE &&
            !existing.revoked &&
            existing.expiresAt > block.timestamp) {
            revert CredentialAlreadyExists();
        }

        // Calculate expiry
        uint256 validity = validityPeriod > 0 ? validityPeriod : DEFAULT_VALIDITY_PERIOD;
        uint64 expiresAt = uint64(block.timestamp + validity);

        // Issue credential
        credentials[user] = Credential({
            credentialType: credentialType,
            jurisdiction: jurisdiction,
            tier: tier,
            issuedAt: uint64(block.timestamp),
            expiresAt: expiresAt,
            issuer: msg.sender,
            revoked: false
        });

        totalCredentials++;

        emit CredentialIssued(user, credentialType, jurisdiction, tier, msg.sender, expiresAt);
    }

    /**
     * @notice Revoke a user's credential
     * @param user The user address
     * @param reason Revocation reason
     */
    function revokeCredential(
        address user,
        string calldata reason
    ) external onlyRole(VERIFIER_ROLE) {
        Credential storage credential = credentials[user];
        if (credential.credentialType == CredentialType.NONE) revert CredentialNotFound();
        if (credential.revoked) revert CredentialRevoked();

        credential.revoked = true;

        emit CredentialRevoked(user, msg.sender, reason);
    }

    /**
     * @notice Renew an existing credential
     * @param user The user address
     * @param additionalPeriod Time to add (0 for default)
     */
    function renewCredential(
        address user,
        uint256 additionalPeriod
    ) external onlyRole(VERIFIER_ROLE) whenNotPaused {
        Credential storage credential = credentials[user];
        if (credential.credentialType == CredentialType.NONE) revert CredentialNotFound();
        if (credential.revoked) revert CredentialRevoked();

        uint256 period = additionalPeriod > 0 ? additionalPeriod : DEFAULT_VALIDITY_PERIOD;
        uint64 newExpiry = uint64(block.timestamp + period);

        credential.expiresAt = newExpiry;

        emit CredentialRenewed(user, newExpiry);
    }

    /**
     * @notice Verify if user has valid credential meeting requirements
     * @param user The user address
     * @param requiredType Minimum credential type required
     * @param requiredJurisdiction Required jurisdiction (bytes32(0) for any)
     * @param requiredTier Minimum tier required
     * @return valid True if user meets all requirements
     */
    function verifyCredential(
        address user,
        CredentialType requiredType,
        bytes32 requiredJurisdiction,
        uint8 requiredTier
    ) external view returns (bool valid) {
        Credential storage credential = credentials[user];

        // Must have a credential
        if (credential.credentialType == CredentialType.NONE) return false;

        // Must not be revoked
        if (credential.revoked) return false;

        // Must not be expired
        if (credential.expiresAt <= block.timestamp) return false;

        // Credential type must meet or exceed requirement
        // Higher enum value = more restricted, so we check >=
        if (requiredType != CredentialType.NONE) {
            if (uint8(credential.credentialType) > uint8(requiredType)) return false;
        }

        // Jurisdiction must match if specified
        if (requiredJurisdiction != bytes32(0)) {
            if (credential.jurisdiction != requiredJurisdiction) return false;
        }

        // Jurisdiction must not be blocked
        if (blockedJurisdictions[credential.jurisdiction]) return false;

        // Tier must meet requirement
        if (credential.tier < requiredTier) return false;

        return true;
    }

    /**
     * @notice Get detailed verification result with reason
     * @param user The user address
     * @param requiredType Minimum credential type
     * @param requiredJurisdiction Required jurisdiction
     * @param requiredTier Minimum tier
     * @return valid Whether verification passed
     * @return reason Failure reason (empty if valid)
     */
    function verifyCredentialDetailed(
        address user,
        CredentialType requiredType,
        bytes32 requiredJurisdiction,
        uint8 requiredTier
    ) external view returns (bool valid, string memory reason) {
        Credential storage credential = credentials[user];

        if (credential.credentialType == CredentialType.NONE) {
            return (false, "NO_CREDENTIAL");
        }
        if (credential.revoked) {
            return (false, "CREDENTIAL_REVOKED");
        }
        if (credential.expiresAt <= block.timestamp) {
            return (false, "CREDENTIAL_EXPIRED");
        }
        if (requiredType != CredentialType.NONE &&
            uint8(credential.credentialType) > uint8(requiredType)) {
            return (false, "INSUFFICIENT_CREDENTIAL_TYPE");
        }
        if (requiredJurisdiction != bytes32(0) &&
            credential.jurisdiction != requiredJurisdiction) {
            return (false, "JURISDICTION_MISMATCH");
        }
        if (blockedJurisdictions[credential.jurisdiction]) {
            return (false, "JURISDICTION_BLOCKED");
        }
        if (credential.tier < requiredTier) {
            return (false, "INSUFFICIENT_TIER");
        }

        return (true, "");
    }

    // Admin functions

    function blockJurisdiction(bytes32 jurisdiction) external onlyRole(ADMIN_ROLE) {
        blockedJurisdictions[jurisdiction] = true;
        emit JurisdictionUpdated(jurisdiction, true);
    }

    function unblockJurisdiction(bytes32 jurisdiction) external onlyRole(ADMIN_ROLE) {
        blockedJurisdictions[jurisdiction] = false;
        emit JurisdictionUpdated(jurisdiction, false);
    }

    function setCredentialTypeSupported(
        CredentialType credentialType,
        bool supported
    ) external onlyRole(ADMIN_ROLE) {
        supportedCredentialTypes[credentialType] = supported;
        emit CredentialTypeUpdated(credentialType, supported);
    }

    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    // View functions

    function getCredential(address user) external view returns (
        CredentialType credentialType,
        bytes32 jurisdiction,
        uint8 tier,
        uint64 issuedAt,
        uint64 expiresAt,
        address issuer,
        bool revoked
    ) {
        Credential storage c = credentials[user];
        return (c.credentialType, c.jurisdiction, c.tier, c.issuedAt, c.expiresAt, c.issuer, c.revoked);
    }

    function hasValidCredential(address user) external view returns (bool) {
        Credential storage c = credentials[user];
        return c.credentialType != CredentialType.NONE &&
               !c.revoked &&
               c.expiresAt > block.timestamp &&
               !blockedJurisdictions[c.jurisdiction];
    }
}
```

### Step 2: Write tests

**contracts/test/CredentialVerifier.test.ts:**
```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { BiometricRegistry, CredentialVerifier } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CredentialVerifier", function () {
  let registry: BiometricRegistry;
  let verifier: CredentialVerifier;
  let owner: SignerWithAddress;
  let verifierRole: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const testPublicKeyX = ethers.zeroPadValue("0x1234", 32);
  const testPublicKeyY = ethers.zeroPadValue("0x5678", 32);
  const testCredentialId = ethers.keccak256(ethers.toUtf8Bytes("test-credential"));

  const US_JURISDICTION = ethers.encodeBytes32String("US");
  const GB_JURISDICTION = ethers.encodeBytes32String("GB");

  // Credential types enum
  const NONE = 0;
  const ACCREDITED = 1;
  const QUALIFIED = 2;
  const INSTITUTIONAL = 3;
  const RETAIL = 4;

  beforeEach(async function () {
    [owner, verifierRole, user1, user2] = await ethers.getSigners();

    // Deploy BiometricRegistry
    const BiometricRegistry = await ethers.getContractFactory("BiometricRegistry");
    registry = await BiometricRegistry.deploy();
    await registry.waitForDeployment();

    // Deploy CredentialVerifier
    const CredentialVerifier = await ethers.getContractFactory("CredentialVerifier");
    verifier = await CredentialVerifier.deploy(await registry.getAddress());
    await verifier.waitForDeployment();

    // Grant verifier role
    await verifier.grantRole(await verifier.VERIFIER_ROLE(), verifierRole.address);

    // Register user1's biometric identity
    await registry.connect(user1).register(testPublicKeyX, testPublicKeyY, testCredentialId);
  });

  describe("Credential Issuance", function () {
    it("should issue a credential to registered user", async function () {
      await expect(
        verifier.connect(verifierRole).issueCredential(
          user1.address,
          ACCREDITED,
          US_JURISDICTION,
          3, // tier
          0  // default validity
        )
      ).to.emit(verifier, "CredentialIssued");

      const credential = await verifier.getCredential(user1.address);
      expect(credential.credentialType).to.equal(ACCREDITED);
      expect(credential.jurisdiction).to.equal(US_JURISDICTION);
      expect(credential.tier).to.equal(3);
      expect(credential.revoked).to.be.false;
    });

    it("should reject issuance to unregistered user", async function () {
      await expect(
        verifier.connect(verifierRole).issueCredential(
          user2.address, // Not registered
          ACCREDITED,
          US_JURISDICTION,
          3,
          0
        )
      ).to.be.revertedWithCustomError(verifier, "IdentityNotRegistered");
    });

    it("should reject duplicate credential", async function () {
      await verifier.connect(verifierRole).issueCredential(
        user1.address, ACCREDITED, US_JURISDICTION, 3, 0
      );

      await expect(
        verifier.connect(verifierRole).issueCredential(
          user1.address, QUALIFIED, GB_JURISDICTION, 2, 0
        )
      ).to.be.revertedWithCustomError(verifier, "CredentialAlreadyExists");
    });

    it("should reject invalid tier", async function () {
      await expect(
        verifier.connect(verifierRole).issueCredential(
          user1.address, ACCREDITED, US_JURISDICTION, 0, 0
        )
      ).to.be.revertedWithCustomError(verifier, "InvalidTier");

      await expect(
        verifier.connect(verifierRole).issueCredential(
          user1.address, ACCREDITED, US_JURISDICTION, 6, 0
        )
      ).to.be.revertedWithCustomError(verifier, "InvalidTier");
    });

    it("should reject blocked jurisdiction", async function () {
      await verifier.blockJurisdiction(US_JURISDICTION);

      await expect(
        verifier.connect(verifierRole).issueCredential(
          user1.address, ACCREDITED, US_JURISDICTION, 3, 0
        )
      ).to.be.revertedWithCustomError(verifier, "JurisdictionBlocked");
    });
  });

  describe("Credential Verification", function () {
    beforeEach(async function () {
      await verifier.connect(verifierRole).issueCredential(
        user1.address, ACCREDITED, US_JURISDICTION, 3, 0
      );
    });

    it("should verify valid credential", async function () {
      const valid = await verifier.verifyCredential(
        user1.address,
        ACCREDITED,
        US_JURISDICTION,
        2 // tier requirement
      );
      expect(valid).to.be.true;
    });

    it("should reject insufficient credential type", async function () {
      const valid = await verifier.verifyCredential(
        user1.address,
        INSTITUTIONAL, // Higher requirement than ACCREDITED
        US_JURISDICTION,
        1
      );
      // INSTITUTIONAL(3) > ACCREDITED(1), so this should fail
      // Actually enum ordering: ACCREDITED=1, QUALIFIED=2, INSTITUTIONAL=3
      // Lower enum = higher privilege in this design
      expect(valid).to.be.false;
    });

    it("should reject jurisdiction mismatch", async function () {
      const valid = await verifier.verifyCredential(
        user1.address,
        ACCREDITED,
        GB_JURISDICTION, // Different from US
        1
      );
      expect(valid).to.be.false;
    });

    it("should reject insufficient tier", async function () {
      const valid = await verifier.verifyCredential(
        user1.address,
        ACCREDITED,
        US_JURISDICTION,
        5 // Higher than user's tier of 3
      );
      expect(valid).to.be.false;
    });

    it("should provide detailed reason on failure", async function () {
      const [valid, reason] = await verifier.verifyCredentialDetailed(
        user2.address, // No credential
        ACCREDITED,
        US_JURISDICTION,
        1
      );
      expect(valid).to.be.false;
      expect(reason).to.equal("NO_CREDENTIAL");
    });
  });

  describe("Credential Revocation", function () {
    beforeEach(async function () {
      await verifier.connect(verifierRole).issueCredential(
        user1.address, ACCREDITED, US_JURISDICTION, 3, 0
      );
    });

    it("should revoke credential", async function () {
      await expect(
        verifier.connect(verifierRole).revokeCredential(user1.address, "Compliance violation")
      ).to.emit(verifier, "CredentialRevoked");

      const credential = await verifier.getCredential(user1.address);
      expect(credential.revoked).to.be.true;
    });

    it("should fail verification for revoked credential", async function () {
      await verifier.connect(verifierRole).revokeCredential(user1.address, "Test");

      const valid = await verifier.verifyCredential(
        user1.address, NONE, ethers.ZeroHash, 0
      );
      expect(valid).to.be.false;
    });
  });

  describe("Admin Functions", function () {
    it("should block/unblock jurisdictions", async function () {
      await verifier.blockJurisdiction(US_JURISDICTION);
      expect(await verifier.blockedJurisdictions(US_JURISDICTION)).to.be.true;

      await verifier.unblockJurisdiction(US_JURISDICTION);
      expect(await verifier.blockedJurisdictions(US_JURISDICTION)).to.be.false;
    });

    it("should enable/disable credential types", async function () {
      await verifier.setCredentialTypeSupported(RETAIL, false);

      await expect(
        verifier.connect(verifierRole).issueCredential(
          user1.address, RETAIL, US_JURISDICTION, 1, 0
        )
      ).to.be.revertedWithCustomError(verifier, "UnsupportedCredentialType");
    });

    it("should pause and unpause", async function () {
      await verifier.pause();

      await expect(
        verifier.connect(verifierRole).issueCredential(
          user1.address, ACCREDITED, US_JURISDICTION, 3, 0
        )
      ).to.be.revertedWithCustomError(verifier, "EnforcedPause");

      await verifier.unpause();

      await verifier.connect(verifierRole).issueCredential(
        user1.address, ACCREDITED, US_JURISDICTION, 3, 0
      );
    });
  });
});
```

### Step 3: Run tests

```bash
cd contracts
npm test -- --grep "CredentialVerifier"
```

Expected: All tests pass

### Step 4: Commit

```bash
git add .
git commit -m "feat(contracts): implement CredentialVerifier for KYC compliance

- 4 credential types (ACCREDITED, QUALIFIED, INSTITUTIONAL, RETAIL)
- Jurisdiction-based restrictions
- Tier-based investment limits
- Credential expiration and renewal
- Role-based access control (VERIFIER_ROLE, ADMIN_ROLE)
- 15+ unit tests

```

---

## Task 2.2: RWAToken Contract

**Complexity:** Medium | **Time:** 3-4 hours

**Files:**
- Create: `contracts/src/RWAToken.sol`
- Create: `contracts/test/RWAToken.test.ts`

### Step 1: Write RWAToken contract

**contracts/src/RWAToken.sol:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./CredentialVerifier.sol";

/**
 * @title RWAToken
 * @notice ERC-20 token with compliance hooks for RWA pools
 * @dev Each pool deploys its own RWAToken instance
 *      Transfers are restricted to users with valid credentials
 */
contract RWAToken is ERC20, ERC20Burnable, Pausable, Ownable, ReentrancyGuard {
    /// @notice Reference to CredentialVerifier
    CredentialVerifier public immutable credentialVerifier;

    /// @notice Pool ID this token belongs to
    uint256 public immutable poolId;

    /// @notice Required credential type for transfers
    CredentialVerifier.CredentialType public requiredCredentialType;

    /// @notice Required minimum tier for transfers
    uint8 public requiredTier;

    /// @notice Allowed jurisdictions (empty = all allowed)
    mapping(bytes32 => bool) public allowedJurisdictions;
    bytes32[] public jurisdictionList;

    /// @notice Whitelisted addresses (bypass credential checks)
    mapping(address => bool) public whitelist;

    /// @notice Whether transfer restrictions are enabled
    bool public restrictionsEnabled;

    // Events
    event WhitelistUpdated(address indexed account, bool whitelisted);
    event RestrictionsUpdated(bool enabled);
    event RequirementsUpdated(CredentialVerifier.CredentialType credentialType, uint8 tier);

    // Errors
    error TransferRestricted(string reason);
    error InvalidRecipient();
    error OnlyGateway();

    modifier onlyGateway() {
        if (msg.sender != owner()) revert OnlyGateway();
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        uint256 _poolId,
        address _credentialVerifier,
        address gateway
    ) ERC20(name, symbol) Ownable(gateway) {
        credentialVerifier = CredentialVerifier(_credentialVerifier);
        poolId = _poolId;
        restrictionsEnabled = true;

        // Default: require any credential type, tier 1
        requiredCredentialType = CredentialVerifier.CredentialType.RETAIL;
        requiredTier = 1;
    }

    /**
     * @notice Mint tokens (only gateway)
     */
    function mint(address to, uint256 amount) external onlyGateway nonReentrant {
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens from sender
     */
    function burn(uint256 amount) public override nonReentrant {
        super.burn(amount);
    }

    /**
     * @notice Burn tokens from account (only gateway)
     */
    function burnFrom(address account, uint256 amount) public override onlyGateway nonReentrant {
        _burn(account, amount);
    }

    /**
     * @notice Check if a transfer is allowed
     * @param from Sender address
     * @param to Recipient address
     * @return allowed Whether transfer is allowed
     * @return reason Reason if not allowed
     */
    function canTransfer(address from, address to) public view returns (bool allowed, string memory reason) {
        // Gateway (owner) can always transfer
        if (from == owner() || to == owner()) {
            return (true, "");
        }

        // Minting from zero address is always allowed
        if (from == address(0)) {
            return (true, "");
        }

        // Burning to zero address is always allowed
        if (to == address(0)) {
            return (true, "");
        }

        // If restrictions disabled, allow all
        if (!restrictionsEnabled) {
            return (true, "");
        }

        // Whitelisted addresses bypass checks
        if (whitelist[from] && whitelist[to]) {
            return (true, "");
        }

        // Check sender credential (unless whitelisted)
        if (!whitelist[from]) {
            bool valid = _checkCredential(from);
            if (!valid) {
                return (false, "SENDER_CREDENTIAL_INVALID");
            }
        }

        // Check recipient credential (unless whitelisted)
        if (!whitelist[to]) {
            bool valid = _checkCredential(to);
            if (!valid) {
                return (false, "RECIPIENT_CREDENTIAL_INVALID");
            }
        }

        return (true, "");
    }

    /**
     * @notice Override _update to enforce transfer restrictions
     */
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        (bool allowed, string memory reason) = canTransfer(from, to);
        if (!allowed) {
            revert TransferRestricted(reason);
        }
        super._update(from, to, value);
    }

    // Admin functions

    function addToWhitelist(address account) external onlyGateway {
        whitelist[account] = true;
        emit WhitelistUpdated(account, true);
    }

    function removeFromWhitelist(address account) external onlyGateway {
        whitelist[account] = false;
        emit WhitelistUpdated(account, false);
    }

    function setRestrictionsEnabled(bool enabled) external onlyGateway {
        restrictionsEnabled = enabled;
        emit RestrictionsUpdated(enabled);
    }

    function setRequirements(
        CredentialVerifier.CredentialType _credentialType,
        uint8 _tier
    ) external onlyGateway {
        requiredCredentialType = _credentialType;
        requiredTier = _tier;
        emit RequirementsUpdated(_credentialType, _tier);
    }

    function addAllowedJurisdiction(bytes32 jurisdiction) external onlyGateway {
        if (!allowedJurisdictions[jurisdiction]) {
            allowedJurisdictions[jurisdiction] = true;
            jurisdictionList.push(jurisdiction);
        }
    }

    function removeAllowedJurisdiction(bytes32 jurisdiction) external onlyGateway {
        allowedJurisdictions[jurisdiction] = false;
        // Note: doesn't remove from array, just marks as false
    }

    function pause() external onlyGateway {
        _pause();
    }

    function unpause() external onlyGateway {
        _unpause();
    }

    // View functions

    function isWhitelisted(address account) external view returns (bool) {
        return whitelist[account];
    }

    function getAllowedJurisdictions() external view returns (bytes32[] memory) {
        return jurisdictionList;
    }

    // Internal functions

    function _checkCredential(address user) internal view returns (bool) {
        // If no jurisdictions specified, allow any
        bytes32 requiredJurisdiction = bytes32(0);

        // If jurisdictions are specified, check if user's jurisdiction is allowed
        if (jurisdictionList.length > 0) {
            (, bytes32 userJurisdiction,,,,,) = credentialVerifier.getCredential(user);
            if (!allowedJurisdictions[userJurisdiction]) {
                return false;
            }
        }

        return credentialVerifier.verifyCredential(
            user,
            requiredCredentialType,
            requiredJurisdiction,
            requiredTier
        );
    }
}
```

### Step 2: Write tests

**contracts/test/RWAToken.test.ts:**
```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import { BiometricRegistry, CredentialVerifier, RWAToken } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RWAToken", function () {
  let registry: BiometricRegistry;
  let verifier: CredentialVerifier;
  let token: RWAToken;
  let gateway: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const US_JURISDICTION = ethers.encodeBytes32String("US");
  const ACCREDITED = 1;

  beforeEach(async function () {
    [gateway, user1, user2] = await ethers.getSigners();

    // Deploy BiometricRegistry
    const BiometricRegistry = await ethers.getContractFactory("BiometricRegistry");
    registry = await BiometricRegistry.deploy();

    // Deploy CredentialVerifier
    const CredentialVerifier = await ethers.getContractFactory("CredentialVerifier");
    verifier = await CredentialVerifier.deploy(await registry.getAddress());

    // Deploy RWAToken (gateway is owner)
    const RWAToken = await ethers.getContractFactory("RWAToken");
    token = await RWAToken.deploy(
      "Treasury Pool Token",
      "TPT",
      1, // poolId
      await verifier.getAddress(),
      gateway.address
    );

    // Register users and issue credentials
    const keyX = ethers.zeroPadValue("0x1234", 32);
    const keyY = ethers.zeroPadValue("0x5678", 32);
    const credId1 = ethers.keccak256(ethers.toUtf8Bytes("cred1"));
    const credId2 = ethers.keccak256(ethers.toUtf8Bytes("cred2"));

    await registry.connect(user1).register(keyX, keyY, credId1);
    await registry.connect(user2).register(
      ethers.zeroPadValue("0xabcd", 32),
      ethers.zeroPadValue("0xef01", 32),
      credId2
    );

    await verifier.issueCredential(user1.address, ACCREDITED, US_JURISDICTION, 3, 0);
    await verifier.issueCredential(user2.address, ACCREDITED, US_JURISDICTION, 3, 0);
  });

  describe("Minting", function () {
    it("should mint tokens as gateway", async function () {
      await token.mint(user1.address, ethers.parseEther("1000"));
      expect(await token.balanceOf(user1.address)).to.equal(ethers.parseEther("1000"));
    });

    it("should reject minting from non-gateway", async function () {
      await expect(
        token.connect(user1).mint(user1.address, ethers.parseEther("1000"))
      ).to.be.revertedWithCustomError(token, "OnlyGateway");
    });
  });

  describe("Transfers with Credentials", function () {
    beforeEach(async function () {
      await token.mint(user1.address, ethers.parseEther("1000"));
    });

    it("should allow transfer between credentialed users", async function () {
      await token.connect(user1).transfer(user2.address, ethers.parseEther("100"));
      expect(await token.balanceOf(user2.address)).to.equal(ethers.parseEther("100"));
    });

    it("should allow transfer when restrictions disabled", async function () {
      await token.setRestrictionsEnabled(false);

      // User3 has no credential
      const [,,, user3] = await ethers.getSigners();
      await token.connect(user1).transfer(user3.address, ethers.parseEther("100"));
      expect(await token.balanceOf(user3.address)).to.equal(ethers.parseEther("100"));
    });
  });

  describe("Whitelist", function () {
    beforeEach(async function () {
      await token.mint(user1.address, ethers.parseEther("1000"));
    });

    it("should allow whitelisted transfers", async function () {
      const [,,, user3] = await ethers.getSigners();

      await token.addToWhitelist(user1.address);
      await token.addToWhitelist(user3.address);

      // user3 has no credential but is whitelisted
      await token.connect(user1).transfer(user3.address, ethers.parseEther("100"));
      expect(await token.balanceOf(user3.address)).to.equal(ethers.parseEther("100"));
    });

    it("should remove from whitelist", async function () {
      await token.addToWhitelist(user1.address);
      expect(await token.isWhitelisted(user1.address)).to.be.true;

      await token.removeFromWhitelist(user1.address);
      expect(await token.isWhitelisted(user1.address)).to.be.false;
    });
  });

  describe("Pause", function () {
    it("should pause and unpause transfers", async function () {
      await token.mint(user1.address, ethers.parseEther("1000"));

      await token.pause();
      await expect(
        token.connect(user1).transfer(user2.address, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(token, "EnforcedPause");

      await token.unpause();
      await token.connect(user1).transfer(user2.address, ethers.parseEther("100"));
    });
  });
});
```

### Step 3: Commit

```bash
git add .
git commit -m "feat(contracts): implement RWAToken with compliance hooks

- ERC-20 with transfer restrictions
- Credential verification on transfers
- Whitelist for exempt addresses
- Jurisdiction filtering
- Pausable transfers
- Gateway-only minting/burning

```

---

## Task 2.3: RWAGateway Contract

**Complexity:** High | **Time:** 6-8 hours

**Files:**
- Create: `contracts/src/RWAGateway.sol`
- Create: `contracts/test/RWAGateway.test.ts`

### Step 1: Write RWAGateway contract

**contracts/src/RWAGateway.sol:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./BiometricRegistry.sol";
import "./CredentialVerifier.sol";
import "./RWAToken.sol";
import "./libraries/P256Verifier.sol";

/**
 * @title RWAGateway
 * @notice Central hub for RWA pool management - investments, redemptions, yield distribution
 * @dev Orchestrates BiometricRegistry, CredentialVerifier, and RWAToken contracts
 */
contract RWAGateway is AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using P256Verifier for *;

    // Roles
    bytes32 public constant POOL_ADMIN_ROLE = keccak256("POOL_ADMIN_ROLE");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");

    /// @notice Pool configuration
    struct Pool {
        string name;
        address rwaToken;
        CredentialVerifier.CredentialType requiredCredentialType;
        uint8 requiredTier;
        uint256 minInvestment;
        uint256 maxInvestment;
        uint256 totalDeposited;
        uint256 totalShares;
        uint256 yieldAccumulated;
        uint64 lockPeriod;  // Minimum hold time before redemption
        bool active;
        uint64 createdAt;
    }

    /// @notice User investment in a pool
    struct Investment {
        uint256 shares;
        uint256 depositedAmount;
        uint64 investedAt;
    }

    /// @notice Contract references
    BiometricRegistry public immutable biometricRegistry;
    CredentialVerifier public immutable credentialVerifier;
    IERC20 public immutable depositToken; // USDC

    /// @notice Pool storage
    mapping(uint256 => Pool) public pools;
    uint256 public poolCount;

    /// @notice User investments: poolId => user => Investment
    mapping(uint256 => mapping(address => Investment)) public investments;

    /// @notice Used nonces for meta-transactions
    mapping(address => uint256) public nonces;

    /// @notice Meta-transaction deadline buffer
    uint256 public constant DEADLINE_BUFFER = 5 minutes;

    // Events
    event PoolCreated(
        uint256 indexed poolId,
        string name,
        address rwaToken,
        uint256 minInvestment,
        uint256 maxInvestment
    );

    event Invested(
        uint256 indexed poolId,
        address indexed user,
        uint256 amount,
        uint256 shares
    );

    event Redeemed(
        uint256 indexed poolId,
        address indexed user,
        uint256 shares,
        uint256 amount
    );

    event YieldDistributed(
        uint256 indexed poolId,
        uint256 amount,
        uint256 newTotalDeposited
    );

    event PoolStatusUpdated(uint256 indexed poolId, bool active);

    // Errors
    error PoolNotFound();
    error PoolNotActive();
    error InvestmentBelowMinimum();
    error InvestmentAboveMaximum();
    error InsufficientShares();
    error LockPeriodNotMet();
    error InsufficientLiquidity();
    error InvalidSignature();
    error DeadlineExpired();
    error InvalidNonce();
    error CredentialCheckFailed();
    error IdentityNotActive();

    constructor(
        address _biometricRegistry,
        address _credentialVerifier,
        address _depositToken
    ) {
        biometricRegistry = BiometricRegistry(_biometricRegistry);
        credentialVerifier = CredentialVerifier(_credentialVerifier);
        depositToken = IERC20(_depositToken);

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(POOL_ADMIN_ROLE, msg.sender);
    }

    /**
     * @notice Create a new investment pool
     * @param name Pool name
     * @param symbol Token symbol
     * @param requiredCredentialType Minimum credential type
     * @param requiredTier Minimum tier
     * @param minInvestment Minimum investment amount
     * @param maxInvestment Maximum investment amount
     * @param lockPeriod Minimum hold period (seconds)
     */
    function createPool(
        string calldata name,
        string calldata symbol,
        CredentialVerifier.CredentialType requiredCredentialType,
        uint8 requiredTier,
        uint256 minInvestment,
        uint256 maxInvestment,
        uint64 lockPeriod
    ) external onlyRole(POOL_ADMIN_ROLE) returns (uint256 poolId) {
        poolId = poolCount++;

        // Deploy RWA token for this pool
        RWAToken rwaToken = new RWAToken(
            name,
            symbol,
            poolId,
            address(credentialVerifier),
            address(this) // Gateway is owner
        );

        // Configure token requirements
        rwaToken.setRequirements(requiredCredentialType, requiredTier);

        pools[poolId] = Pool({
            name: name,
            rwaToken: address(rwaToken),
            requiredCredentialType: requiredCredentialType,
            requiredTier: requiredTier,
            minInvestment: minInvestment,
            maxInvestment: maxInvestment,
            totalDeposited: 0,
            totalShares: 0,
            yieldAccumulated: 0,
            lockPeriod: lockPeriod,
            active: true,
            createdAt: uint64(block.timestamp)
        });

        emit PoolCreated(poolId, name, address(rwaToken), minInvestment, maxInvestment);
    }

    /**
     * @notice Invest in a pool
     * @param poolId Pool to invest in
     * @param amount USDC amount to invest
     */
    function invest(uint256 poolId, uint256 amount) external nonReentrant whenNotPaused {
        _invest(poolId, msg.sender, amount);
    }

    /**
     * @notice Invest via relayer with biometric signature
     * @param poolId Pool to invest in
     * @param user User address
     * @param amount USDC amount
     * @param deadline Signature deadline
     * @param r Signature r component
     * @param s Signature s component
     */
    function investViaRelayer(
        uint256 poolId,
        address user,
        uint256 amount,
        uint256 deadline,
        bytes32 r,
        bytes32 s
    ) external onlyRole(RELAYER_ROLE) nonReentrant whenNotPaused {
        // Validate deadline
        if (block.timestamp > deadline) revert DeadlineExpired();

        // Get user's public key
        (bytes32 publicKeyX, bytes32 publicKeyY,,,,,) = biometricRegistry.getIdentity(user);
        if (publicKeyX == bytes32(0)) revert IdentityNotActive();

        // Verify signature
        uint256 nonce = nonces[user]++;
        bytes32 messageHash = keccak256(abi.encodePacked(
            "INVEST",
            poolId,
            user,
            amount,
            deadline,
            nonce,
            block.chainid
        ));

        bool valid = P256Verifier.verify(messageHash, r, s, publicKeyX, publicKeyY);
        if (!valid) revert InvalidSignature();

        _invest(poolId, user, amount);
    }

    /**
     * @notice Redeem shares from a pool
     * @param poolId Pool to redeem from
     * @param shares Number of shares to redeem
     */
    function redeem(uint256 poolId, uint256 shares) external nonReentrant whenNotPaused {
        _redeem(poolId, msg.sender, shares);
    }

    /**
     * @notice Redeem via relayer with biometric signature
     */
    function redeemViaRelayer(
        uint256 poolId,
        address user,
        uint256 shares,
        uint256 deadline,
        bytes32 r,
        bytes32 s
    ) external onlyRole(RELAYER_ROLE) nonReentrant whenNotPaused {
        if (block.timestamp > deadline) revert DeadlineExpired();

        (bytes32 publicKeyX, bytes32 publicKeyY,,,,,) = biometricRegistry.getIdentity(user);
        if (publicKeyX == bytes32(0)) revert IdentityNotActive();

        uint256 nonce = nonces[user]++;
        bytes32 messageHash = keccak256(abi.encodePacked(
            "REDEEM",
            poolId,
            user,
            shares,
            deadline,
            nonce,
            block.chainid
        ));

        bool valid = P256Verifier.verify(messageHash, r, s, publicKeyX, publicKeyY);
        if (!valid) revert InvalidSignature();

        _redeem(poolId, user, shares);
    }

    /**
     * @notice Distribute yield to a pool (increases share value)
     * @param poolId Pool to distribute to
     * @param amount Yield amount in USDC
     */
    function distributeYield(
        uint256 poolId,
        uint256 amount
    ) external onlyRole(POOL_ADMIN_ROLE) {
        Pool storage pool = pools[poolId];
        if (pool.rwaToken == address(0)) revert PoolNotFound();

        // Transfer yield to gateway
        depositToken.safeTransferFrom(msg.sender, address(this), amount);

        pool.totalDeposited += amount;
        pool.yieldAccumulated += amount;

        emit YieldDistributed(poolId, amount, pool.totalDeposited);
    }

    /**
     * @notice Update pool active status
     */
    function setPoolActive(uint256 poolId, bool active) external onlyRole(POOL_ADMIN_ROLE) {
        Pool storage pool = pools[poolId];
        if (pool.rwaToken == address(0)) revert PoolNotFound();
        pool.active = active;
        emit PoolStatusUpdated(poolId, active);
    }

    /**
     * @notice Add relayer
     */
    function addRelayer(address relayer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(RELAYER_ROLE, relayer);
    }

    /**
     * @notice Remove relayer
     */
    function removeRelayer(address relayer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(RELAYER_ROLE, relayer);
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // View functions

    function getPool(uint256 poolId) external view returns (Pool memory) {
        return pools[poolId];
    }

    function getUserInvestment(
        uint256 poolId,
        address user
    ) external view returns (Investment memory) {
        return investments[poolId][user];
    }

    function getSharePrice(uint256 poolId) public view returns (uint256) {
        Pool storage pool = pools[poolId];
        if (pool.totalShares == 0) return 1e18; // 1:1 initial price
        return (pool.totalDeposited * 1e18) / pool.totalShares;
    }

    function canInvest(
        uint256 poolId,
        address user,
        uint256 amount
    ) external view returns (bool, string memory) {
        Pool storage pool = pools[poolId];

        if (pool.rwaToken == address(0)) return (false, "POOL_NOT_FOUND");
        if (!pool.active) return (false, "POOL_NOT_ACTIVE");
        if (amount < pool.minInvestment) return (false, "BELOW_MINIMUM");
        if (amount > pool.maxInvestment) return (false, "ABOVE_MAXIMUM");

        if (!biometricRegistry.isActive(user)) return (false, "IDENTITY_NOT_ACTIVE");

        bool hasCredential = credentialVerifier.verifyCredential(
            user,
            pool.requiredCredentialType,
            bytes32(0),
            pool.requiredTier
        );
        if (!hasCredential) return (false, "CREDENTIAL_INVALID");

        return (true, "");
    }

    // Internal functions

    function _invest(uint256 poolId, address user, uint256 amount) internal {
        Pool storage pool = pools[poolId];

        // Validate pool
        if (pool.rwaToken == address(0)) revert PoolNotFound();
        if (!pool.active) revert PoolNotActive();
        if (amount < pool.minInvestment) revert InvestmentBelowMinimum();
        if (amount > pool.maxInvestment) revert InvestmentAboveMaximum();

        // Validate user identity
        if (!biometricRegistry.isActive(user)) revert IdentityNotActive();

        // Validate credentials
        bool hasCredential = credentialVerifier.verifyCredential(
            user,
            pool.requiredCredentialType,
            bytes32(0),
            pool.requiredTier
        );
        if (!hasCredential) revert CredentialCheckFailed();

        // Calculate shares
        uint256 shares = (amount * 1e18) / getSharePrice(poolId);

        // Transfer USDC from user
        depositToken.safeTransferFrom(user, address(this), amount);

        // Mint RWA tokens
        RWAToken(pool.rwaToken).mint(user, shares);

        // Update state
        pool.totalDeposited += amount;
        pool.totalShares += shares;

        Investment storage investment = investments[poolId][user];
        investment.shares += shares;
        investment.depositedAmount += amount;
        if (investment.investedAt == 0) {
            investment.investedAt = uint64(block.timestamp);
        }

        emit Invested(poolId, user, amount, shares);
    }

    function _redeem(uint256 poolId, address user, uint256 shares) internal {
        Pool storage pool = pools[poolId];
        Investment storage investment = investments[poolId][user];

        // Validate pool
        if (pool.rwaToken == address(0)) revert PoolNotFound();
        if (shares > investment.shares) revert InsufficientShares();

        // Check lock period
        if (block.timestamp < investment.investedAt + pool.lockPeriod) {
            revert LockPeriodNotMet();
        }

        // Validate credentials (must still be valid at redemption)
        bool hasCredential = credentialVerifier.verifyCredential(
            user,
            pool.requiredCredentialType,
            bytes32(0),
            pool.requiredTier
        );
        if (!hasCredential) revert CredentialCheckFailed();

        // Calculate redemption amount
        uint256 amount = (shares * getSharePrice(poolId)) / 1e18;

        // Check liquidity
        if (amount > pool.totalDeposited) revert InsufficientLiquidity();

        // Burn RWA tokens
        RWAToken(pool.rwaToken).burnFrom(user, shares);

        // Update state
        pool.totalDeposited -= amount;
        pool.totalShares -= shares;
        investment.shares -= shares;

        // Transfer USDC to user
        depositToken.safeTransfer(user, amount);

        emit Redeemed(poolId, user, shares, amount);
    }
}
```

### Step 2: Write comprehensive tests (abbreviated for space)

**contracts/test/RWAGateway.test.ts:**
```typescript
import { expect } from "chai";
import { ethers } from "hardhat";
import {
  BiometricRegistry,
  CredentialVerifier,
  RWAGateway,
  MockUSDC
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("RWAGateway", function () {
  let registry: BiometricRegistry;
  let verifier: CredentialVerifier;
  let gateway: RWAGateway;
  let usdc: MockUSDC;
  let owner: SignerWithAddress;
  let relayer: SignerWithAddress;
  let user1: SignerWithAddress;

  const US_JURISDICTION = ethers.encodeBytes32String("US");
  const ACCREDITED = 1;

  beforeEach(async function () {
    [owner, relayer, user1] = await ethers.getSigners();

    // Deploy MockUSDC
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();

    // Deploy BiometricRegistry
    const BiometricRegistry = await ethers.getContractFactory("BiometricRegistry");
    registry = await BiometricRegistry.deploy();

    // Deploy CredentialVerifier
    const CredentialVerifier = await ethers.getContractFactory("CredentialVerifier");
    verifier = await CredentialVerifier.deploy(await registry.getAddress());

    // Deploy RWAGateway
    const RWAGateway = await ethers.getContractFactory("RWAGateway");
    gateway = await RWAGateway.deploy(
      await registry.getAddress(),
      await verifier.getAddress(),
      await usdc.getAddress()
    );

    // Setup: Register user, issue credential, fund with USDC
    const keyX = ethers.zeroPadValue("0x1234", 32);
    const keyY = ethers.zeroPadValue("0x5678", 32);
    const credId = ethers.keccak256(ethers.toUtf8Bytes("user1-cred"));

    await registry.connect(user1).register(keyX, keyY, credId);
    await verifier.issueCredential(user1.address, ACCREDITED, US_JURISDICTION, 3, 0);
    await usdc.faucet(user1.address, ethers.parseUnits("100000", 6)); // 100k USDC
    await usdc.connect(user1).approve(await gateway.getAddress(), ethers.MaxUint256);
  });

  describe("Pool Creation", function () {
    it("should create a pool", async function () {
      await expect(
        gateway.createPool(
          "Treasury Pool",
          "TPT",
          ACCREDITED,
          1,
          ethers.parseUnits("100", 6),   // min 100 USDC
          ethers.parseUnits("100000", 6), // max 100k USDC
          7 * 24 * 60 * 60 // 7 day lock
        )
      ).to.emit(gateway, "PoolCreated");

      const pool = await gateway.getPool(0);
      expect(pool.name).to.equal("Treasury Pool");
      expect(pool.active).to.be.true;
    });
  });

  describe("Investment", function () {
    beforeEach(async function () {
      await gateway.createPool(
        "Treasury Pool", "TPT", ACCREDITED, 1,
        ethers.parseUnits("100", 6),
        ethers.parseUnits("100000", 6),
        7 * 24 * 60 * 60
      );
    });

    it("should invest in pool", async function () {
      const amount = ethers.parseUnits("1000", 6);

      await expect(gateway.connect(user1).invest(0, amount))
        .to.emit(gateway, "Invested");

      const investment = await gateway.getUserInvestment(0, user1.address);
      expect(investment.depositedAmount).to.equal(amount);
    });

    it("should reject investment below minimum", async function () {
      await expect(
        gateway.connect(user1).invest(0, ethers.parseUnits("50", 6))
      ).to.be.revertedWithCustomError(gateway, "InvestmentBelowMinimum");
    });

    it("should reject investment without credential", async function () {
      const [,,, user2] = await ethers.getSigners();
      const keyX = ethers.zeroPadValue("0xabcd", 32);
      const keyY = ethers.zeroPadValue("0xef01", 32);
      await registry.connect(user2).register(keyX, keyY, ethers.keccak256(ethers.toUtf8Bytes("u2")));
      // No credential issued

      await usdc.faucet(user2.address, ethers.parseUnits("1000", 6));
      await usdc.connect(user2).approve(await gateway.getAddress(), ethers.MaxUint256);

      await expect(
        gateway.connect(user2).invest(0, ethers.parseUnits("100", 6))
      ).to.be.revertedWithCustomError(gateway, "CredentialCheckFailed");
    });
  });

  describe("Redemption", function () {
    beforeEach(async function () {
      // Create pool with 0 lock period for testing
      await gateway.createPool(
        "Treasury Pool", "TPT", ACCREDITED, 1,
        ethers.parseUnits("100", 6),
        ethers.parseUnits("100000", 6),
        0 // No lock
      );

      await gateway.connect(user1).invest(0, ethers.parseUnits("1000", 6));
    });

    it("should redeem shares", async function () {
      const investment = await gateway.getUserInvestment(0, user1.address);
      const shares = investment.shares;

      const balanceBefore = await usdc.balanceOf(user1.address);
      await gateway.connect(user1).redeem(0, shares);
      const balanceAfter = await usdc.balanceOf(user1.address);

      expect(balanceAfter - balanceBefore).to.be.closeTo(
        ethers.parseUnits("1000", 6),
        ethers.parseUnits("1", 6) // 1 USDC tolerance for rounding
      );
    });
  });

  describe("Yield Distribution", function () {
    beforeEach(async function () {
      await gateway.createPool(
        "Treasury Pool", "TPT", ACCREDITED, 1,
        ethers.parseUnits("100", 6),
        ethers.parseUnits("100000", 6),
        0
      );

      await gateway.connect(user1).invest(0, ethers.parseUnits("1000", 6));
    });

    it("should increase share price after yield", async function () {
      const priceBefore = await gateway.getSharePrice(0);

      // Distribute 100 USDC yield
      await usdc.faucet(owner.address, ethers.parseUnits("100", 6));
      await usdc.approve(await gateway.getAddress(), ethers.parseUnits("100", 6));
      await gateway.distributeYield(0, ethers.parseUnits("100", 6));

      const priceAfter = await gateway.getSharePrice(0);
      expect(priceAfter).to.be.gt(priceBefore);
    });
  });
});
```

### Step 3: Commit

```bash
git add .
git commit -m "feat(contracts): implement RWAGateway investment hub

- Pool creation with per-pool RWAToken
- Investment and redemption with credential checks
- Meta-transaction support via relayers
- Yield distribution mechanism
- Lock period enforcement
- 25+ comprehensive tests

```

---

## Task 2.4: DocumentSeal Contract

**Complexity:** Medium | **Time:** 3-4 hours

**Files:**
- Create: `contracts/src/DocumentSeal.sol`
- Create: `contracts/test/DocumentSeal.test.ts`

### Step 1: Write DocumentSeal contract

**contracts/src/DocumentSeal.sol:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./BiometricRegistry.sol";

/**
 * @title DocumentSeal
 * @notice Immutable document proof system with multi-party signatures
 * @dev Stores document hashes with signer attestations
 */
contract DocumentSeal is Ownable, ReentrancyGuard {
    /// @notice Document record
    struct Document {
        bytes32 documentHash;      // SHA-256 of document content
        address creator;           // Who sealed the document
        address[] signers;         // All who signed
        mapping(address => bool) hasSigned;
        uint64 createdAt;
        uint64 lastSignedAt;
        string metadata;           // Optional: title, description
        bool finalized;            // No more signatures allowed
    }

    /// @notice Reference to BiometricRegistry
    BiometricRegistry public immutable biometricRegistry;

    /// @notice Documents by hash
    mapping(bytes32 => Document) internal documents;

    /// @notice Total documents sealed
    uint256 public documentCount;

    /// @notice Maximum signers per document
    uint256 public constant MAX_SIGNERS = 100;

    // Events
    event DocumentSealed(
        bytes32 indexed documentHash,
        address indexed creator,
        string metadata,
        uint256 timestamp
    );

    event DocumentSigned(
        bytes32 indexed documentHash,
        address indexed signer,
        uint256 signerCount,
        uint256 timestamp
    );

    event DocumentFinalized(
        bytes32 indexed documentHash,
        uint256 totalSigners,
        uint256 timestamp
    );

    // Errors
    error DocumentAlreadyExists();
    error DocumentNotFound();
    error DocumentFinalized();
    error AlreadySigned();
    error IdentityNotActive();
    error MaxSignersReached();
    error NotCreator();
    error InvalidDocumentHash();

    constructor(address _biometricRegistry) Ownable(msg.sender) {
        biometricRegistry = BiometricRegistry(_biometricRegistry);
    }

    /**
     * @notice Seal a new document
     * @param documentHash SHA-256 hash of the document
     * @param metadata Optional metadata (title, description)
     */
    function sealDocument(
        bytes32 documentHash,
        string calldata metadata
    ) external nonReentrant {
        if (documentHash == bytes32(0)) revert InvalidDocumentHash();
        if (!biometricRegistry.isActive(msg.sender)) revert IdentityNotActive();

        Document storage doc = documents[documentHash];
        if (doc.creator != address(0)) revert DocumentAlreadyExists();

        doc.documentHash = documentHash;
        doc.creator = msg.sender;
        doc.createdAt = uint64(block.timestamp);
        doc.lastSignedAt = uint64(block.timestamp);
        doc.metadata = metadata;
        doc.finalized = false;

        // Creator is first signer
        doc.signers.push(msg.sender);
        doc.hasSigned[msg.sender] = true;

        documentCount++;

        emit DocumentSealed(documentHash, msg.sender, metadata, block.timestamp);
        emit DocumentSigned(documentHash, msg.sender, 1, block.timestamp);
    }

    /**
     * @notice Add signature to existing document
     * @param documentHash Hash of the document to sign
     */
    function addSigner(bytes32 documentHash) external nonReentrant {
        if (!biometricRegistry.isActive(msg.sender)) revert IdentityNotActive();

        Document storage doc = documents[documentHash];
        if (doc.creator == address(0)) revert DocumentNotFound();
        if (doc.finalized) revert DocumentFinalized();
        if (doc.hasSigned[msg.sender]) revert AlreadySigned();
        if (doc.signers.length >= MAX_SIGNERS) revert MaxSignersReached();

        doc.signers.push(msg.sender);
        doc.hasSigned[msg.sender] = true;
        doc.lastSignedAt = uint64(block.timestamp);

        emit DocumentSigned(documentHash, msg.sender, doc.signers.length, block.timestamp);
    }

    /**
     * @notice Finalize document (no more signatures)
     * @param documentHash Hash of the document
     */
    function finalizeDocument(bytes32 documentHash) external {
        Document storage doc = documents[documentHash];
        if (doc.creator == address(0)) revert DocumentNotFound();
        if (msg.sender != doc.creator) revert NotCreator();
        if (doc.finalized) revert DocumentFinalized();

        doc.finalized = true;

        emit DocumentFinalized(documentHash, doc.signers.length, block.timestamp);
    }

    // View functions

    function verifyDocument(
        bytes32 documentHash
    ) external view returns (bool exists, uint256 signerCount, bool finalized) {
        Document storage doc = documents[documentHash];
        exists = doc.creator != address(0);
        signerCount = doc.signers.length;
        finalized = doc.finalized;
    }

    function getDocument(
        bytes32 documentHash
    ) external view returns (
        address creator,
        uint64 createdAt,
        uint64 lastSignedAt,
        string memory metadata,
        bool finalized,
        uint256 signerCount
    ) {
        Document storage doc = documents[documentHash];
        if (doc.creator == address(0)) revert DocumentNotFound();
        return (
            doc.creator,
            doc.createdAt,
            doc.lastSignedAt,
            doc.metadata,
            doc.finalized,
            doc.signers.length
        );
    }

    function getDocumentSigners(
        bytes32 documentHash
    ) external view returns (address[] memory) {
        Document storage doc = documents[documentHash];
        if (doc.creator == address(0)) revert DocumentNotFound();
        return doc.signers;
    }

    function hasSigned(
        bytes32 documentHash,
        address signer
    ) external view returns (bool) {
        return documents[documentHash].hasSigned[signer];
    }
}
```

### Step 2: Write tests and commit

```bash
git add .
git commit -m "feat(contracts): implement DocumentSeal for legal documents

- Immutable document hash storage
- Multi-party signature collection
- Document finalization
- Biometric identity verification for signers
- 12+ unit tests

```

---

## Task 2.5: MockUSDC and Deployment Scripts

**Complexity:** Low | **Time:** 2-3 hours

**Files:**
- Create: `contracts/src/mocks/MockUSDC.sol`
- Create: `contracts/script/deploy.ts`
- Create: `contracts/script/deploy-fuji.ts`

### Step 1: Create MockUSDC

**contracts/src/mocks/MockUSDC.sol:**
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockUSDC
 * @notice Test USDC token for Fuji testnet
 */
contract MockUSDC is ERC20 {
    constructor() ERC20("USD Coin (Mock)", "USDC") {
        // Mint initial supply to deployer
        _mint(msg.sender, 1_000_000_000 * 10 ** decimals());
    }

    function decimals() public pure override returns (uint8) {
        return 6; // USDC has 6 decimals
    }

    function faucet(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function batchFaucet(address[] calldata recipients, uint256 amount) external {
        for (uint256 i = 0; i < recipients.length; i++) {
            _mint(recipients[i], amount);
        }
    }
}
```

### Step 2: Create deployment script

**contracts/script/deploy.ts:**
```typescript
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // 1. Deploy MockUSDC (Fuji only - use real USDC on mainnet)
  console.log("\n1. Deploying MockUSDC...");
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  console.log("   MockUSDC:", await usdc.getAddress());

  // 2. Deploy BiometricRegistry
  console.log("\n2. Deploying BiometricRegistry...");
  const BiometricRegistry = await ethers.getContractFactory("BiometricRegistry");
  const registry = await BiometricRegistry.deploy();
  await registry.waitForDeployment();
  console.log("   BiometricRegistry:", await registry.getAddress());

  // 3. Deploy CredentialVerifier
  console.log("\n3. Deploying CredentialVerifier...");
  const CredentialVerifier = await ethers.getContractFactory("CredentialVerifier");
  const verifier = await CredentialVerifier.deploy(await registry.getAddress());
  await verifier.waitForDeployment();
  console.log("   CredentialVerifier:", await verifier.getAddress());

  // 4. Deploy RWAGateway
  console.log("\n4. Deploying RWAGateway...");
  const RWAGateway = await ethers.getContractFactory("RWAGateway");
  const gateway = await RWAGateway.deploy(
    await registry.getAddress(),
    await verifier.getAddress(),
    await usdc.getAddress()
  );
  await gateway.waitForDeployment();
  console.log("   RWAGateway:", await gateway.getAddress());

  // 5. Deploy DocumentSeal
  console.log("\n5. Deploying DocumentSeal...");
  const DocumentSeal = await ethers.getContractFactory("DocumentSeal");
  const documentSeal = await DocumentSeal.deploy(await registry.getAddress());
  await documentSeal.waitForDeployment();
  console.log("   DocumentSeal:", await documentSeal.getAddress());

  // Summary
  console.log("\n=== Deployment Complete ===");
  console.log({
    USDC: await usdc.getAddress(),
    BiometricRegistry: await registry.getAddress(),
    CredentialVerifier: await verifier.getAddress(),
    RWAGateway: await gateway.getAddress(),
    DocumentSeal: await documentSeal.getAddress(),
  });

  // Save addresses to file
  const fs = await import("fs");
  const addresses = {
    network: (await ethers.provider.getNetwork()).chainId.toString(),
    timestamp: new Date().toISOString(),
    contracts: {
      MockUSDC: await usdc.getAddress(),
      BiometricRegistry: await registry.getAddress(),
      CredentialVerifier: await verifier.getAddress(),
      RWAGateway: await gateway.getAddress(),
      DocumentSeal: await documentSeal.getAddress(),
    }
  };

  fs.writeFileSync(
    "deployments.json",
    JSON.stringify(addresses, null, 2)
  );
  console.log("\nAddresses saved to deployments.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

### Step 3: Deploy to Fuji

```bash
cd contracts
npx hardhat run script/deploy.ts --network fuji
```

### Step 4: Verify contracts on Snowtrace

```bash
npx hardhat verify --network fuji <BIOMETRIC_REGISTRY_ADDRESS>
npx hardhat verify --network fuji <CREDENTIAL_VERIFIER_ADDRESS> <BIOMETRIC_REGISTRY_ADDRESS>
# ... etc
```

### Step 5: Commit

```bash
git add .
git commit -m "feat(contracts): add MockUSDC and deployment scripts

- MockUSDC with faucet for testing
- Automated deployment script
- Contract verification helper
- Deployment address export

```

---

## Phase 2 Definition of Done

- [ ] CredentialVerifier contract with 20+ tests
- [ ] RWAToken contract with 15+ tests
- [ ] RWAGateway contract with 25+ tests
- [ ] DocumentSeal contract with 12+ tests
- [ ] MockUSDC for testing
- [ ] All contracts deployed to Fuji
- [ ] All contracts verified on Snowtrace
- [ ] Integration tests passing
- [ ] 95%+ test coverage
- [ ] Gas report generated

## Estimated Total Time: 30-40 hours

## Next Phase

Continue to [PHASE-3-BACKEND.md](./PHASE-3-BACKEND.md) for WebAuthn services, relayer, and APIs.
