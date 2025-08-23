'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useAccount, useDisconnect } from 'wagmi';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface User {
    id: string;
    walletAddress: string;
    username?: string;
    avatar?: string;
    bio?: string;
    createdAt: string;
    lastLoginAt: string;
}

export function useAuth() {
    const {
        login: privyLogin,
        logout: privyLogout,
        authenticated,
        user: privyUser,
        ready,
        linkWallet,
        unlinkWallet
    } = usePrivy();

    const { wallets } = useWallets();
    const { address, isConnected } = useAccount();
    const { disconnect } = useDisconnect();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isAutoSigningIn, setIsAutoSigningIn] = useState(false);
    const [userData, setUserData] = useState<User | null>(null);

    // Map Privy's authenticated state to our isAuthenticated
    const isAuthenticated = authenticated;

    // Get primary wallet address
    const primaryWallet = wallets.find(wallet => wallet.address === address) || wallets[0];
    const walletAddress = primaryWallet?.address || address || privyUser?.wallet?.address;

    const login = useCallback(async () => {
        setIsLoading(true);
        try {
            await privyLogin();
            toast.success('Successfully connected wallet!');
            return true;
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Failed to connect wallet');
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [privyLogin]);

    const logout = useCallback(async () => {
        setIsLoading(true);
        try {
            await privyLogout();
            disconnect();
            setUserData(null);
            router.push('/');
            toast.success('Successfully disconnected');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Failed to disconnect');
        } finally {
            setIsLoading(false);
        }
    }, [privyLogout, disconnect, router]);

    // Fetch user data from API
    const fetchUserData = useCallback(async () => {
        if (!walletAddress || !authenticated) return;

        try {
            const response = await fetch('/api/users/profile', {
                headers: {
                    'Authorization': `Bearer ${await getAccessToken()}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUserData(data);
            }
        } catch (error) {
            console.error('Failed to fetch user data:', error);
        }
    }, [walletAddress, authenticated]);

    // Get access token for API calls
    const getAccessToken = useCallback(async (): Promise<string | null> => {
        if (!authenticated || !privyUser) return null;

        try {
            // In a real implementation, you would get a JWT token from your backend
            // For now, we'll use the Privy user ID as a placeholder
            return privyUser.id;
        } catch (error) {
            console.error('Failed to get access token:', error);
            return null;
        }
    }, [authenticated, privyUser]);

    // Update user profile
    const updateProfile = useCallback(async (updates: Partial<Pick<User, 'username' | 'avatar' | 'bio'>>) => {
        if (!authenticated || !walletAddress) {
            throw new Error('User not authenticated');
        }

        try {
            setIsLoading(true);
            const response = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await getAccessToken()}`,
                },
                body: JSON.stringify(updates),
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const updatedUser = await response.json();
            setUserData(updatedUser);
            toast.success('Profile updated successfully!');
            return updatedUser;
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error('Failed to update profile');
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [authenticated, walletAddress, getAccessToken]);

    // Check if user is a merchant
    const checkMerchantStatus = useCallback(async () => {
        if (!authenticated || !walletAddress) return null;

        try {
            const response = await fetch('/api/merchants/status', {
                headers: {
                    'Authorization': `Bearer ${await getAccessToken()}`,
                },
            });

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Failed to check merchant status:', error);
            return null;
        }
    }, [authenticated, walletAddress, getAccessToken]);

    // Auto-login check and fetch user data
    useEffect(() => {
        if (ready && !authenticated && !isLoading) {
            const checkExistingSession = async () => {
                setIsAutoSigningIn(true);
                try {
                    // Privy handles this automatically, but we can add custom logic here if needed
                } catch (error) {
                    console.error('Auto sign-in error:', error);
                } finally {
                    setIsAutoSigningIn(false);
                }
            };

            checkExistingSession();
        }
    }, [ready, authenticated, isLoading]);

    // Effect to fetch user data when authenticated
    useEffect(() => {
        if (ready && authenticated && walletAddress) {
            fetchUserData();
        }
    }, [ready, authenticated, walletAddress, fetchUserData]);

    return {
        // Auth state
        ready,
        authenticated: isAuthenticated,
        isLoading: isLoading || !ready,
        user: userData,
        walletAddress,
        wallets,
        isConnected,
        isAutoSigningIn,

        // Auth actions
        login,
        logout,
        linkWallet,
        unlinkWallet,

        // User actions
        updateProfile,
        getAccessToken,
        checkMerchantStatus,
        refetchUser: fetchUserData,
    };
}

// Hook for protected routes
export function useRequireAuth() {
    const { authenticated, ready } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (ready && !authenticated) {
            router.push('/');
        }
    }, [authenticated, ready, router]);

    return { authenticated, ready };
}

// Hook for merchant-only routes
export function useRequireMerchant() {
    const { authenticated, ready, checkMerchantStatus } = useAuth();
    const router = useRouter();
    const [isMerchant, setIsMerchant] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkStatus = async () => {
            if (ready && authenticated) {
                try {
                    const merchantData = await checkMerchantStatus();
                    const merchantExists = merchantData && merchantData.status === 'ACTIVE';
                    setIsMerchant(merchantExists);

                    if (!merchantExists) {
                        router.push('/onboarding');
                    }
                } catch (error) {
                    console.error('Error checking merchant status:', error);
                    setIsMerchant(false);
                    router.push('/onboarding');
                } finally {
                    setIsLoading(false);
                }
            } else if (ready && !authenticated) {
                router.push('/');
                setIsLoading(false);
            }
        };

        checkStatus();
    }, [authenticated, ready, router, checkMerchantStatus]);

    return { isMerchant, isLoading, authenticated, ready };
}
