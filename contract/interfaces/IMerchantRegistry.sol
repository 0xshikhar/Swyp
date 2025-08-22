// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMerchantRegistry
 * @dev Interface for merchant registry contract
 */
interface IMerchantRegistry {
    /**
     * @dev Check if a merchant is active
     * @param merchant The merchant address to check
     * @return bool True if merchant is active
     */
    function isMerchantActive(address merchant) external view returns (bool);
    
    /**
     * @dev Update merchant transaction statistics
     * @param merchant The merchant address
     * @param transactionAmount The transaction amount
     */
    function updateMerchantStats(address merchant, uint256 transactionAmount) external;
}