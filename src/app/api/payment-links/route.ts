import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret) as any;
    const userId = decoded.userId || decoded.sub;

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token payload' },
        { status: 401 }
      );
    }

    // Get user's merchant account
    const merchant = await prisma.merchant.findFirst({
      where: { userId },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant account not found' },
        { status: 404 }
      );
    }

    // Mock payment links data for now
    const mockPaymentLinks = [
      {
        id: 'pl_1',
        title: 'Product Purchase',
        amount: '99.99',
        currency: 'USDC',
        status: 'active',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        usageCount: 5,
        maxUsage: 100,
      },
      {
        id: 'pl_2',
        title: 'Service Payment',
        amount: '250.00',
        currency: 'USDC',
        status: 'active',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
        usageCount: 12,
        maxUsage: 50,
      },
    ];

    return NextResponse.json({
      success: true,
      paymentLinks: mockPaymentLinks,
    });
  } catch (error) {
    console.error('Error fetching payment links:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret) as any;
    const userId = decoded.userId || decoded.sub;

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid token payload' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, amount, currency = 'USDC', expiresAt, maxUsage } = body;

    // Validate required fields
    if (!title || !amount) {
      return NextResponse.json(
        { error: 'Title and amount are required' },
        { status: 400 }
      );
    }

    // Get user's merchant account
    const merchant = await prisma.merchant.findFirst({
      where: { userId },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant account not found' },
        { status: 404 }
      );
    }

    // Generate a new payment link ID
    const paymentLinkId = `pl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Mock creating payment link (in real implementation, save to database)
    const newPaymentLink = {
      id: paymentLinkId,
      title,
      amount,
      currency,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usageCount: 0,
      maxUsage: maxUsage || null,
      merchantId: merchant.id,
    };

    return NextResponse.json({
      success: true,
      paymentLink: newPaymentLink,
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}