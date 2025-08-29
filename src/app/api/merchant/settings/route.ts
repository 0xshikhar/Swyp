import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const merchantSettingsSchema = z.object({
  preferredChainId: z.number().optional(),
  rebalanceThreshold: z.number().min(0).max(1000000).optional(),
  autoRebalance: z.boolean().optional(),
  website: z.string().url().optional(),
  email: z.string().email().optional(),
  description: z.string().min(10).max(500).optional(),
  logo: z.string().url().optional(),
});

// Get merchant settings
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
      select: {
        id: true,
        preferredChainId: true,
        rebalanceThreshold: true,
        autoRebalance: true,
        website: true,
        email: true,
        description: true,
        logo: true,
        businessName: true,
        category: true,
        status: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: merchant,
    });
  } catch (error) {
    console.error('Merchant settings fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch merchant settings' },
      { status: 500 }
    );
  }
}

// Update merchant settings
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
    const settingsData = merchantSettingsSchema.parse(body);

    const updatedMerchant = await prisma.merchant.update({
      where: { id: merchant.id },
      data: settingsData,
    });

    return NextResponse.json({
      success: true,
      settings: {
        id: updatedMerchant.id,
        preferredChainId: updatedMerchant.preferredChainId,
        rebalanceThreshold: updatedMerchant.rebalanceThreshold,
        autoRebalance: updatedMerchant.autoRebalance,
        website: updatedMerchant.website,
        email: updatedMerchant.email,
        description: updatedMerchant.description,
        logo: updatedMerchant.logo,
        businessName: updatedMerchant.businessName,
        category: updatedMerchant.category,
        status: updatedMerchant.status,
        updatedAt: updatedMerchant.updatedAt,
      },
    });
  } catch (error) {
    console.error('Merchant settings update error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid settings data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update merchant settings' },
      { status: 500 }
    );
  }
}