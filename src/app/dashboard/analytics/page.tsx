'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { USDCAmount } from '@/components/ui/usdc-amount';
import { ChainBadge } from '@/components/ui/chain-badge';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Users, 
  BarChart3,
  Download,
  Calendar
} from 'lucide-react';

// Mock data - replace with real API calls
const mockAnalytics = {
  overview: {
    totalRevenue: 125430.50,
    revenueChange: 12.5,
    totalTransactions: 1247,
    transactionsChange: 8.3,
    uniqueCustomers: 342,
    customersChange: -2.1,
    averageOrderValue: 100.58,
    aovChange: 5.7
  },
  revenueByPeriod: [
    { period: 'Jan', revenue: 8500, transactions: 85 },
    { period: 'Feb', revenue: 9200, transactions: 92 },
    { period: 'Mar', revenue: 10100, transactions: 101 },
    { period: 'Apr', revenue: 11300, transactions: 113 },
    { period: 'May', revenue: 12800, transactions: 128 },
    { period: 'Jun', revenue: 14200, transactions: 142 },
    { period: 'Jul', revenue: 15600, transactions: 156 },
    { period: 'Aug', revenue: 13900, transactions: 139 },
    { period: 'Sep', revenue: 12100, transactions: 121 },
    { period: 'Oct', revenue: 10800, transactions: 108 },
    { period: 'Nov', revenue: 9500, transactions: 95 },
    { period: 'Dec', revenue: 7530, transactions: 67 }
  ],
  topChains: [
    { chainId: 1, name: 'Ethereum', volume: 45230.50, percentage: 36.1, transactions: 450 },
    { chainId: 137, name: 'Polygon', volume: 38920.25, percentage: 31.0, transactions: 389 },
    { chainId: 8453, name: 'Base', volume: 25180.75, percentage: 20.1, transactions: 252 },
    { chainId: 42161, name: 'Arbitrum', volume: 16099.00, percentage: 12.8, transactions: 156 }
  ],
  paymentMethods: [
    { method: 'Wallet Connect', volume: 67230.50, percentage: 53.6, transactions: 672 },
    { method: 'MetaMask', volume: 35120.25, percentage: 28.0, transactions: 351 },
    { method: 'Coinbase Wallet', volume: 15080.75, percentage: 12.0, transactions: 151 },
    { method: 'WalletConnect V2', volume: 7999.00, percentage: 6.4, transactions: 73 }
  ],
  hourlyDistribution: [
    { hour: '00', transactions: 12 },
    { hour: '01', transactions: 8 },
    { hour: '02', transactions: 5 },
    { hour: '03', transactions: 3 },
    { hour: '04', transactions: 4 },
    { hour: '05', transactions: 7 },
    { hour: '06', transactions: 15 },
    { hour: '07', transactions: 28 },
    { hour: '08', transactions: 45 },
    { hour: '09', transactions: 62 },
    { hour: '10', transactions: 78 },
    { hour: '11', transactions: 85 },
    { hour: '12', transactions: 92 },
    { hour: '13', transactions: 88 },
    { hour: '14', transactions: 95 },
    { hour: '15', transactions: 102 },
    { hour: '16', transactions: 98 },
    { hour: '17', transactions: 85 },
    { hour: '18', transactions: 72 },
    { hour: '19', transactions: 58 },
    { hour: '20', transactions: 45 },
    { hour: '21', transactions: 35 },
    { hour: '22', transactions: 25 },
    { hour: '23', transactions: 18 }
  ]
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d');
  const [chartType, setChartType] = useState('revenue');

  const { overview, revenueByPeriod, topChains, paymentMethods, hourlyDistribution } = mockAnalytics;

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return null;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your payment performance and customer insights
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <USDCAmount amount={overview.totalRevenue.toString()} />
            </div>
            <div className={`text-xs flex items-center gap-1 ${getChangeColor(overview.revenueChange)}`}>
              {getChangeIcon(overview.revenueChange)}
              {Math.abs(overview.revenueChange)}% from last period
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.totalTransactions.toLocaleString()}</div>
            <div className={`text-xs flex items-center gap-1 ${getChangeColor(overview.transactionsChange)}`}>
              {getChangeIcon(overview.transactionsChange)}
              {Math.abs(overview.transactionsChange)}% from last period
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overview.uniqueCustomers.toLocaleString()}</div>
            <div className={`text-xs flex items-center gap-1 ${getChangeColor(overview.customersChange)}`}>
              {getChangeIcon(overview.customersChange)}
              {Math.abs(overview.customersChange)}% from last period
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Order Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <USDCAmount amount={overview.averageOrderValue.toString()} />
            </div>
            <div className={`text-xs flex items-center gap-1 ${getChangeColor(overview.aovChange)}`}>
              {getChangeIcon(overview.aovChange)}
              {Math.abs(overview.aovChange)}% from last period
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue and transaction volume</CardDescription>
            </div>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="transactions">Transactions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80 flex items-end justify-between gap-2 p-4">
            {revenueByPeriod.map((data, index) => {
              const maxValue = Math.max(...revenueByPeriod.map(d => chartType === 'revenue' ? d.revenue : d.transactions));
              const value = chartType === 'revenue' ? data.revenue : data.transactions;
              const height = (value / maxValue) * 100;
              
              return (
                <div key={data.period} className="flex flex-col items-center gap-2 flex-1">
                  <div className="text-xs text-muted-foreground">
                    {chartType === 'revenue' ? `$${(value / 1000).toFixed(1)}k` : value}
                  </div>
                  <div 
                    className="w-full bg-primary rounded-t transition-all duration-300 hover:bg-primary/80"
                    style={{ height: `${height}%`, minHeight: '4px' }}
                  />
                  <div className="text-xs font-medium">{data.period}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Chains */}
        <Card>
          <CardHeader>
            <CardTitle>Top Chains</CardTitle>
            <CardDescription>Payment volume by blockchain network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topChains.map((chain) => (
                <div key={chain.chainId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ChainBadge chainId={chain.chainId} />
                    <div>
                      <div className="font-medium">{chain.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {chain.transactions} transactions
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      <USDCAmount amount={chain.volume.toString()} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {chain.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Popular wallet connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{method.method}</div>
                      <div className="text-sm text-muted-foreground">
                        {method.transactions} transactions
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      <USDCAmount amount={method.volume.toString()} />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {method.percentage}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Hourly Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Distribution</CardTitle>
          <CardDescription>Payment activity by hour of day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-40 flex items-end justify-between gap-1 p-4">
            {hourlyDistribution.map((data) => {
              const maxTransactions = Math.max(...hourlyDistribution.map(d => d.transactions));
              const height = (data.transactions / maxTransactions) * 100;
              
              return (
                <div key={data.hour} className="flex flex-col items-center gap-1 flex-1">
                  <div className="text-xs text-muted-foreground">
                    {data.transactions > 0 ? data.transactions : ''}
                  </div>
                  <div 
                    className="w-full bg-secondary rounded-t transition-all duration-300 hover:bg-secondary/80"
                    style={{ height: `${height}%`, minHeight: data.transactions > 0 ? '2px' : '0px' }}
                  />
                  <div className="text-xs font-medium">{data.hour}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}