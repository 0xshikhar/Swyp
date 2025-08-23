import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cctpService } from '@/lib/cctp';
import { z } from 'zod';
import { ethers } from 'ethers';

const createPaymentSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/, 'Invalid amount format'),
  currency: z.enum(['USDC']),
  fromChain: z.enum(['ethereum', 'polygon', 'base']),
  toChain: z.enum(['ethereum', 'polygon', 'base']),
  recipient: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid recipient address'),
  description: z.string().max(500).optional(),
  metadata: z.record(z.string()).optional(),
  callbackUrl: z.string().url().optional(),
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

    // Check if user is an approved merchant
    const merchant = await prisma.merchant.findUnique({
      where: { userId: user.id },
      include: { settings: true },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant profile not found' },
        { status: 404 }
      );
    }

    if (merchant.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Merchant account is not active' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const paymentData = createPaymentSchema.parse(body);

    // Validate amount limits
    const amount = parseFloat(paymentData.amount);
    const settings = merchant.settings;
    
    if (settings?.limits) {
      if (settings.limits.singleTransactionLimit && amount > settings.limits.singleTransactionLimit) {
        return NextResponse.json(
          { success: false, error: 'Amount exceeds single transaction limit' },
          { status: 400 }
        );
      }

      // Check daily limit
      if (settings.limits.dailyLimit) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const dailyVolume = await prisma.payment.aggregate({
          where: {
            merchantId: merchant.id,
            createdAt: { gte: today },
            status: { in: ['pending', 'processing', 'completed'] },
          },
          _sum: { amount: true },
        });

        const currentDailyVolume = dailyVolume._sum.amount || 0;
        if (currentDailyVolume + amount > settings.limits.dailyLimit) {
          return NextResponse.json(
            { success: false, error: 'Amount exceeds daily limit' },
            { status: 400 }
          );
        }
      }
    }

    // Generate unique payment ID
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate fees
    const processingFee = settings?.feeStructure?.processingFee || 0.5; // 0.5%
    const fixedFee = settings?.feeStructure?.fixedFee || 0.30; // $0.30
    const feeAmount = (amount * processingFee / 100) + fixedFee;
    const netAmount = amount - feeAmount;

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        id: paymentId,
        merchantId: merchant.id,
        amount: amount,
        currency: paymentData.currency,
        fromChain: paymentData.fromChain,
        toChain: paymentData.toChain,
        recipient: paymentData.recipient,
        description: paymentData.description,
        metadata: paymentData.metadata || {},
        status: 'pending',
        feeAmount: feeAmount,
        netAmount: netAmount,
        callbackUrl: paymentData.callbackUrl,
      },
    });

    // Generate payment URL for customer
    const paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pay/${paymentId}`;

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        fromChain: payment.fromChain,
        toChain: payment.toChain,
        recipient: payment.recipient,
        description: payment.description,
        status: payment.status,
        feeAmount: payment.feeAmount,
        netAmount: payment.netAmount,
        paymentUrl: paymentUrl,
        createdAt: payment.createdAt,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });
  } catch (error) {
    console.error('Payment creation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create payment' },
      { status: 500 }
    );
  }
}

// Get payment details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }

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

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        merchantId: merchant.id,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        fromChain: payment.fromChain,
        toChain: payment.toChain,
        recipient: payment.recipient,
        description: payment.description,
        status: payment.status,
        feeAmount: payment.feeAmount,
        netAmount: payment.netAmount,
        transactionHash: payment.transactionHash,
        messageHash: payment.messageHash,
        attestationHash: payment.attestationHash,
        completedAt: payment.completedAt,
        createdAt: payment.createdAt,
        metadata: payment.metadata,
      },
    });
  } catch (error) {
    console.error('Payment fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment' },
      { status: 500 }
    );
  }
}