import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const merchantRegistrationSchema = z.object({
  businessName: z.string().min(2).max(100),
  businessType: z.enum(['individual', 'corporation', 'partnership', 'llc', 'other']),
  businessDescription: z.string().min(10).max(500),
  businessAddress: z.object({
    street: z.string().min(5).max(200),
    city: z.string().min(2).max(100),
    state: z.string().min(2).max(100),
    postalCode: z.string().min(3).max(20),
    country: z.string().min(2).max(100),
  }),
  contactInfo: z.object({
    email: z.string().email(),
    phone: z.string().min(10).max(20),
    website: z.string().url().optional(),
  }),
  taxId: z.string().min(9).max(20).optional(),
  expectedVolume: z.enum(['under_10k', '10k_50k', '50k_250k', '250k_1m', 'over_1m']),
  acceptedTerms: z.boolean().refine(val => val === true, {
    message: 'Terms and conditions must be accepted'
  }),
});

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user already has a merchant profile
    const existingMerchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
    });

    if (existingMerchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant profile already exists' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const merchantData = merchantRegistrationSchema.parse(body);

    // Create merchant profile
    const merchant = await prisma.merchant.create({
      data: {
        userId: user.id,
        businessName: merchantData.businessName,
        businessType: merchantData.businessType,
        businessDescription: merchantData.businessDescription,
        businessAddress: merchantData.businessAddress,
        contactInfo: merchantData.contactInfo,
        taxId: merchantData.taxId,
        expectedVolume: merchantData.expectedVolume,
        status: 'pending_verification',
        kycStatus: 'not_started',
        acceptedTermsAt: new Date(),
      },
    });

    // Create initial merchant settings
    await prisma.merchantSettings.create({
      data: {
        merchantId: merchant.id,
        paymentMethods: ['usdc'],
        autoSettle: true,
        settlementDelay: 24, // hours
        webhookUrl: null,
        notificationPreferences: {
          email: true,
          sms: false,
          webhook: false,
        },
      },
    });

    return NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        businessName: merchant.businessName,
        status: merchant.status,
        kycStatus: merchant.kycStatus,
        createdAt: merchant.createdAt,
      },
      message: 'Merchant registration successful. KYC verification will be initiated shortly.',
    });
  } catch (error) {
    console.error('Merchant registration error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid registration data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    );
  }
}