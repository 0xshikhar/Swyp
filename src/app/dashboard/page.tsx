'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { USDCAmount } from '@/components/ui/usdc-amount';
import { ChainBadge } from '@/components/ui/chain-badge';
import { NetworkStatus } from '@/components/ui/network-status';
import { useAuth } from '@/hooks/use-auth';
import { useWallet } from '@/hooks/use-wallet';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  CreditCard,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';

// Mock data - replace with real API calls
const mockStats = {
  totalRevenue: 125430.50,
  totalTransactions: 1247,
  activeCustomers: 89,
  conversionRate: 3.2,
  revenueChange: 12.5,
  transactionChange: -2.1,
  customerChange: 8.3,
  conversionChange: 0.8
};

const mockRecentTransactions = [
  {
    id: 'tx_1',
    amount: 299.99,
    customer: '0x1234...5678',
    status: 'completed',
    chainId: 1,
    timestamp: '2024-01-15T10:30:00Z'
  },
  {
    id: 'tx_2',
    amount: 149.50,
    customer: '0x8765...4321',
    status: 'pending',
    chainId: 137,
    timestamp: '2024-01-15T09:15:00Z'
  },
  {
    id: 'tx_3',
    amount: 89.99,
    customer: '0x9876...1234',
    status: 'completed',
    chainId: 8453,
    timestamp: '2024-01-15T08:45:00Z'
  }
];

export default function DashboardPage() {
  useAuth(); // Ensure user is authenticated
  const { usdcBalance, nativeBalance, chainId } = useWallet();

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    format = 'number'
  }: {
    title: string;
    value: number;
    change: number;
    icon: any;
    format?: 'number' | 'currency' | 'percentage';
  }) => {
    const isPositive = change > 0;
    const formatValue = () => {
      switch (format) {
        case 'currency':
          return `$${value.toLocaleString()}`;
        case 'percentage':
          return `${value}%`;
        default:
          return value.toLocaleString();
      }
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue()}</div>
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {isPositive ? (
              <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-600 mr-1" />
            )}
            <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
              {Math.abs(change)}%
            </span>
            <span className="ml-1">from last month</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your business.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NetworkStatus />
          <Button asChild>
            <Link href="/dashboard/payment-links">
              <Plus className="h-4 w-4 mr-2" />
              Create Payment Link
            </Link>
          </Button>
        </div>
      </div>

      {/* Wallet Status */}
      {chainId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Wallet Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Network:</span>
                <ChainBadge chainId={chainId} />
              </div>
              <NetworkStatus showText={false} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">USDC Balance</p>
                <USDCAmount amount={usdcBalance || '0'} size="lg" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Native Balance</p>
                <p className="text-lg font-semibold">
                  {parseFloat(nativeBalance || '0').toFixed(4)} ETH
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={mockStats.totalRevenue}
          change={mockStats.revenueChange}
          icon={DollarSign}
          format="currency"
        />
        <StatCard
          title="Transactions"
          value={mockStats.totalTransactions}
          change={mockStats.transactionChange}
          icon={CreditCard}
        />
        <StatCard
          title="Active Customers"
          value={mockStats.activeCustomers}
          change={mockStats.customerChange}
          icon={Users}
        />
        <StatCard
          title="Conversion Rate"
          value={mockStats.conversionRate}
          change={mockStats.conversionChange}
          icon={TrendingUp}
          format="percentage"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                Your latest payment activities
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/payments">
                View All
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <USDCAmount amount={tx.amount.toString()} />
                        <ChainBadge chainId={tx.chainId} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {tx.customer}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={tx.status === 'completed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {tx.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/dashboard/payments/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Payment Link
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/dashboard/analytics">
                <Activity className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href="/dashboard/settings">
                <Users className="h-4 w-4 mr-2" />
                Manage Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}