import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateMerchantSchema = z.object({
  businessName: z.string().min(2).max(100).optional(),
  category: z.string().optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  description: z.string().min(10).max(500).optional(),
  logo: z.string().url().optional(),
  preferredChainId: z.number().optional(),
  rebalanceThreshold: z.number().min(0).max(1000000).optional(),
  autoRebalance: z.boolean().optional(),
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

    const merchant = await prisma.merchant.findFirst({
      where: { userId: user.id },
      include: {
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

    // Calculate total volume from completed payments
    const volumeStats = await prisma.payment.aggregate({
      where: {
        merchantId: merchant.id,
        status: 'COMPLETED',
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
        category: merchant.category,
        website: merchant.website,
        email: merchant.email,
        description: merchant.description,
        logo: merchant.logo,
        status: merchant.status,
        verificationDate: merchant.verificationDate,
        riskScore: merchant.riskScore,
        preferredChainId: merchant.preferredChainId,
        rebalanceThreshold: merchant.rebalanceThreshold,
        autoRebalance: merchant.autoRebalance,
        totalTransactions: merchant.totalTransactions,
        totalVolume: merchant.totalVolume,
        createdAt: merchant.createdAt,
        updatedAt: merchant.updatedAt,
        stats: {
          totalPayments: merchant._count.payments,
          calculatedVolume: volumeStats._sum.amount || 0,
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

    const merchant = await prisma.merchant.findFirst({
      where: { userId: user.id },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updateData = updateMerchantSchema.parse(body);

    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchant.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      merchant: {
        id: updatedMerchant.id,
        businessName: updatedMerchant.businessName,
        category: updatedMerchant.category,
        website: updatedMerchant.website,
        email: updatedMerchant.email,
        description: updatedMerchant.description,
        logo: updatedMerchant.logo,
        status: updatedMerchant.status,
        verificationDate: updatedMerchant.verificationDate,
        riskScore: updatedMerchant.riskScore,
        preferredChainId: updatedMerchant.preferredChainId,
        rebalanceThreshold: updatedMerchant.rebalanceThreshold,
        autoRebalance: updatedMerchant.autoRebalance,
        totalTransactions: updatedMerchant.totalTransactions,
        totalVolume: updatedMerchant.totalVolume,
        createdAt: updatedMerchant.createdAt,
        updatedAt: updatedMerchant.updatedAt,
      },
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