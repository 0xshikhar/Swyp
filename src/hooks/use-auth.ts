'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth() {
  const { 
    ready, 
    authenticated, 
    user, 
    login, 
    logout, 
    linkWallet, 
    unlinkWallet 
  } = usePrivy();
  const { wallets } = useWallets();
  const router = useRouter();

  const primaryWallet = wallets[0];
  const walletAddress = primaryWallet?.address;

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const connectWallet = async () => {
    try {
      await linkWallet();
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  };

  const disconnectWallet = async (walletAddress: string) => {
    try {
      await unlinkWallet(walletAddress);
    } catch (error) {
      console.error('Wallet disconnection failed:', error);
    }
  };

  return {
    // State
    ready,
    authenticated,
    user,
    wallets,
    primaryWallet,
    walletAddress,
    
    // Actions
    login: handleLogin,
    logout: handleLogout,
    connectWallet,
    disconnectWallet,
  };
}

// Hook for protected routes
export function useRequireAuth() {
  const { ready, authenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/login');
    }
  }, [ready, authenticated, router]);

  return { ready, authenticated };
}