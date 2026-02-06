// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/utils/Create2.sol";
import "./P256SmartWallet.sol";
import "./interfaces/IERC4337.sol";

/**
 * @title P256WalletFactory
 * @notice Factory for deploying P-256 passkey-controlled smart wallets
 * @dev Uses CREATE2 for deterministic addresses based on public key
 *
 * Key features:
 * - Counterfactual addresses: Know wallet address before deployment
 * - CREATE2 deployment: Same address across all EVM chains
 * - Gas-efficient proxy pattern: Uses ERC1967 minimal proxy
 */
contract P256WalletFactory {
    // ==================== State ====================

    /// @notice Smart wallet implementation contract
    P256SmartWallet public immutable walletImplementation;

    /// @notice ERC-4337 EntryPoint reference
    IEntryPoint public immutable entryPoint;

    /// @notice Track deployed wallets
    mapping(address => bool) public isDeployedWallet;

    /// @notice Total wallets deployed
    uint256 public totalWalletsDeployed;

    // ==================== Events ====================

    event WalletCreated(
        address indexed wallet,
        bytes32 indexed publicKeyX,
        bytes32 indexed publicKeyY,
        bytes32 credentialId
    );

    // ==================== Errors ====================

    error WalletAlreadyDeployed();
    error DeploymentFailed();

    // ==================== Constructor ====================

    /**
     * @notice Deploy factory and create implementation contract
     * @param _entryPoint The ERC-4337 EntryPoint address
     */
    constructor(IEntryPoint _entryPoint) {
        entryPoint = _entryPoint;
        walletImplementation = new P256SmartWallet(_entryPoint);
    }

    // ==================== Wallet Creation ====================

    /**
     * @notice Compute the deterministic wallet address for a public key
     * @dev Address can be computed before wallet is deployed (counterfactual)
     * @param publicKeyX X coordinate of P-256 public key
     * @param publicKeyY Y coordinate of P-256 public key
     * @param credentialId WebAuthn credential ID
     * @return wallet The computed wallet address
     */
    function getAddress(
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 credentialId
    ) public view returns (address wallet) {
        bytes32 salt = _computeSalt(publicKeyX, publicKeyY);
        bytes memory proxyBytecode = _getProxyBytecode(publicKeyX, publicKeyY, credentialId);

        wallet = Create2.computeAddress(salt, keccak256(proxyBytecode));
    }

    /**
     * @notice Deploy a new smart wallet for a passkey
     * @param publicKeyX X coordinate of P-256 public key
     * @param publicKeyY Y coordinate of P-256 public key
     * @param credentialId WebAuthn credential ID
     * @return wallet The deployed wallet address
     */
    function createWallet(
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 credentialId
    ) external returns (address wallet) {
        bytes32 salt = _computeSalt(publicKeyX, publicKeyY);
        bytes memory proxyBytecode = _getProxyBytecode(publicKeyX, publicKeyY, credentialId);

        // Check if already deployed
        address predicted = Create2.computeAddress(salt, keccak256(proxyBytecode));
        if (predicted.code.length > 0) {
            // Already deployed, just return the address
            return predicted;
        }

        // Deploy using CREATE2
        wallet = Create2.deploy(0, salt, proxyBytecode);

        if (wallet == address(0)) revert DeploymentFailed();

        isDeployedWallet[wallet] = true;
        totalWalletsDeployed++;

        emit WalletCreated(wallet, publicKeyX, publicKeyY, credentialId);
    }

    /**
     * @notice Create wallet and fund it in one transaction
     * @dev Useful for first-time setup with some ETH for gas
     * @param publicKeyX X coordinate of P-256 public key
     * @param publicKeyY Y coordinate of P-256 public key
     * @param credentialId WebAuthn credential ID
     * @return wallet The deployed wallet address
     */
    function createWalletAndFund(
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 credentialId
    ) external payable returns (address wallet) {
        wallet = this.createWallet(publicKeyX, publicKeyY, credentialId);

        // Deposit ETH to EntryPoint for gas
        if (msg.value > 0) {
            entryPoint.depositTo{value: msg.value}(wallet);
        }
    }

    /**
     * @notice Get init code for UserOperation (for first transaction)
     * @dev Returns factory address + createWallet calldata
     * @param publicKeyX X coordinate of P-256 public key
     * @param publicKeyY Y coordinate of P-256 public key
     * @param credentialId WebAuthn credential ID
     * @return initCode The init code for UserOperation
     */
    function getInitCode(
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 credentialId
    ) external view returns (bytes memory initCode) {
        bytes memory createWalletData = abi.encodeCall(
            this.createWallet,
            (publicKeyX, publicKeyY, credentialId)
        );

        initCode = abi.encodePacked(address(this), createWalletData);
    }

    /**
     * @notice Check if a wallet exists for given public key
     * @param publicKeyX X coordinate of P-256 public key
     * @param publicKeyY Y coordinate of P-256 public key
     * @param credentialId WebAuthn credential ID
     * @return deployed True if wallet is deployed
     * @return wallet The wallet address (deployed or not)
     */
    function walletExists(
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 credentialId
    ) external view returns (bool deployed, address wallet) {
        wallet = getAddress(publicKeyX, publicKeyY, credentialId);
        deployed = wallet.code.length > 0;
    }

    // ==================== Internal ====================

    /**
     * @notice Compute CREATE2 salt from public key
     * @dev Salt is deterministic based on public key coordinates
     */
    function _computeSalt(
        bytes32 publicKeyX,
        bytes32 publicKeyY
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(publicKeyX, publicKeyY));
    }

    /**
     * @notice Get proxy deployment bytecode with initialization
     */
    function _getProxyBytecode(
        bytes32 publicKeyX,
        bytes32 publicKeyY,
        bytes32 credentialId
    ) internal view returns (bytes memory) {
        bytes memory initData = abi.encodeCall(
            P256SmartWallet.initialize,
            (publicKeyX, publicKeyY, credentialId)
        );

        return abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(address(walletImplementation), initData)
        );
    }
}
