import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateMerchantSchema = z.object({
  businessName: z.string().min(2).max(100).optional(),
  businessDescription: z.string().min(10).max(500).optional(),
  businessAddress: z.object({
    street: z.string().min(5).max(200),
    city: z.string().min(2).max(100),
    state: z.string().min(2).max(100),
    postalCode: z.string().min(3).max(20),
    country: z.string().min(2).max(100),
  }).optional(),
  contactInfo: z.object({
    email: z.string().email(),
    phone: z.string().min(10).max(20),
    website: z.string().url().optional(),
  }).optional(),
  expectedVolume: z.enum(['under_10k', '10k_50k', '50k_250k', '250k_1m', 'over_1m']).optional(),
});

// Get merchant profile
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
      include: {
        settings: true,
        _count: {
          select: {
            payments: true,
          },
        },
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant profile not found' },
        { status: 404 }
      );
    }

    // Calculate total volume (you might want to add date filters)
    const volumeStats = await prisma.payment.aggregate({
      where: {
        merchantId: merchant.id,
        status: 'completed',
      },
      _sum: {
        amount: true,
      },
    });

    return NextResponse.json({
      success: true,
      merchant: {
        id: merchant.id,
        businessName: merchant.businessName,
        businessType: merchant.businessType,
        businessDescription: merchant.businessDescription,
        businessAddress: merchant.businessAddress,
        contactInfo: merchant.contactInfo,
        taxId: merchant.taxId,
        expectedVolume: merchant.expectedVolume,
        status: merchant.status,
        kycStatus: merchant.kycStatus,
        createdAt: merchant.createdAt,
        updatedAt: merchant.updatedAt,
        settings: merchant.settings,
        stats: {
          totalPayments: merchant._count.payments,
          totalVolume: volumeStats._sum.amount || 0,
        },
      },
    });
  } catch (error) {
    console.error('Merchant profile fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch merchant profile' },
      { status: 500 }
    );
  }
}

// Update merchant profile
export async function PUT(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant profile not found' },
        { status: 404 }
      );
    }

    // Check if merchant can be updated (not during KYC review)
    if (merchant.kycStatus === 'under_review') {
      return NextResponse.json(
        { success: false, error: 'Profile cannot be updated during KYC review' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData = updateMerchantSchema.parse(body);

    // If critical information is updated, reset KYC status
    const criticalFields = ['businessName', 'businessAddress', 'taxId'];
    const shouldResetKyc = criticalFields.some(field => 
      updateData[field as keyof typeof updateData] !== undefined
    );

    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchant.id },
      data: {
        ...updateData,
        ...(shouldResetKyc && merchant.kycStatus === 'approved' ? {
          kycStatus: 'pending_review',
          status: 'pending_verification'
        } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      merchant: {
        id: updatedMerchant.id,
        businessName: updatedMerchant.businessName,
        businessType: updatedMerchant.businessType,
        businessDescription: updatedMerchant.businessDescription,
        businessAddress: updatedMerchant.businessAddress,
        contactInfo: updatedMerchant.contactInfo,
        taxId: updatedMerchant.taxId,
        expectedVolume: updatedMerchant.expectedVolume,
        status: updatedMerchant.status,
        kycStatus: updatedMerchant.kycStatus,
        createdAt: updatedMerchant.createdAt,
        updatedAt: updatedMerchant.updatedAt,
      },
      ...(shouldResetKyc ? {
        message: 'Profile updated. KYC re-verification may be required for critical changes.'
      } : {}),
    });
  } catch (error) {
    console.error('Merchant profile update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid update data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update merchant profile' },
      { status: 500 }
    );
  }
}