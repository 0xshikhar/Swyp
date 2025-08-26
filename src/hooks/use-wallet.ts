'use client';

import { useAccount, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { useWallets } from '@privy-io/react-auth';
import { formatUnits } from 'viem';
import { mainnet, polygon, base } from 'viem/chains';

// USDC contract addresses
const USDC_ADDRESSES = {
  [mainnet.id]: '0xA0b86a33E6441c8C673f4c8b0c8b0c8b0c8b0c8b' as const,
  [polygon.id]: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' as const,
  [base.id]: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' as const,
};

export function useWallet() {
  const { address, isConnected, isConnecting, isDisconnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const { wallets } = useWallets();

  // Get USDC balance
  const { data: usdcBalance, isLoading: isLoadingBalance } = useBalance({
    address,
    token: USDC_ADDRESSES[chainId as keyof typeof USDC_ADDRESSES],
  });

  // Get native token balance
  const { data: nativeBalance, isLoading: isLoadingNativeBalance } = useBalance({
    address,
  });

  const formattedUsdcBalance = usdcBalance 
    ? formatUnits(usdcBalance.value, usdcBalance.decimals)
    : '0';

  const formattedNativeBalance = nativeBalance
    ? formatUnits(nativeBalance.value, nativeBalance.decimals)
    : '0';

  const switchToChain = async (targetChainId: number) => {
    try {
      await switchChain({ chainId: targetChainId });
    } catch (error) {
      console.error('Failed to switch chain:', error);
      throw error;
    }
  };

  const getSupportedChains = () => {
    return [
      { id: mainnet.id, name: 'Ethereum', symbol: 'ETH' },
      { id: polygon.id, name: 'Polygon', symbol: 'MATIC' },
      { id: base.id, name: 'Base', symbol: 'ETH' },
    ];
  };

  const getCurrentChain = () => {
    const chains = getSupportedChains();
    return chains.find(chain => chain.id === chainId);
  };

  const getUsdcAddress = (targetChainId?: number) => {
    const targetId = targetChainId || chainId;
    return USDC_ADDRESSES[targetId as keyof typeof USDC_ADDRESSES];
  };

  return {
    // Connection state
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    chainId,
    currentChain: getCurrentChain(),
    
    // Balances
    usdcBalance: formattedUsdcBalance,
    nativeBalance: formattedNativeBalance,
    isLoadingBalance: isLoadingBalance || isLoadingNativeBalance,
    
    // Chain operations
    switchToChain,
    isSwitchingChain,
    supportedChains: getSupportedChains(),
    
    // Utilities
    getUsdcAddress,
    wallets,
  };
}