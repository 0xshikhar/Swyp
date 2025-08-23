'use client';

import * as React from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from 'wagmi';
import {
    QueryClientProvider,
    QueryClient,
} from "@tanstack/react-query";
import 'dotenv/config';

import {
    mainnet,
    sepolia,
    polygon,
    polygonMumbai,
    base,
    baseSepolia
} from 'wagmi/chains';
import { createConfig } from 'wagmi';
import { http } from 'viem';

// Configure wagmi client with payment gateway chains
const config = createConfig({
    chains: [mainnet, polygon, base, sepolia, polygonMumbai, baseSepolia],
    transports: {
        [mainnet.id]: http(),
        [polygon.id]: http(),
        [base.id]: http(),
        [sepolia.id]: http(),
        [polygonMumbai.id]: http(),
        [baseSepolia.id]: http(),
    },
});

const queryClient = new QueryClient();

// Your Privy App ID - replace with your actual app ID
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || 'your-privy-app-id';

export function Providers({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => setMounted(true), []);
    
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <PrivyProvider
                    appId={PRIVY_APP_ID}
                    config={{
                        loginMethods: ['wallet'],
                        appearance: {
                            theme: 'light',
                            accentColor: '#3B82F6',
                            logo: '/favicon.ico',
                        },
                        embeddedWallets: {
                            createOnLogin: 'users-without-wallets',
                            requireUserPasswordOnCreate: false,
                        },
                        supportedChains: [mainnet, polygon, base, sepolia, polygonMumbai, baseSepolia],
                    }}
                >
                    {mounted ? (
                        children
                    ) : (
                        <div style={{ visibility: "hidden" }}>
                            {children}
                        </div>
                    )}
                </PrivyProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}
