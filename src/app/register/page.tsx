'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { Wallet, Store, Globe, Mail } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface MerchantData {
  businessName: string;
  businessType: string;
  website: string;
  email: string;
  description: string;
}

export default function RegisterPage() {
  const { login, authenticated, ready, user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'connect' | 'details'>('connect');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [merchantData, setMerchantData] = useState<MerchantData>({
    businessName: '',
    businessType: '',
    website: '',
    email: '',
    description: ''
  });

  useEffect(() => {
    if (ready && authenticated && user) {
      setStep('details');
    }
  }, [ready, authenticated, user]);

  const handleConnect = async () => {
    try {
      await login();
    } catch (error) {
      toast.error('Failed to connect wallet. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Implement merchant registration API call
      // const response = await fetch('/api/merchants/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     walletAddress: user?.wallet?.address,
      //     ...merchantData
      //   })
      // });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast.success('Registration Successful! Your merchant account has been created. Welcome to Swyp!');

      router.push('/dashboard');
    } catch (error) {
      toast.error('Failed to create merchant account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof MerchantData, value: string) => {
    setMerchantData(prev => ({ ...prev, [field]: value }));
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Header */}
        <div className="text-center">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">Swyp</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join as Merchant
          </h1>
          <p className="text-gray-600">
            Start accepting USDC payments in minutes
          </p>
        </div>

        {/* Registration Card */}
        <Card className="border-0 shadow-xl">
          {step === 'connect' ? (
            <>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">Connect Your Wallet</CardTitle>
                <CardDescription>
                  First, connect your wallet to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button 
                  onClick={handleConnect}
                  className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet
                </Button>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">Business Details</CardTitle>
                <CardDescription>
                  Tell us about your business
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">
                      <Store className="inline h-4 w-4 mr-1" />
                      Business Name *
                    </Label>
                    <Input
                      id="businessName"
                      value={merchantData.businessName}
                      onChange={(e) => handleInputChange('businessName', e.target.value)}
                      placeholder="Your Business Name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type *</Label>
                    <Input
                      id="businessType"
                      value={merchantData.businessType}
                      onChange={(e) => handleInputChange('businessType', e.target.value)}
                      placeholder="e.g., E-commerce, SaaS, Consulting"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">
                      <Globe className="inline h-4 w-4 mr-1" />
                      Website
                    </Label>
                    <Input
                      id="website"
                      type="url"
                      value={merchantData.website}
                      onChange={(e) => handleInputChange('website', e.target.value)}
                      placeholder="https://yourbusiness.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">
                      <Mail className="inline h-4 w-4 mr-1" />
                      Contact Email *
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={merchantData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="contact@yourbusiness.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Business Description</Label>
                    <Textarea
                      id="description"
                      value={merchantData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Brief description of your business..."
                      rows={3}
                    />
                  </div>

                  <Button 
                    type="submit"
                    className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700"
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating Account...
                      </div>
                    ) : (
                      'Create Merchant Account'
                    )}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign In
            </Link>
          </p>
          <p className="mt-2">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}