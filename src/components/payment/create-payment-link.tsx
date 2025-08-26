'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ChainBadge } from '@/components/ui/chain-badge';
import { USDCAmount } from '@/components/ui/usdc-amount';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  Link as LinkIcon, 
  Copy, 
  QrCode, 
  Calendar,
  DollarSign,
  FileText,
  Settings,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentLinkData {
  amount: string;
  description: string;
  chainId: number;
  expiresIn: string;
  metadata: {
    orderId?: string;
    customerEmail?: string;
    customField1?: string;
    customField2?: string;
  };
}

interface CreatePaymentLinkProps {
  onPaymentLinkCreated?: (link: string) => void;
}

export function CreatePaymentLink({ onPaymentLinkCreated }: CreatePaymentLinkProps) {
  const [formData, setFormData] = useState<PaymentLinkData>({
    amount: '',
    description: '',
    chainId: 1,
    expiresIn: '24h',
    metadata: {}
  });
  
  const [isCreating, setIsCreating] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const supportedChains = [
    { id: 1, name: 'Ethereum', symbol: 'ETH' },
    { id: 137, name: 'Polygon', symbol: 'MATIC' },
    { id: 8453, name: 'Base', symbol: 'ETH' },
  ];

  const expirationOptions = [
    { value: '1h', label: '1 Hour' },
    { value: '6h', label: '6 Hours' },
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: 'never', label: 'Never' },
  ];

  const handleInputChange = (field: keyof PaymentLinkData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMetadataChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        [field]: value
      }
    }));
  };

  const handleCreateLink = async () => {
    if (!formData.amount || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0');
      return;
    }

    setIsCreating(true);
    
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/payment-links', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      // const data = await response.json();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockLinkId = 'pay_link_' + Math.random().toString(36).substring(2, 15);
      const paymentLink = `${window.location.origin}/checkout/${mockLinkId}`;
      
      setCreatedLink(paymentLink);
      onPaymentLinkCreated?.(paymentLink);
      toast.success('Payment link created successfully!');
    } catch (error) {
      toast.error('Failed to create payment link');
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      chainId: 1,
      expiresIn: '24h',
      metadata: {}
    });
    setCreatedLink(null);
    setShowAdvanced(false);
  };

  if (createdLink) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Payment Link Created
          </CardTitle>
          <CardDescription>
            Share this link with your customer to collect payment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Link */}
          <div>
            <Label>Payment Link</Label>
            <div className="mt-2 flex items-center gap-2">
              <Input 
                value={createdLink} 
                readOnly 
                className="flex-1 font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard(createdLink)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                asChild
              >
                <a href={createdLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Payment Details Summary */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h4 className="font-medium">Payment Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Amount:</span>
                <div className="mt-1">
                  <USDCAmount amount={formData.amount} />
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Network:</span>
                <div className="mt-1">
                  <ChainBadge chainId={formData.chainId} />
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Description:</span>
                <p className="mt-1">{formData.description}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Expires:</span>
                <p className="mt-1">
                  {formData.expiresIn === 'never' ? 'Never' : 
                   expirationOptions.find(opt => opt.value === formData.expiresIn)?.label}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={resetForm} variant="outline" className="flex-1">
              Create Another Link
            </Button>
            <Button variant="outline" size="sm">
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="h-5 w-5" />
          Create Payment Link
        </CardTitle>
        <CardDescription>
          Generate a secure payment link to collect USDC payments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Amount (USDC) *
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="chain" className="flex items-center gap-2">
                Network *
              </Label>
              <Select 
                value={formData.chainId.toString()} 
                onValueChange={(value) => handleInputChange('chainId', parseInt(value))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportedChains.map((chain) => (
                    <SelectItem key={chain.id} value={chain.id.toString()}>
                      <div className="flex items-center gap-2">
                        <ChainBadge chainId={chain.id} />
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Description *
            </Label>
            <Textarea
              id="description"
              placeholder="What is this payment for?"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="mt-2"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="expires" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Expires In
            </Label>
            <Select 
              value={formData.expiresIn} 
              onValueChange={(value) => handleInputChange('expiresIn', value)}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {expirationOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Advanced Options */}
        <div>
          <Button 
            variant="ghost" 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-0 h-auto font-normal text-sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            Advanced Options
          </Button>
          
          {showAdvanced && (
            <div className="mt-4 space-y-4 p-4 border rounded-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="orderId">Order ID</Label>
                  <Input
                    id="orderId"
                    placeholder="ORD-2024-001"
                    value={formData.metadata.orderId || ''}
                    onChange={(e) => handleMetadataChange('orderId', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail">Customer Email</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="customer@example.com"
                    value={formData.metadata.customerEmail || ''}
                    onChange={(e) => handleMetadataChange('customerEmail', e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customField1">Custom Field 1</Label>
                  <Input
                    id="customField1"
                    placeholder="Custom value"
                    value={formData.metadata.customField1 || ''}
                    onChange={(e) => handleMetadataChange('customField1', e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="customField2">Custom Field 2</Label>
                  <Input
                    id="customField2"
                    placeholder="Custom value"
                    value={formData.metadata.customField2 || ''}
                    onChange={(e) => handleMetadataChange('customField2', e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Preview */}
        {formData.amount && formData.description && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Preview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <USDCAmount amount={formData.amount} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Network:</span>
                <ChainBadge chainId={formData.chainId} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Description:</span>
                <span className="text-right max-w-[200px] truncate">{formData.description}</span>
              </div>
            </div>
          </div>
        )}

        {/* Create Button */}
        <Button 
          onClick={handleCreateLink} 
          disabled={isCreating || !formData.amount || !formData.description}
          className="w-full"
          size="lg"
        >
          {isCreating ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Creating Payment Link...
            </>
          ) : (
            <>
              <LinkIcon className="h-4 w-4 mr-2" />
              Create Payment Link
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}