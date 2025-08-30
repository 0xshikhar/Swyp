import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const merchantRegistrationSchema = z.object({
  businessName: z.string().min(2).max(100),
  category: z.string().min(2).max(50),
  website: z.string().url().optional(),
  email: z.string().email(),
  description: z.string().min(10).max(500),
  logo: z.string().url().optional(),
  preferredChainId: z.number().default(1), // Default to Ethereum mainnet
  rebalanceThreshold: z.number().min(0).max(1000000).default(10000), // Default $10k threshold
  autoRebalance: z.boolean().default(true),
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

    // Check if merchant already exists for this user
    const existingMerchant = await prisma.merchant.findFirst({
      where: { userId: user.id },
    });

    if (existingMerchant) {
      return NextResponse.json(
        {
          success: false,
          error: 'Merchant profile already exists for this user',
        },
        { status: 409 }
      );
    }

    const body = await request.json();
    const merchantData = merchantRegistrationSchema.parse(body);

    // Create new merchant
    const merchant = await prisma.merchant.create({
      data: {
        userId: user.id,
        businessName: merchantData.businessName,
        category: merchantData.category,
        website: merchantData.website,
        email: merchantData.email,
        description: merchantData.description,
        logo: merchantData.logo,
        status: 'ACTIVE',
        preferredChainId: merchantData.preferredChainId,
        rebalanceThreshold: merchantData.rebalanceThreshold,
        autoRebalance: merchantData.autoRebalance,
        riskScore: 0.5, // Default medium risk score
        totalTransactions: 0,
        totalVolume: 0,
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
        preferredChainId: merchant.preferredChainId,
        rebalanceThreshold: merchant.rebalanceThreshold,
        autoRebalance: merchant.autoRebalance,
        createdAt: merchant.createdAt,
      },
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
      { success: false, error: 'Failed to register merchant' },
      { status: 500 }
    );
  }
}