// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @notice Mock USDC token for testing on Avalanche Fuji testnet
 * @dev 6 decimals to match real USDC, includes EIP-2612 Permit for gasless approvals
 */
contract MockUSDC is ERC20, ERC20Permit, Ownable {
    constructor()
        ERC20("Mock USDC", "USDC")
        ERC20Permit("Mock USDC")
        Ownable(msg.sender)
    {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    /**
     * @notice Mint tokens for testing
     * @param to Recipient address
     * @param amount Amount to mint (in 6 decimals)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Faucet function - anyone can mint up to 10,000 USDC for testing
     */
    function faucet() external {
        uint256 amount = 10_000 * 10**6; // 10,000 USDC
        _mint(msg.sender, amount);
    }

    /**
     * @notice Faucet for specific amount
     * @param amount Amount to mint (max 100,000 USDC)
     */
    function faucetAmount(uint256 amount) external {
        require(amount <= 100_000 * 10**6, "Max 100,000 USDC per faucet call");
        _mint(msg.sender, amount);
    }

    /**
     * @notice Faucet to a specific address (for relayer use)
     * @param to Recipient address
     * @param amount Amount to mint (max 100,000 USDC)
     */
    function faucetTo(address to, uint256 amount) external {
        require(amount <= 100_000 * 10**6, "Max 100,000 USDC per faucet call");
        _mint(to, amount);
    }
}
