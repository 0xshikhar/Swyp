import { ethers } from 'ethers';
import { z } from 'zod';

// CCTP V2 Contract Addresses (Mainnet)
const CCTP_CONTRACTS = {
  ethereum: {
    tokenMessenger: '0xBd3fa81B58Ba92a82136038B25aDec7066af3155',
    messageTransmitter: '0x0a992d191DEeC32aFe36203Ad87D7d289a738F81',
    usdc: '0xA0b86a33E6441E8C8C7014b5C1D2664B2C2B6C83',
  },
  polygon: {
    tokenMessenger: '0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE',
    messageTransmitter: '0xF3be9355363857F3e001be68856A2f96b4C39Ba9',
    usdc: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  },
  base: {
    tokenMessenger: '0x1682Ae6375C4E4A97e4B583BC394c861A46D8962',
    messageTransmitter: '0xAD09780d193884d503182aD4588450C416D6F9D4',
    usdc: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
};

// Domain IDs for CCTP
const DOMAIN_IDS = {
  ethereum: 0,
  polygon: 7,
  base: 6,
};

type SupportedChain = keyof typeof CCTP_CONTRACTS;

export interface CCTPTransferParams {
  fromChain: SupportedChain;
  toChain: SupportedChain;
  amount: string; // in USDC (6 decimals)
  recipient: string;
  signer: ethers.Signer;
}

export interface CCTPTransferResult {
  transactionHash: string;
  messageHash: string;
  attestationHash?: string;
  status: 'pending' | 'attested' | 'completed' | 'failed';
}

const transferParamsSchema = z.object({
  fromChain: z.enum(['ethereum', 'polygon', 'base']),
  toChain: z.enum(['ethereum', 'polygon', 'base']),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/, 'Invalid amount format'),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid recipient address'),
});

// Token Messenger ABI (simplified)
const TOKEN_MESSENGER_ABI = [
  'function depositForBurn(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient, address burnToken) external returns (uint64)',
  'function replaceDepositForBurn(bytes calldata originalMessage, bytes calldata originalAttestation, bytes32 newDestinationCaller, bytes32 newMintRecipient) external',
];

// Message Transmitter ABI (simplified)
const MESSAGE_TRANSMITTER_ABI = [
  'function receiveMessage(bytes calldata message, bytes calldata attestation) external returns (bool)',
  'function usedNonces(bytes32) external view returns (uint256)',
  'event MessageSent(bytes message)',
];

// USDC Token ABI (simplified)
const USDC_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
];

export class CCTPService {
  private providers: Map<SupportedChain, ethers.Provider> = new Map();

  constructor(providerUrls: Record<SupportedChain, string>) {
    Object.entries(providerUrls).forEach(([chain, url]) => {
      this.providers.set(chain as SupportedChain, new ethers.JsonRpcProvider(url));
    });
  }

  /**
   * Initiate a cross-chain USDC transfer using CCTP V2
   */
  async initiateTransfer(params: CCTPTransferParams): Promise<CCTPTransferResult> {
    // Validate parameters
    const validatedParams = transferParamsSchema.parse(params);
    
    if (validatedParams.fromChain === validatedParams.toChain) {
      throw new Error('Source and destination chains must be different');
    }

    const { fromChain, toChain, amount, recipient, signer } = params;
    const contracts = CCTP_CONTRACTS[fromChain];
    const destinationDomain = DOMAIN_IDS[toChain];

    // Convert amount to wei (USDC has 6 decimals)
    const amountWei = ethers.parseUnits(amount, 6);

    // Get contracts
    const usdcContract = new ethers.Contract(contracts.usdc, USDC_ABI, signer);
    const tokenMessengerContract = new ethers.Contract(
      contracts.tokenMessenger,
      TOKEN_MESSENGER_ABI,
      signer
    );

    // Check balance
    const signerAddress = await signer.getAddress();
    const balance = await usdcContract.balanceOf(signerAddress);
    
    if (balance < amountWei) {
      throw new Error(`Insufficient USDC balance. Required: ${amount}, Available: ${ethers.formatUnits(balance, 6)}`);
    }

    // Check and approve allowance
    const allowance = await usdcContract.allowance(signerAddress, contracts.tokenMessenger);
    if (allowance < amountWei) {
      const approveTx = await usdcContract.approve(contracts.tokenMessenger, amountWei);
      await approveTx.wait();
    }

    // Convert recipient to bytes32
    const recipientBytes32 = ethers.zeroPadValue(recipient, 32);

    // Execute deposit for burn
    const depositTx = await tokenMessengerContract.depositForBurn(
      amountWei,
      destinationDomain,
      recipientBytes32,
      contracts.usdc
    );

    const receipt = await depositTx.wait();
    
    // Extract message hash from logs
    const messageHash = this.extractMessageHash(receipt);

    return {
      transactionHash: receipt.hash,
      messageHash,
      status: 'pending',
    };
  }

  /**
   * Get attestation for a message hash
   */
  async getAttestation(messageHash: string): Promise<string | null> {
    try {
      const response = await fetch(
        `https://iris-api.circle.com/attestations/${messageHash}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Attestation not ready yet
        }
        throw new Error(`Attestation API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.attestation;
    } catch (error) {
      console.error('Failed to fetch attestation:', error);
      return null;
    }
  }

  /**
   * Complete the cross-chain transfer by submitting the message and attestation
   */
  async completeTransfer(
    toChain: SupportedChain,
    message: string,
    attestation: string,
    signer: ethers.Signer
  ): Promise<string> {
    const contracts = CCTP_CONTRACTS[toChain];
    const messageTransmitterContract = new ethers.Contract(
      contracts.messageTransmitter,
      MESSAGE_TRANSMITTER_ABI,
      signer
    );

    const completeTx = await messageTransmitterContract.receiveMessage(
      message,
      attestation
    );

    const receipt = await completeTx.wait();
    return receipt.hash;
  }

  /**
   * Check transfer status
   */
  async getTransferStatus(
    messageHash: string,
    toChain: SupportedChain
  ): Promise<CCTPTransferResult['status']> {
    try {
      // Check if attestation is available
      const attestation = await this.getAttestation(messageHash);
      
      if (!attestation) {
        return 'pending';
      }

      // Check if message has been processed on destination chain
      const provider = this.providers.get(toChain);
      if (!provider) {
        throw new Error(`No provider configured for chain: ${toChain}`);
      }

      const contracts = CCTP_CONTRACTS[toChain];
      const messageTransmitterContract = new ethers.Contract(
        contracts.messageTransmitter,
        MESSAGE_TRANSMITTER_ABI,
        provider
      );

      // Check if nonce has been used (indicates message was processed)
      const nonceHash = ethers.keccak256(messageHash);
      const usedNonce = await messageTransmitterContract.usedNonces(nonceHash);
      
      if (usedNonce > 0) {
        return 'completed';
      }

      return 'attested';
    } catch (error) {
      console.error('Failed to check transfer status:', error);
      return 'failed';
    }
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): SupportedChain[] {
    return Object.keys(CCTP_CONTRACTS) as SupportedChain[];
  }

  /**
   * Get USDC balance for an address on a specific chain
   */
  async getUSDCBalance(chain: SupportedChain, address: string): Promise<string> {
    const provider = this.providers.get(chain);
    if (!provider) {
      throw new Error(`No provider configured for chain: ${chain}`);
    }

    const contracts = CCTP_CONTRACTS[chain];
    const usdcContract = new ethers.Contract(contracts.usdc, USDC_ABI, provider);
    
    const balance = await usdcContract.balanceOf(address);
    return ethers.formatUnits(balance, 6);
  }

  /**
   * Extract message hash from transaction receipt
   */
  private extractMessageHash(receipt: ethers.TransactionReceipt): string {
    // Look for MessageSent event in logs
    const messageTransmitterInterface = new ethers.Interface(MESSAGE_TRANSMITTER_ABI);
    
    for (const log of receipt.logs) {
      try {
        const parsed = messageTransmitterInterface.parseLog(log);
        if (parsed?.name === 'MessageSent') {
          return ethers.keccak256(parsed.args.message);
        }
      } catch {
        // Continue if log doesn't match interface
      }
    }
    
    throw new Error('MessageSent event not found in transaction receipt');
  }
}

// Export singleton instance
export const cctpService = new CCTPService({
  ethereum: process.env.ETHEREUM_RPC_URL || 'https://eth-mainnet.g.alchemy.com/v2/demo',
  polygon: process.env.POLYGON_RPC_URL || 'https://polygon-mainnet.g.alchemy.com/v2/demo',
  base: process.env.BASE_RPC_URL || 'https://base-mainnet.g.alchemy.com/v2/demo',
});