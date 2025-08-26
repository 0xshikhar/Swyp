'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { USDCAmount } from '@/components/ui/usdc-amount';
import { ChainBadge } from '@/components/ui/chain-badge';
import { NetworkStatus } from '@/components/ui/network-status';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useWallet } from '@/hooks/use-wallet';
import { useAuth } from '@/hooks/useAuth';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ExternalLink,
  Copy,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Mock payment link data - replace with real API call
const mockPaymentLink = {
  id: 'pay_link_123',
  merchantName: 'Acme Corp',
  merchantLogo: null,
  amount: 299.99,
  description: 'Premium Plan Subscription',
  currency: 'USDC',
  chainId: 1,
  expiresAt: '2024-01-20T23:59:59Z',
  status: 'active',
  metadata: {
    orderId: 'ORD-2024-001',
    customerEmail: 'customer@example.com'
  }
};

type PaymentStatus = 'idle' | 'connecting' | 'confirming' | 'processing' | 'completed' | 'failed';

export default function CheckoutPage() {
  const params = useParams();
  const paymentId = params.id as string;
  const { isConnected, address, chainId, switchToChain, usdcBalance } = useWallet();
  const { user, login } = useAuth();
  
  const [paymentLink, setPaymentLink] = useState(mockPaymentLink);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Simulate loading payment link data
    const loadPaymentLink = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/payment-links/${paymentId}`);
        // const data = await response.json();
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setPaymentLink(mockPaymentLink);
      } catch (err) {
        setError('Failed to load payment link');
      } finally {
        setLoading(false);
      }
    };

    loadPaymentLink();
  }, [paymentId]);

  const handleConnectWallet = async () => {
    try {
      setPaymentStatus('connecting');
      await login();
      setPaymentStatus('idle');
    } catch (err) {
      setPaymentStatus('failed');
      toast.error('Failed to connect wallet');
    }
  };

  const handleSwitchChain = async () => {
    try {
      await switchToChain(paymentLink.chainId);
      toast.success('Network switched successfully');
    } catch (err) {
      toast.error('Failed to switch network');
    }
  };

  const handlePayment = async () => {
    try {
      setPaymentStatus('confirming');
      
      // TODO: Implement actual payment logic with Circle SDK
      // This would involve:
      // 1. Create payment intent
      // 2. Get user approval for USDC transfer
      // 3. Execute the transaction
      // 4. Monitor transaction status
      
      // Simulate payment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPaymentStatus('processing');
      
      // Simulate transaction hash
      const mockTxHash = '0x' + Math.random().toString(16).substring(2, 66);
      setTxHash(mockTxHash);
      
      await new Promise(resolve => setTimeout(resolve, 3000));
      setPaymentStatus('completed');
      
      toast.success('Payment completed successfully!');
    } catch (err) {
      setPaymentStatus('failed');
      toast.error('Payment failed. Please try again.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const isExpired = new Date(paymentLink.expiresAt) < new Date();
  const isWrongChain = isConnected && chainId !== paymentLink.chainId;
  const hasInsufficientBalance = isConnected && usdcBalance && parseFloat(usdcBalance) < paymentLink.amount;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-semibold">Payment Link Not Found</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Go Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Swyp</span>
          </div>
          <h1 className="text-2xl font-bold">Secure Payment</h1>
          <p className="text-muted-foreground">Complete your payment securely with USDC</p>
        </div>

        {/* Payment Details */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {paymentLink.merchantLogo ? (
                    <img 
                      src={paymentLink.merchantLogo} 
                      alt={paymentLink.merchantName}
                      className="w-8 h-8 rounded"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                      <span className="text-sm font-bold">
                        {paymentLink.merchantName.charAt(0)}
                      </span>
                    </div>
                  )}
                  {paymentLink.merchantName}
                </CardTitle>
                <CardDescription>{paymentLink.description}</CardDescription>
              </div>
              <Badge variant={isExpired ? 'destructive' : 'default'}>
                {isExpired ? 'Expired' : 'Active'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-lg">
              <span className="font-medium">Amount:</span>
              <USDCAmount amount={paymentLink.amount.toString()} size="lg" />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Network:</span>
              <ChainBadge chainId={paymentLink.chainId} />
            </div>
            
            {paymentLink.metadata.orderId && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Order ID:</span>
                <div className="flex items-center gap-2">
                  <code className="text-sm">{paymentLink.metadata.orderId}</code>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(paymentLink.metadata.orderId)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Expires:</span>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {new Date(paymentLink.expiresAt).toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        {paymentStatus !== 'idle' && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                {paymentStatus === 'connecting' && (
                  <>
                    <LoadingSpinner />
                    <p>Connecting to wallet...</p>
                  </>
                )}
                {paymentStatus === 'confirming' && (
                  <>
                    <LoadingSpinner />
                    <p>Please confirm the transaction in your wallet...</p>
                  </>
                )}
                {paymentStatus === 'processing' && (
                  <>
                    <LoadingSpinner />
                    <p>Processing payment...</p>
                    {txHash && (
                      <div className="text-sm text-muted-foreground">
                        Transaction: 
                        <a 
                          href={`https://etherscan.io/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline ml-1"
                        >
                          {txHash.slice(0, 10)}...{txHash.slice(-8)}
                          <ExternalLink className="h-3 w-3 inline ml-1" />
                        </a>
                      </div>
                    )}
                  </>
                )}
                {paymentStatus === 'completed' && (
                  <>
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <h3 className="text-xl font-semibold">Payment Successful!</h3>
                    <p className="text-muted-foreground">
                      Your payment has been processed successfully.
                    </p>
                    {txHash && (
                      <Button variant="outline" asChild>
                        <a 
                          href={`https://etherscan.io/tx/${txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View Transaction
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                    )}
                  </>
                )}
                {paymentStatus === 'failed' && (
                  <>
                    <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                    <h3 className="text-xl font-semibold">Payment Failed</h3>
                    <p className="text-muted-foreground">
                      Something went wrong. Please try again.
                    </p>
                    <Button onClick={() => setPaymentStatus('idle')}>
                      Try Again
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Actions */}
        {paymentStatus === 'idle' && !isExpired && (
          <Card>
            <CardContent className="pt-6">
              {!isConnected ? (
                <div className="text-center space-y-4">
                  <h3 className="text-lg font-semibold">Connect Your Wallet</h3>
                  <p className="text-muted-foreground">
                    Connect your wallet to complete the payment
                  </p>
                  <Button onClick={handleConnectWallet} size="lg" className="w-full">
                    Connect Wallet
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Wallet Connected:</span>
                    <code className="text-sm">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </code>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Network Status:</span>
                    <NetworkStatus />
                  </div>
                  
                  {usdcBalance && (
                    <div className="flex items-center justify-between">
                      <span>USDC Balance:</span>
                      <USDCAmount amount={usdcBalance} />
                    </div>
                  )}
                  
                  <Separator />
                  
                  {isWrongChain ? (
                    <div className="text-center space-y-4">
                      <p className="text-amber-600">
                        Please switch to the correct network to continue
                      </p>
                      <Button onClick={handleSwitchChain} variant="outline" className="w-full">
                        Switch to <ChainBadge chainId={paymentLink.chainId} className="ml-2" />
                      </Button>
                    </div>
                  ) : hasInsufficientBalance ? (
                    <div className="text-center space-y-4">
                      <p className="text-red-600">
                        Insufficient USDC balance to complete this payment
                      </p>
                      <Button disabled className="w-full">
                        Insufficient Balance
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handlePayment} size="lg" className="w-full">
                      Pay <USDCAmount amount={paymentLink.amount.toString()} className="ml-2" />
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Expired Payment */}
        {isExpired && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                <h3 className="text-xl font-semibold">Payment Link Expired</h3>
                <p className="text-muted-foreground">
                  This payment link has expired. Please contact the merchant for a new payment link.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Powered by Swyp • Secure payments with Circle USDC</p>
        </div>
      </div>
    </div>
  );
}