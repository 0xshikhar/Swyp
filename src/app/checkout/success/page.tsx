'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { USDCAmount } from '@/components/ui/usdc-amount';
import { ChainBadge } from '@/components/ui/chain-badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  CheckCircle,
  ExternalLink,
  Copy,
  ArrowLeft,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Mock payment data - replace with real API call
const mockPaymentData = {
  id: 'pay_123456789',
  txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  amount: 299.99,
  currency: 'USDC',
  chainId: 1,
  merchantName: 'Acme Corp',
  description: 'Premium Plan Subscription',
  timestamp: new Date().toISOString(),
  status: 'completed',
  metadata: {
    orderId: 'ORD-2024-001',
    customerEmail: 'customer@example.com'
  }
};

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const paymentId = searchParams.get('payment_id');
  const txHash = searchParams.get('tx_hash');

  const [paymentData, setPaymentData] = useState(mockPaymentData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load payment confirmation data
    const loadPaymentData = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/payments/${paymentId}`);
        // const data = await response.json();

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Use txHash from URL if available
        if (txHash) {
          setPaymentData(prev => ({ ...prev, txHash }));
        }

        setPaymentData(mockPaymentData);
      } catch (err) {
        setError('Failed to load payment confirmation');
      } finally {
        setLoading(false);
      }
    };

    loadPaymentData();
  }, [paymentId, txHash]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const downloadReceipt = () => {
    // TODO: Implement receipt download
    toast.success('Receipt download started');
  };

  const getExplorerUrl = (hash: string) => {
    const explorers = {
      1: 'https://etherscan.io',
      137: 'https://polygonscan.com',
      8453: 'https://basescan.org'
    };
    const baseUrl = explorers[paymentData.chainId as keyof typeof explorers] || explorers[1];
    return `${baseUrl}/tx/${hash}`;
  };

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
              <div className="text-red-500 text-xl">⚠️</div>
              <h2 className="text-xl font-semibold">Error Loading Payment</h2>
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
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-green-600 mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Your payment has been processed and confirmed on the blockchain
          </p>
        </div>

        {/* Payment Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Payment Summary</CardTitle>
            <CardDescription>
              Transaction completed on {new Date(paymentData.timestamp).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Amount Paid</label>
                <div className="mt-1">
                  <USDCAmount amount={paymentData.amount.toString()} size="lg" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Network</label>
                <div className="mt-1">
                  <ChainBadge chainId={paymentData.chainId} />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Merchant</label>
              <p className="mt-1 font-medium">{paymentData.merchantName}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="mt-1">{paymentData.description}</p>
            </div>

            {paymentData.metadata.orderId && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Order ID</label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    {paymentData.metadata.orderId}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(paymentData.metadata.orderId)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              Blockchain confirmation and transaction information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Payment ID</label>
              <div className="mt-1 flex items-center gap-2">
                <code className="text-sm bg-muted px-2 py-1 rounded flex-1">
                  {paymentData.id}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(paymentData.id)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
              <div className="mt-1 flex items-center gap-2">
                <code className="text-sm bg-muted px-2 py-1 rounded flex-1 truncate">
                  {paymentData.txHash}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(paymentData.txHash)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a
                    href={getExplorerUrl(paymentData.txHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Button
                onClick={downloadReceipt}
                variant="outline"
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild className="flex-1">
            <a
              href={getExplorerUrl(paymentData.txHash)}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on Blockchain Explorer
              <ExternalLink className="h-4 w-4 ml-2" />
            </a>
          </Button>
          <Button variant="outline" asChild className="flex-1">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Thank you for using Swyp for your payment!</p>
          <p className="mt-1">Questions? Contact support at support@swyp.com</p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}