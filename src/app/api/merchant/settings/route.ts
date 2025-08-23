import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  paymentMethods: z.array(z.enum(['usdc', 'usdt', 'eth'])).optional(),
  autoSettle: z.boolean().optional(),
  settlementDelay: z.number().min(1).max(168).optional(), // 1 hour to 1 week
  webhookUrl: z.string().url().nullable().optional(),
  webhookSecret: z.string().min(32).max(128).optional(),
  notificationPreferences: z.object({
    email: z.boolean(),
    sms: z.boolean(),
    webhook: z.boolean(),
  }).optional(),
  feeStructure: z.object({
    processingFee: z.number().min(0).max(10), // percentage
    fixedFee: z.number().min(0).max(100), // in USD
  }).optional(),
  limits: z.object({
    dailyLimit: z.number().min(0).optional(),
    monthlyLimit: z.number().min(0).optional(),
    singleTransactionLimit: z.number().min(0).optional(),
  }).optional(),
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

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
      include: {
        settings: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant profile not found' },
        { status: 404 }
      );
    }

    if (!merchant.settings) {
      return NextResponse.json(
        { success: false, error: 'Merchant settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      settings: {
        id: merchant.settings.id,
        paymentMethods: merchant.settings.paymentMethods,
        autoSettle: merchant.settings.autoSettle,
        settlementDelay: merchant.settings.settlementDelay,
        webhookUrl: merchant.settings.webhookUrl,
        webhookSecret: merchant.settings.webhookSecret ? '***masked***' : null,
        notificationPreferences: merchant.settings.notificationPreferences,
        feeStructure: merchant.settings.feeStructure,
        limits: merchant.settings.limits,
        createdAt: merchant.settings.createdAt,
        updatedAt: merchant.settings.updatedAt,
      },
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

    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
      include: {
        settings: true,
      },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant profile not found' },
        { status: 404 }
      );
    }

    // Check if merchant is approved to change settings
    if (merchant.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Merchant must be approved to modify settings' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData = updateSettingsSchema.parse(body);

    // Validate webhook URL if provided
    if (updateData.webhookUrl) {
      try {
        new URL(updateData.webhookUrl);
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid webhook URL format' },
          { status: 400 }
        );
      }
    }

    // Update settings
    const updatedSettings = await prisma.merchantSettings.update({
      where: { merchantId: merchant.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      settings: {
        id: updatedSettings.id,
        paymentMethods: updatedSettings.paymentMethods,
        autoSettle: updatedSettings.autoSettle,
        settlementDelay: updatedSettings.settlementDelay,
        webhookUrl: updatedSettings.webhookUrl,
        webhookSecret: updatedSettings.webhookSecret ? '***masked***' : null,
        notificationPreferences: updatedSettings.notificationPreferences,
        feeStructure: updatedSettings.feeStructure,
        limits: updatedSettings.limits,
        createdAt: updatedSettings.createdAt,
        updatedAt: updatedSettings.updatedAt,
      },
      message: 'Settings updated successfully',
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
      { success: false, error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// Test webhook endpoint
export async function POST(request: NextRequest) {
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
      },
    });

    if (!merchant?.settings?.webhookUrl) {
      return NextResponse.json(
        { success: false, error: 'No webhook URL configured' },
        { status: 400 }
      );
    }

    // Send test webhook
    const testPayload = {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      merchantId: merchant.id,
      data: {
        message: 'This is a test webhook from Swyp',
      },
    };

    try {
      const response = await fetch(merchant.settings.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Swyp-Webhook/1.0',
          ...(merchant.settings.webhookSecret && {
            'X-Swyp-Signature': `sha256=${merchant.settings.webhookSecret}`,
          }),
        },
        body: JSON.stringify(testPayload),
      });

      return NextResponse.json({
        success: true,
        message: 'Test webhook sent successfully',
        response: {
          status: response.status,
          statusText: response.statusText,
        },
      });
    } catch (webhookError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send test webhook',
          details: webhookError instanceof Error ? webhookError.message : 'Unknown error',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Webhook test error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to test webhook' },
      { status: 500 }
    );
  }
}