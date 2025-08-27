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

    // Mock webhooks data
    const mockWebhooks = [
      {
        id: 'wh_1',
        url: 'https://api.example.com/webhooks/payments',
        events: ['payment.completed', 'payment.failed'],
        status: 'active',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        successRate: 98.5,
      },
      {
        id: 'wh_2',
        url: 'https://mystore.com/api/payment-notifications',
        events: ['payment.completed'],
        status: 'active',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        lastTriggered: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        successRate: 100,
      },
      {
        id: 'wh_3',
        url: 'https://analytics.example.com/webhooks',
        events: ['payment.completed', 'payment.failed', 'payment.pending'],
        status: 'inactive',
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastTriggered: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        successRate: 85.2,
      },
    ];

    return NextResponse.json({
      success: true,
      webhooks: mockWebhooks,
    });
  } catch (error) {
    console.error('Error fetching webhooks:', error);
    
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

    const body = await request.json();
    const { url, events } = body;

    if (!url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: 'Invalid webhook data' },
        { status: 400 }
      );
    }

    // Mock webhook creation
    const newWebhook = {
      id: `wh_${Date.now()}`,
      url,
      events,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastTriggered: null,
      successRate: 0,
    };

    return NextResponse.json({
      success: true,
      webhook: newWebhook,
    });
  } catch (error) {
    console.error('Error creating webhook:', error);
    
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