// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ITokenMessengerV2
 * @dev Interface for Circle's CCTP V2 Token Messenger
 */
interface ITokenMessengerV2 {
    /**
     * @dev Deposits and burns tokens from sender to be minted on destination domain.
     * @param amount amount to burn
     * @param destinationDomain destination domain
     * @param mintRecipient address of mint recipient on destination domain
     * @param burnToken address of contract to burn deposited tokens, on local domain
     * @return nonce unique nonce reserved by message
     */
    function depositForBurn(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken
    ) external returns (uint64 nonce);

    /**
     * @dev Deposits and burns tokens from sender to be minted on destination domain with hook.
     * @param amount amount to burn
     * @param destinationDomain destination domain
     * @param mintRecipient address of mint recipient on destination domain
     * @param burnToken address of contract to burn deposited tokens, on local domain
     * @param hookRecipient address of hook recipient on destination domain
     * @param hookData arbitrary data to pass to hook recipient
     * @return nonce unique nonce reserved by message
     */
    function depositForBurnWithHook(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 mintRecipient,
        address burnToken,
        bytes32 hookRecipient,
        bytes calldata hookData
    ) external returns (uint64 nonce);

    /**
     * @dev Replace a BurnMessage to change the mint recipient and/or hook recipient.
     * @param originalMessage original message bytes
     * @param originalAttestation original attestation bytes
     * @param newMintRecipient new mint recipient, which may be the same as the original mint recipient
     * @param newHookRecipient new hook recipient, which may be the same as the original hook recipient, or bytes32(0)
     * @param newHookData new hook data, which may be the same as the original hook data, or empty
     */
    function replaceMessage(
        bytes calldata originalMessage,
        bytes calldata originalAttestation,
        bytes32 newMintRecipient,
        bytes32 newHookRecipient,
        bytes calldata newHookData
    ) external;

    /**
     * @dev Receive a message. Messages with a given nonce
     * can only be broadcast once for a (sourceDomain, destinationDomain)
     * pair. The message body of a valid message is passed to the
     * specified recipient for further processing.
     *
     * @param message Message bytes
     * @param attestation Concatenated 65-byte signature(s) of `message`, in increasing order
     * of the attester address recovered from signatures.
     * @return success bool, true if successful
     */
    function receiveMessage(
        bytes calldata message,
        bytes calldata attestation
    ) external returns (bool success);

    /**
     * @dev Get the local domain
     * @return domain identifier
     */
    function localDomain() external view returns (uint32);

    /**
     * @dev Get the version
     * @return version
     */
    function version() external view returns (uint32);
}