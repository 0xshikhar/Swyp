// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IMerchantRegistry.sol";

/**
 * @title MerchantRegistry
 * @dev Registry contract for managing merchant onboarding and verification
 * @author Swyp Team
 */
contract MerchantRegistry is IMerchantRegistry, Ownable, Pausable {
    
    // Events
    event MerchantRegistered(
        address indexed merchant,
        string businessName,
        string category,
        uint256 timestamp
    );
    
    event MerchantVerified(
        address indexed merchant,
        address indexed verifier,
        uint256 timestamp
    );
    
    event MerchantSuspended(
        address indexed merchant,
        string reason,
        uint256 timestamp
    );
    
    event MerchantReactivated(
        address indexed merchant,
        uint256 timestamp
    );
    
    event VerifierAdded(address indexed verifier);
    event VerifierRemoved(address indexed verifier);

    // Structs
    struct MerchantProfile {
        string businessName;
        string category;
        string website;
        string email;
        string description;
        address[] paymentAddresses; // Multi-chain addresses
        uint256 registrationDate;
        uint256 verificationDate;
        MerchantStatus status;
        uint256 totalTransactions;
        uint256 totalVolume;
        uint8 riskScore; // 0-100, lower is better
    }
    
    enum MerchantStatus {
        Pending,     // Registered but not verified
        Active,      // Verified and active
        Suspended,   // Temporarily suspended
        Banned       // Permanently banned
    }

    // State variables
    mapping(address => MerchantProfile) public merchants;
    mapping(address => bool) public verifiers;
    mapping(string => address) public businessNameToAddress;
    
    address[] public merchantList;
    uint256 public totalMerchants;
    uint256 public activeMerchants;
    
    // Registration fee (can be 0)
    uint256 public registrationFee = 0;
    
    // Risk management
    uint8 public constant MAX_RISK_SCORE = 100;
    uint8 public riskThreshold = 70; // Merchants above this score are auto-suspended

    constructor() Ownable(msg.sender) {
        // Owner is the first verifier
        verifiers[msg.sender] = true;
        emit VerifierAdded(msg.sender);
    }

    /**
     * @dev Register a new merchant
     */
    function registerMerchant(
        string calldata businessName,
        string calldata category,
        string calldata website,
        string calldata email,
        string calldata description,
        address[] calldata paymentAddresses
    ) external payable whenNotPaused {
        require(msg.value >= registrationFee, "Insufficient registration fee");
        require(merchants[msg.sender].registrationDate == 0, "Merchant already registered");
        require(businessNameToAddress[businessName] == address(0), "Business name already taken");
        require(bytes(businessName).length > 0, "Business name required");
        require(paymentAddresses.length > 0, "At least one payment address required");
        
        merchants[msg.sender] = MerchantProfile({
            businessName: businessName,
            category: category,
            website: website,
            email: email,
            description: description,
            paymentAddresses: paymentAddresses,
            registrationDate: block.timestamp,
            verificationDate: 0,
            status: MerchantStatus.Pending,
            totalTransactions: 0,
            totalVolume: 0,
            riskScore: 0
        });
        
        businessNameToAddress[businessName] = msg.sender;
        merchantList.push(msg.sender);
        totalMerchants++;
        
        emit MerchantRegistered(msg.sender, businessName, category, block.timestamp);
    }
    
    /**
     * @dev Verify a merchant (only verifiers)
     */
    function verifyMerchant(address merchant) external onlyVerifier {
        MerchantProfile storage profile = merchants[merchant];
        require(profile.registrationDate > 0, "Merchant not registered");
        require(profile.status == MerchantStatus.Pending, "Merchant not pending verification");
        
        profile.status = MerchantStatus.Active;
        profile.verificationDate = block.timestamp;
        activeMerchants++;
        
        emit MerchantVerified(merchant, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Suspend a merchant
     */
    function suspendMerchant(address merchant, string calldata reason) external onlyVerifier {
        MerchantProfile storage profile = merchants[merchant];
        require(profile.registrationDate > 0, "Merchant not registered");
        require(profile.status == MerchantStatus.Active, "Merchant not active");
        
        profile.status = MerchantStatus.Suspended;
        activeMerchants--;
        
        emit MerchantSuspended(merchant, reason, block.timestamp);
    }
    
    /**
     * @dev Reactivate a suspended merchant
     */
    function reactivateMerchant(address merchant) external onlyVerifier {
        MerchantProfile storage profile = merchants[merchant];
        require(profile.registrationDate > 0, "Merchant not registered");
        require(profile.status == MerchantStatus.Suspended, "Merchant not suspended");
        
        profile.status = MerchantStatus.Active;
        activeMerchants++;
        
        emit MerchantReactivated(merchant, block.timestamp);
    }
    
    /**
     * @dev Ban a merchant permanently
     */
    function banMerchant(address merchant, string calldata reason) external onlyOwner {
        MerchantProfile storage profile = merchants[merchant];
        require(profile.registrationDate > 0, "Merchant not registered");
        
        if (profile.status == MerchantStatus.Active) {
            activeMerchants--;
        }
        
        profile.status = MerchantStatus.Banned;
        
        emit MerchantSuspended(merchant, reason, block.timestamp);
    }
    
    /**
     * @dev Update merchant profile
     */
    function updateMerchantProfile(
        string calldata website,
        string calldata email,
        string calldata description,
        address[] calldata paymentAddresses
    ) external {
        MerchantProfile storage profile = merchants[msg.sender];
        require(profile.registrationDate > 0, "Merchant not registered");
        require(paymentAddresses.length > 0, "At least one payment address required");
        
        profile.website = website;
        profile.email = email;
        profile.description = description;
        profile.paymentAddresses = paymentAddresses;
    }
    
    /**
     * @dev Update merchant transaction stats (called by payment gateway)
     */
    function updateMerchantStats(
        address merchant,
        uint256 transactionAmount
    ) external override {
        // Only allow calls from registered payment gateways
        // This would be implemented with a registry of authorized contracts
        MerchantProfile storage profile = merchants[merchant];
        require(profile.registrationDate > 0, "Merchant not registered");
        
        profile.totalTransactions++;
        profile.totalVolume += transactionAmount;
        
        // Auto-suspend if risk score is too high
        if (profile.riskScore > riskThreshold && profile.status == MerchantStatus.Active) {
            profile.status = MerchantStatus.Suspended;
            activeMerchants--;
            emit MerchantSuspended(merchant, "High risk score", block.timestamp);
        }
    }
    
    /**
     * @dev Update merchant risk score
     */
    function updateRiskScore(address merchant, uint8 newScore) external onlyVerifier {
        require(newScore <= MAX_RISK_SCORE, "Invalid risk score");
        MerchantProfile storage profile = merchants[merchant];
        require(profile.registrationDate > 0, "Merchant not registered");
        
        profile.riskScore = newScore;
        
        // Auto-suspend if risk score is too high
        if (newScore > riskThreshold && profile.status == MerchantStatus.Active) {
            profile.status = MerchantStatus.Suspended;
            activeMerchants--;
            emit MerchantSuspended(merchant, "High risk score", block.timestamp);
        }
    }
    
    // Verifier management
    function addVerifier(address verifier) external onlyOwner {
        require(!verifiers[verifier], "Already a verifier");
        verifiers[verifier] = true;
        emit VerifierAdded(verifier);
    }
    
    function removeVerifier(address verifier) external onlyOwner {
        require(verifiers[verifier], "Not a verifier");
        require(verifier != owner(), "Cannot remove owner");
        verifiers[verifier] = false;
        emit VerifierRemoved(verifier);
    }
    
    // Admin functions
    function setRegistrationFee(uint256 _fee) external onlyOwner {
        registrationFee = _fee;
    }
    
    function setRiskThreshold(uint8 _threshold) external onlyOwner {
        require(_threshold <= MAX_RISK_SCORE, "Invalid threshold");
        riskThreshold = _threshold;
    }
    
    function withdrawFees() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // View functions
    function isMerchantActive(address merchant) external view override returns (bool) {
        return merchants[merchant].status == MerchantStatus.Active;
    }
    
    function getMerchantProfile(address merchant) external view returns (MerchantProfile memory) {
        return merchants[merchant];
    }
    
    function getMerchantPaymentAddresses(address merchant) external view returns (address[] memory) {
        return merchants[merchant].paymentAddresses;
    }
    
    function getMerchantsByCategory(string calldata category) external view returns (address[] memory) {
        address[] memory result = new address[](totalMerchants);
        uint256 count = 0;
        
        for (uint256 i = 0; i < merchantList.length; i++) {
            address merchant = merchantList[i];
            if (keccak256(bytes(merchants[merchant].category)) == keccak256(bytes(category)) &&
                merchants[merchant].status == MerchantStatus.Active) {
                result[count] = merchant;
                count++;
            }
        }
        
        // Resize array
        address[] memory finalResult = new address[](count);
        for (uint256 i = 0; i < count; i++) {
            finalResult[i] = result[i];
        }
        
        return finalResult;
    }
    
    function getActiveMerchants() external view returns (address[] memory) {
        address[] memory result = new address[](activeMerchants);
        uint256 count = 0;
        
        for (uint256 i = 0; i < merchantList.length; i++) {
            address merchant = merchantList[i];
            if (merchants[merchant].status == MerchantStatus.Active) {
                result[count] = merchant;
                count++;
            }
        }
        
        return result;
    }
    
    // Modifiers
    modifier onlyVerifier() {
        require(verifiers[msg.sender], "Not a verifier");
        _;
    }
}