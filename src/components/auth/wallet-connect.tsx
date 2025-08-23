"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuth } from "@/hooks/useAuth";
import { Wallet, Shield, Zap } from "lucide-react";

interface WalletConnectProps {
  onSuccess?: () => void;
  showFeatures?: boolean;
}

export function WalletConnect({ onSuccess, showFeatures = true }: WalletConnectProps) {
  const { login, isLoading, authenticated } = useAuth();

  const handleConnect = async () => {
    try {
      await login();
      onSuccess?.();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  if (authenticated) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Wallet Connected</h3>
            <p className="text-gray-600">Your wallet is successfully connected to Swyp.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
          <CardDescription>
            Connect your wallet to start accepting payments with Swyp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleConnect} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {showFeatures && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Why Connect Your Wallet?</h3>
          <div className="grid gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">Instant Payments</h4>
                <p className="text-sm text-gray-600">
                  Accept USDC payments across multiple chains instantly
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">Secure & Decentralized</h4>
                <p className="text-sm text-gray-600">
                  Your funds remain in your control with non-custodial payments
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Wallet className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">Multi-Chain Support</h4>
                <p className="text-sm text-gray-600">
                  Accept payments on Ethereum, Polygon, Base, and more
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for navigation/header
export function WalletConnectButton() {
  const { login, logout, isLoading, authenticated, walletAddress } = useAuth();

  const handleClick = async () => {
    if (authenticated) {
      await logout();
    } else {
      await login();
    }
  };

  return (
    <Button 
      onClick={handleClick} 
      disabled={isLoading}
      variant={authenticated ? "outline" : "default"}
    >
      {isLoading ? (
        <LoadingSpinner size="sm" />
      ) : authenticated ? (
        <>
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
          {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 'Connected'}
        </>
      ) : (
        <>
          <Wallet className="w-4 h-4 mr-2" />
          Connect
        </>
      )}
    </Button>
  );
}