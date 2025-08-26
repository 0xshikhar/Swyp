'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Book, 
  Code, 
  Zap, 
  ArrowRight,
  ExternalLink,
  Copy,
  CheckCircle,
  Globe,
  Shield,
  Smartphone
} from 'lucide-react';
import { useState } from 'react';

const quickStart = [
  {
    step: 1,
    title: 'Create Account',
    description: 'Sign up and connect your wallet to get started',
    code: null
  },
  {
    step: 2,
    title: 'Generate API Key',
    description: 'Create an API key from your dashboard settings',
    code: null
  },
  {
    step: 3,
    title: 'Create Payment Link',
    description: 'Use our API to create a payment link',
    code: `curl -X POST https://api.swyp.com/v1/payment-links \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": "100.00",
    "currency": "USDC",
    "description": "Product Purchase",
    "redirect_url": "https://yoursite.com/success"
  }'`
  },
  {
    step: 4,
    title: 'Handle Webhooks',
    description: 'Listen for payment confirmations',
    code: `// Example webhook handler
app.post('/webhook', (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'payment.completed') {
    console.log('Payment completed:', data.payment_id);
    // Update your database
  }
  
  res.status(200).send('OK');
});`
  }
];

const apiEndpoints = [
  {
    method: 'POST',
    endpoint: '/v1/payment-links',
    description: 'Create a new payment link',
    params: ['amount', 'currency', 'description', 'redirect_url']
  },
  {
    method: 'GET',
    endpoint: '/v1/payment-links/{id}',
    description: 'Retrieve payment link details',
    params: ['id']
  },
  {
    method: 'GET',
    endpoint: '/v1/payments',
    description: 'List all payments',
    params: ['limit', 'offset', 'status']
  },
  {
    method: 'GET',
    endpoint: '/v1/payments/{id}',
    description: 'Retrieve payment details',
    params: ['id']
  }
];

const sdks = [
  {
    name: 'JavaScript/Node.js',
    description: 'Official SDK for JavaScript and Node.js applications',
    install: 'npm install @swyp/sdk',
    example: `import { Swyp } from '@swyp/sdk';

const swyp = new Swyp({
  apiKey: 'your-api-key',
  environment: 'sandbox' // or 'production'
});

const paymentLink = await swyp.paymentLinks.create({
  amount: '100.00',
  currency: 'USDC',
  description: 'Product Purchase'
});`
  },
  {
    name: 'Python',
    description: 'Official SDK for Python applications',
    install: 'pip install swyp-python',
    example: `import swyp

client = swyp.Client(
    api_key='your-api-key',
    environment='sandbox'
)

payment_link = client.payment_links.create(
    amount='100.00',
    currency='USDC',
    description='Product Purchase'
)`
  },
  {
    name: 'PHP',
    description: 'Official SDK for PHP applications',
    install: 'composer require swyp/swyp-php',
    example: `<?php
require_once 'vendor/autoload.php';

$swyp = new \Swyp\Client([
    'api_key' => 'your-api-key',
    'environment' => 'sandbox'
]);

$paymentLink = $swyp->paymentLinks->create([
    'amount' => '100.00',
    'currency' => 'USDC',
    'description' => 'Product Purchase'
]);`
  }
];

const features = [
  {
    icon: Zap,
    title: 'Fast Integration',
    description: 'Get started in minutes with our simple APIs and comprehensive documentation.'
  },
  {
    icon: Shield,
    title: 'Secure by Default',
    description: 'Built-in security features including webhook signature verification and API key management.'
  },
  {
    icon: Globe,
    title: 'Multi-chain Support',
    description: 'Accept USDC payments across Ethereum, Polygon, and Base networks seamlessly.'
  },
  {
    icon: Smartphone,
    title: 'Mobile Optimized',
    description: 'Payment flows work perfectly on all devices with responsive design.'
  }
];

export default function DocsPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-xl font-bold">Swyp</span>
            </Link>
            
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/#features" className="text-muted-foreground hover:text-foreground">
                Features
              </Link>
              <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
                Pricing
              </Link>
              <Link href="/docs" className="text-foreground font-medium">
                Docs
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground">
                About
              </Link>
            </nav>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/register">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="secondary" className="mb-4">
              📚 Developer Documentation
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Build with <span className="text-blue-600">Swyp</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Everything you need to integrate USDC payments into your application. 
              Simple APIs, comprehensive guides, and powerful SDKs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="#quick-start">
                  Quick Start Guide
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#api-reference">
                  API Reference
                  <Book className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Developers Choose Swyp
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Built by developers, for developers. Simple, powerful, and reliable.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg text-center">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section id="quick-start" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Quick Start Guide
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Get up and running with Swyp in just a few steps
            </p>
          </div>
          
          <div className="space-y-8">
            {quickStart.map((item, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-start space-x-6">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">{item.step}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                      <p className="text-gray-600 mb-4">{item.description}</p>
                      {item.code && (
                        <div className="relative">
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                            <code>{item.code}</code>
                          </pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 text-gray-400 hover:text-white"
                            onClick={() => copyToClipboard(item.code!, `step-${item.step}`)}
                          >
                            {copiedCode === `step-${item.step}` ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section id="api-reference" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              API Reference
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Complete reference for all Swyp API endpoints
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {apiEndpoints.map((endpoint, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Badge variant={endpoint.method === 'POST' ? 'default' : 'secondary'}>
                      {endpoint.method}
                    </Badge>
                    <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {endpoint.endpoint}
                    </code>
                  </div>
                  <CardDescription className="mt-2">
                    {endpoint.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div>
                    <h4 className="font-semibold mb-2">Parameters:</h4>
                    <div className="flex flex-wrap gap-2">
                      {endpoint.params.map((param, paramIndex) => (
                        <Badge key={paramIndex} variant="outline">
                          {param}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SDKs */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Official SDKs
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Use our official SDKs to integrate Swyp into your favorite programming language
            </p>
          </div>
          
          <div className="space-y-8">
            {sdks.map((sdk, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-2xl font-semibold mb-2">{sdk.name}</h3>
                      <p className="text-gray-600 mb-4">{sdk.description}</p>
                      <div className="bg-gray-100 p-3 rounded-lg">
                        <p className="text-sm font-semibold mb-1">Installation:</p>
                        <code className="text-sm">{sdk.install}</code>
                      </div>
                    </div>
                    <div className="relative">
                      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                        <code>{sdk.example}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 text-gray-400 hover:text-white"
                        onClick={() => copyToClipboard(sdk.example, `sdk-${index}`)}
                      >
                        {copiedCode === `sdk-${index}` ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Start Building?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of developers already building with Swyp. 
            Get your API keys and start integrating today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/register">
                Get API Keys
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600" asChild>
              <Link href="https://github.com/swyp" target="_blank">
                View on GitHub
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <span className="text-xl font-bold">Swyp</span>
              </div>
              <p className="text-gray-400">
                The fastest way to accept USDC payments with enterprise-grade security.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/#features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/api" className="hover:text-white">API</Link></li>
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white">Help Center</Link></li>
                <li><Link href="/status" className="hover:text-white">Status</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Swyp. All rights reserved. Built with Circle USDC.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}