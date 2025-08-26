'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { USDCAmount } from '@/components/ui/usdc-amount';
import { ChainBadge } from '@/components/ui/chain-badge';
import { CreatePaymentLink } from '@/components/payment/create-payment-link';
import { 
  Plus, 
  Search, 
  Filter, 
  Copy, 
  ExternalLink, 
  MoreHorizontal,
  Eye,
  Trash2,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// Mock data for payment links
const mockPaymentLinks = [
  {
    id: 'pay_link_001',
    amount: 299.99,
    description: 'Premium Plan Subscription',
    chainId: 1,
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    expiresAt: '2024-01-22T10:30:00Z',
    clicks: 15,
    payments: 3,
    totalPaid: 899.97,
    metadata: {
      orderId: 'ORD-2024-001'
    }
  },
  {
    id: 'pay_link_002',
    amount: 49.99,
    description: 'Digital Product Purchase',
    chainId: 137,
    status: 'active',
    createdAt: '2024-01-14T15:45:00Z',
    expiresAt: '2024-01-21T15:45:00Z',
    clicks: 8,
    payments: 1,
    totalPaid: 49.99,
    metadata: {
      orderId: 'ORD-2024-002'
    }
  },
  {
    id: 'pay_link_003',
    amount: 1299.00,
    description: 'Enterprise License',
    chainId: 8453,
    status: 'expired',
    createdAt: '2024-01-10T09:15:00Z',
    expiresAt: '2024-01-13T09:15:00Z',
    clicks: 25,
    payments: 0,
    totalPaid: 0,
    metadata: {
      orderId: 'ORD-2024-003'
    }
  },
  {
    id: 'pay_link_004',
    amount: 99.99,
    description: 'Monthly Subscription',
    chainId: 1,
    status: 'completed',
    createdAt: '2024-01-12T14:20:00Z',
    expiresAt: '2024-01-19T14:20:00Z',
    clicks: 12,
    payments: 5,
    totalPaid: 499.95,
    metadata: {
      orderId: 'ORD-2024-004'
    }
  }
];

type PaymentLinkStatus = 'all' | 'active' | 'expired' | 'completed';

export default function PaymentLinksPage() {
  const [paymentLinks, setPaymentLinks] = useState(mockPaymentLinks);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentLinkStatus>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const filteredLinks = paymentLinks.filter(link => {
    const matchesSearch = 
      link.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.metadata.orderId?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || link.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      expired: 'secondary',
      completed: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const getPaymentLinkUrl = (linkId: string) => {
    return `${window.location.origin}/checkout/${linkId}`;
  };

  const handleDeleteLink = (linkId: string) => {
    if (confirm('Are you sure you want to delete this payment link?')) {
      setPaymentLinks(prev => prev.filter(link => link.id !== linkId));
      toast.success('Payment link deleted');
    }
  };

  const handlePaymentLinkCreated = (link: string) => {
    setShowCreateForm(false);
    // Refresh the list or add the new link
    toast.success('Payment link created and added to your list');
  };

  const totalStats = {
    totalLinks: paymentLinks.length,
    activeLinks: paymentLinks.filter(l => l.status === 'active').length,
    totalClicks: paymentLinks.reduce((sum, l) => sum + l.clicks, 0),
    totalRevenue: paymentLinks.reduce((sum, l) => sum + l.totalPaid, 0)
  };

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create Payment Link</h1>
            <p className="text-muted-foreground mt-2">
              Generate a secure payment link to collect USDC payments
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowCreateForm(false)}
          >
            Back to Payment Links
          </Button>
        </div>
        
        <CreatePaymentLink onPaymentLinkCreated={handlePaymentLinkCreated} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Links</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage payment links for your customers
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Payment Link
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Links</p>
                <p className="text-2xl font-bold">{totalStats.totalLinks}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Links</p>
                <p className="text-2xl font-bold">{totalStats.activeLinks}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{totalStats.totalClicks}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <div className="text-2xl font-bold">
                  <USDCAmount amount={totalStats.totalRevenue.toString()} />
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payment links..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(value: PaymentLinkStatus) => setStatusFilter(value)}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Links Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Links</CardTitle>
          <CardDescription>
            {filteredLinks.length} of {paymentLinks.length} payment links
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Network</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Payments</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLinks.map((link) => (
                <TableRow key={link.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{link.description}</p>
                      <p className="text-sm text-muted-foreground">{link.id}</p>
                      {link.metadata.orderId && (
                        <p className="text-xs text-muted-foreground">
                          Order: {link.metadata.orderId}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <USDCAmount amount={link.amount.toString()} />
                  </TableCell>
                  <TableCell>
                    <ChainBadge chainId={link.chainId} />
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(link.status)}
                  </TableCell>
                  <TableCell>{link.clicks}</TableCell>
                  <TableCell>{link.payments}</TableCell>
                  <TableCell>
                    <USDCAmount amount={link.totalPaid.toString()} />
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{new Date(link.createdAt).toLocaleDateString()}</p>
                      <p className="text-muted-foreground">
                        Expires: {new Date(link.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => copyToClipboard(getPaymentLinkUrl(link.id))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        asChild
                      >
                        <a 
                          href={getPaymentLinkUrl(link.id)} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteLink(link.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredLinks.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No payment links found</p>
              {searchQuery || statusFilter !== 'all' ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="mt-2"
                >
                  Clear Filters
                </Button>
              ) : (
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Payment Link
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}