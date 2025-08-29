import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('USDC'),
  chainId: z.number().default(1),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  customerAddress: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
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

    // Get user's merchant account
    const merchant = await prisma.merchant.findFirst({
      where: { userId: user.id },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant account not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const paymentData = createPaymentSchema.parse(body);

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        paymentId: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        customerId: user.id,
        merchantId: merchant.id,
        amount: paymentData.amount,
        currency: paymentData.currency,
        sourceChainId: paymentData.chainId,
        destinationChainId: paymentData.chainId,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        chainId: payment.chainId,
        description: payment.description,
        status: payment.status,
        createdAt: payment.createdAt,
        expiresAt: payment.expiresAt,
        metadata: payment.metadata,
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

// Get payments for merchant
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's merchant account
    const merchant = await prisma.merchant.findFirst({
      where: { userId: user.id },
    });

    if (!merchant) {
      return NextResponse.json(
        { success: false, error: 'Merchant account not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const where: any = { merchantId: merchant.id };
    if (status) {
      where.status = status;
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const total = await prisma.payment.count({ where });

    return NextResponse.json({
      success: true,
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Payments fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}