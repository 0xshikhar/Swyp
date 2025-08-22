// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./interfaces/ITokenMessengerV2.sol";
import "./interfaces/IReceiverV2.sol";
import "./interfaces/IMerchantRegistry.sol";

/**
 * @title UniversalPaymentGateway
 * @dev Main contract for processing cross-chain USDC payments with CCTP V2
 * @author Swyp Team
 */
contract UniversalPaymentGateway is Ownable, ReentrancyGuard, Pausable, IReceiverV2 {
    using SafeERC20 for IERC20;

    // Events
    event PaymentInitiated(
        bytes32 indexed paymentId,
        address indexed merchant,
        address indexed customer,
        uint256 amount,
        uint32 destinationDomain,
        bytes32 recipient
    );
    
    event PaymentCompleted(
        bytes32 indexed paymentId,
        address indexed merchant,
        uint256 amount,
        bool rebalanced
    );
    
    event RebalanceExecuted(
        address indexed merchant,
        uint256 amount,
        uint32 targetDomain,
        bytes32 targetRecipient
    );
    
    event MerchantConfigUpdated(
        address indexed merchant,
        uint32 preferredDomain,
        uint256 rebalanceThreshold
    );

    // Structs
    struct Payment {
        bytes32 id;
        address merchant;
        address customer;
        uint256 amount;
        uint32 sourceDomain;
        uint32 destinationDomain;
        uint256 timestamp;
        PaymentStatus status;
        bool rebalanced;
    }
    
    struct MerchantConfig {
        bool isActive;
        uint32 preferredDomain; // Domain where merchant wants funds
        uint256 rebalanceThreshold; // Minimum amount to trigger rebalancing
        uint256 totalReceived; // Total USDC received
        uint256 pendingBalance; // Balance pending rebalancing
        mapping(uint32 => uint256) domainBalances; // Balance per domain
    }
    
    enum PaymentStatus {
        Pending,
        Completed,
        Failed,
        Refunded
    }

    // State variables
    IERC20 public immutable USDC;
    ITokenMessengerV2 public immutable tokenMessenger;
    IMerchantRegistry public merchantRegistry;
    
    uint32 public immutable localDomain;
    uint256 public platformFeeRate = 25; // 0.25% (25/10000)
    uint256 public constant MAX_FEE_RATE = 500; // 5% maximum
    
    mapping(bytes32 => Payment) public payments;
    mapping(address => MerchantConfig) public merchantConfigs;
    mapping(bytes32 => bool) public processedMessages;
    
    // Platform fee collection
    uint256 public collectedFees;
    address public feeRecipient;

    constructor(
        address _usdc,
        address _tokenMessenger,
        address _merchantRegistry,
        uint32 _localDomain,
        address _feeRecipient
    ) Ownable(msg.sender) {
        USDC = IERC20(_usdc);
        tokenMessenger = ITokenMessengerV2(_tokenMessenger);
        merchantRegistry = IMerchantRegistry(_merchantRegistry);
        localDomain = _localDomain;
        feeRecipient = _feeRecipient;
    }

    /**
     * @dev Initialize payment - called by customer on source chain
     * @param merchant Merchant address
     * @param amount Payment amount in USDC
     * @param destinationDomain Target domain for payment
     * @param recipient Merchant address on destination chain
     */
    function initiatePayment(
        address merchant,
        uint256 amount,
        uint32 destinationDomain,
        bytes32 recipient
    ) external nonReentrant whenNotPaused {
        require(merchantRegistry.isMerchantActive(merchant), "Merchant not active");
        require(amount > 0, "Amount must be greater than 0");
        
        bytes32 paymentId = keccak256(
            abi.encodePacked(
                msg.sender,
                merchant,
                amount,
                block.timestamp,
                block.number
            )
        );
        
        // Transfer USDC from customer
        USDC.safeTransferFrom(msg.sender, address(this), amount);
        
        // Calculate platform fee
        uint256 fee = (amount * platformFeeRate) / 10000;
        uint256 merchantAmount = amount - fee;
        collectedFees += fee;
        
        // Store payment info
        payments[paymentId] = Payment({
            id: paymentId,
            merchant: merchant,
            customer: msg.sender,
            amount: merchantAmount,
            sourceDomain: localDomain,
            destinationDomain: destinationDomain,
            timestamp: block.timestamp,
            status: PaymentStatus.Pending,
            rebalanced: false
        });
        
        if (destinationDomain == localDomain) {
            // Same chain payment
            _processLocalPayment(paymentId, merchant, merchantAmount);
        } else {
            // Cross-chain payment via CCTP
            _processCrossChainPayment(paymentId, merchantAmount, destinationDomain, recipient);
        }
        
        emit PaymentInitiated(paymentId, merchant, msg.sender, merchantAmount, destinationDomain, recipient);
    }
    
    /**
     * @dev Handle received CCTP message on destination chain
     */
    function handleReceiveMessage(
        uint32 sourceDomain,
        bytes32 sender,
        bytes calldata messageBody
    ) external override {
        require(msg.sender == address(tokenMessenger), "Only token messenger");
        
        bytes32 messageHash = keccak256(abi.encodePacked(sourceDomain, sender, messageBody));
        require(!processedMessages[messageHash], "Message already processed");
        processedMessages[messageHash] = true;
        
        // Decode payment data
        (bytes32 paymentId, address merchant, uint256 amount) = abi.decode(
            messageBody,
            (bytes32, address, uint256)
        );
        
        _processReceivedPayment(paymentId, merchant, amount);
    }
    
    /**
     * @dev Configure merchant settings
     */
    function configureMerchant(
        uint32 preferredDomain,
        uint256 rebalanceThreshold
    ) external {
        require(merchantRegistry.isMerchantActive(msg.sender), "Merchant not active");
        
        MerchantConfig storage config = merchantConfigs[msg.sender];
        config.isActive = true;
        config.preferredDomain = preferredDomain;
        config.rebalanceThreshold = rebalanceThreshold;
        
        emit MerchantConfigUpdated(msg.sender, preferredDomain, rebalanceThreshold);
    }
    
    /**
     * @dev Trigger rebalancing for merchant
     */
    function triggerRebalance(address merchant) external {
        MerchantConfig storage config = merchantConfigs[merchant];
        require(config.isActive, "Merchant not configured");
        require(config.pendingBalance >= config.rebalanceThreshold, "Below rebalance threshold");
        
        uint256 amount = config.pendingBalance;
        config.pendingBalance = 0;
        
        if (config.preferredDomain == localDomain) {
            // Transfer locally
            USDC.safeTransfer(merchant, amount);
        } else {
            // Cross-chain rebalance
            bytes32 recipient = bytes32(uint256(uint160(merchant)));
            _executeCCTPTransfer(amount, config.preferredDomain, recipient);
        }
        
        emit RebalanceExecuted(merchant, amount, config.preferredDomain, bytes32(uint256(uint160(merchant))));
    }
    
    // Internal functions
    function _processLocalPayment(bytes32 paymentId, address merchant, uint256 amount) internal {
        MerchantConfig storage config = merchantConfigs[merchant];
        
        if (config.isActive && config.rebalanceThreshold > 0) {
            config.pendingBalance += amount;
            config.domainBalances[localDomain] += amount;
        } else {
            USDC.safeTransfer(merchant, amount);
        }
        
        config.totalReceived += amount;
        payments[paymentId].status = PaymentStatus.Completed;
        
        emit PaymentCompleted(paymentId, merchant, amount, false);
    }
    
    function _processCrossChainPayment(
        bytes32 paymentId,
        uint256 amount,
        uint32 destinationDomain,
        bytes32 recipient
    ) internal {
        bytes memory messageBody = abi.encode(paymentId, payments[paymentId].merchant, amount);
        _executeCCTPTransfer(amount, destinationDomain, recipient, messageBody);
    }
    
    function _processReceivedPayment(bytes32 paymentId, address merchant, uint256 amount) internal {
        MerchantConfig storage config = merchantConfigs[merchant];
        
        if (config.isActive && config.rebalanceThreshold > 0) {
            config.pendingBalance += amount;
            config.domainBalances[localDomain] += amount;
        } else {
            USDC.safeTransfer(merchant, amount);
        }
        
        config.totalReceived += amount;
        
        emit PaymentCompleted(paymentId, merchant, amount, false);
    }
    
    function _executeCCTPTransfer(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 recipient,
        bytes memory messageBody
    ) internal {
        USDC.safeApprove(address(tokenMessenger), amount);
        
        if (messageBody.length > 0) {
            tokenMessenger.depositForBurnWithHook(
                amount,
                destinationDomain,
                recipient,
                address(USDC),
                recipient, // hook recipient
                messageBody
            );
        } else {
            tokenMessenger.depositForBurn(
                amount,
                destinationDomain,
                recipient,
                address(USDC)
            );
        }
    }
    
    function _executeCCTPTransfer(
        uint256 amount,
        uint32 destinationDomain,
        bytes32 recipient
    ) internal {
        _executeCCTPTransfer(amount, destinationDomain, recipient, "");
    }
    
    // Admin functions
    function setPlatformFeeRate(uint256 _feeRate) external onlyOwner {
        require(_feeRate <= MAX_FEE_RATE, "Fee rate too high");
        platformFeeRate = _feeRate;
    }
    
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }
    
    function withdrawFees() external onlyOwner {
        uint256 amount = collectedFees;
        collectedFees = 0;
        USDC.safeTransfer(feeRecipient, amount);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // View functions
    function getMerchantBalance(address merchant, uint32 domain) external view returns (uint256) {
        return merchantConfigs[merchant].domainBalances[domain];
    }
    
    function getPayment(bytes32 paymentId) external view returns (Payment memory) {
        return payments[paymentId];
    }
}