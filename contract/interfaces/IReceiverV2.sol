// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IReceiverV2
 * @dev Interface for receiving messages on destination chain via CCTP V2
 */
interface IReceiverV2 {
    /**
     * @dev Handle received message from source chain
     * @param sourceDomain The source domain identifier
     * @param sender The sender address on source chain (as bytes32)
     * @param messageBody The message body containing payment data
     */
    function handleReceiveMessage(
        uint32 sourceDomain,
        bytes32 sender,
        bytes calldata messageBody
    ) external;
}