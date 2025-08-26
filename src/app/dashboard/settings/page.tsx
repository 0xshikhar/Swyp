'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CopyButton } from '@/components/ui/copy-button';
import { 
  Save, 
  Key, 
  Webhook, 
  Shield, 
  Bell,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
// Alert dialog functionality will be handled with simple confirmation

// Mock data - replace with real API calls
const mockMerchant = {
  businessName: 'Acme Corp',
  businessType: 'E-commerce',
  website: 'https://acme.com',
  email: 'contact@acme.com',
  description: 'Leading provider of innovative solutions'
};

const mockApiKeys = [
  {
    id: 'key_1',
    name: 'Production API Key',
    key: 'sk_live_1234567890abcdef1234567890abcdef',
    createdAt: '2024-01-10T10:00:00Z',
    lastUsed: '2024-01-15T14:30:00Z'
  },
  {
    id: 'key_2',
    name: 'Development API Key',
    key: 'sk_test_abcdef1234567890abcdef1234567890',
    createdAt: '2024-01-05T09:00:00Z',
    lastUsed: '2024-01-15T12:15:00Z'
  }
];

const mockWebhooks = [
  {
    id: 'wh_1',
    url: 'https://api.acme.com/webhooks/payments',
    events: ['payment.completed', 'payment.failed'],
    status: 'active',
    createdAt: '2024-01-10T10:00:00Z'
  },
  {
    id: 'wh_2',
    url: 'https://staging.acme.com/webhooks/payments',
    events: ['payment.completed'],
    status: 'inactive',
    createdAt: '2024-01-08T15:30:00Z'
  }
];

export default function SettingsPage() {
  const [merchant, setMerchant] = useState(mockMerchant);
  const [apiKeys, setApiKeys] = useState(mockApiKeys);
  const [webhooks, setWebhooks] = useState(mockWebhooks);
  const [showApiKeys, setShowApiKeys] = useState<{[key: string]: boolean}>({});
  const [notifications, setNotifications] = useState({
    emailPayments: true,
    emailFailures: true,
    webhookFailures: true
  });

  const handleSaveMerchant = () => {
    // TODO: Implement API call to save merchant settings
    toast.success('Settings saved successfully');
  };

  const handleCreateApiKey = () => {
    // TODO: Implement API call to create new API key
    const newKey = {
      id: `key_${Date.now()}`,
      name: 'New API Key',
      key: `sk_test_${Math.random().toString(36).substring(2)}`,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString()
    };
    setApiKeys([...apiKeys, newKey]);
    toast.success('API key created successfully');
  };

  const handleDeleteApiKey = (keyId: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== keyId));
    toast.success('API key deleted successfully');
  };

  const handleCreateWebhook = () => {
    // TODO: Implement webhook creation modal/form
    toast.info('Webhook creation coming soon');
  };

  const handleDeleteWebhook = (webhookId: string) => {
    setWebhooks(webhooks.filter(wh => wh.id !== webhookId));
    toast.success('Webhook deleted successfully');
  };

  const toggleApiKeyVisibility = (keyId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings, API keys, and integrations
        </p>
      </div>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Business Information
          </CardTitle>
          <CardDescription>
            Update your business details and contact information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={merchant.businessName}
                onChange={(e) => setMerchant({...merchant, businessName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Input
                id="businessType"
                value={merchant.businessType}
                onChange={(e) => setMerchant({...merchant, businessType: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={merchant.website}
                onChange={(e) => setMerchant({...merchant, website: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Contact Email</Label>
              <Input
                id="email"
                type="email"
                value={merchant.email}
                onChange={(e) => setMerchant({...merchant, email: e.target.value})}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Business Description</Label>
            <Textarea
              id="description"
              value={merchant.description}
              onChange={(e) => setMerchant({...merchant, description: e.target.value})}
              rows={3}
            />
          </div>
          <Button onClick={handleSaveMerchant}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
              <CardDescription>
                Manage your API keys for integrating with Swyp
              </CardDescription>
            </div>
            <Button onClick={handleCreateApiKey}>
              <Plus className="h-4 w-4 mr-2" />
              Create Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">{apiKey.name}</div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {showApiKeys[apiKey.id] 
                        ? apiKey.key 
                        : `${apiKey.key.slice(0, 12)}${'•'.repeat(20)}`
                      }
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleApiKeyVisibility(apiKey.id)}
                    >
                      {showApiKeys[apiKey.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <CopyButton value={apiKey.key} size="sm" />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                    {apiKey.lastUsed && (
                      <> • Last used: {new Date(apiKey.lastUsed).toLocaleDateString()}</>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
                      handleDeleteApiKey(apiKey.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks
              </CardTitle>
              <CardDescription>
                Configure webhook endpoints to receive payment notifications
              </CardDescription>
            </div>
            <Button onClick={handleCreateWebhook}>
              <Plus className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <code className="text-sm">{webhook.url}</code>
                    <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                      {webhook.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Events: {webhook.events.join(', ')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Created: {new Date(webhook.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
                        handleDeleteWebhook(webhook.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email notifications for successful payments</Label>
              <div className="text-sm text-muted-foreground">
                Receive an email when a payment is completed
              </div>
            </div>
            <Switch
              checked={notifications.emailPayments}
              onCheckedChange={(checked) => 
                setNotifications({...notifications, emailPayments: checked})
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email notifications for failed payments</Label>
              <div className="text-sm text-muted-foreground">
                Receive an email when a payment fails
              </div>
            </div>
            <Switch
              checked={notifications.emailFailures}
              onCheckedChange={(checked) => 
                setNotifications({...notifications, emailFailures: checked})
              }
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Webhook failure notifications</Label>
              <div className="text-sm text-muted-foreground">
                Receive notifications when webhook delivery fails
              </div>
            </div>
            <Switch
              checked={notifications.webhookFailures}
              onCheckedChange={(checked) => 
                setNotifications({...notifications, webhookFailures: checked})
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}