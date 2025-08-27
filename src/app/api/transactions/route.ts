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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const chain = searchParams.get('chain');

    // Mock transactions data
    const mockTransactions = [
      {
        id: 'tx_1',
        paymentId: 'pay_1',
        amount: '250.00',
        currency: 'USDC',
        status: 'completed',
        customer: '0x742d35Cc6C4C0532E3a6740ba22607d1b4B73',
        customerEmail: 'customer@example.com',
        chain: 'Ethereum',
        txHash: '0x1234567890abcdef1234567890abcdef12345678',
        blockNumber: 18500000,
        gasUsed: '21000',
        gasFee: '0.005',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
        description: 'Product purchase - Premium Plan',
        metadata: {
          orderId: 'order_123',
          productId: 'prod_456',
        },
      },
      {
        id: 'tx_2',
        paymentId: 'pay_2',
        amount: '99.99',
        currency: 'USDC',
        status: 'completed',
        customer: '0x8B5A9C2D4E6F8A1B3C5D7E9F1A2B4C6D8E0F2A4B',
        customerEmail: 'user@test.com',
        chain: 'Polygon',
        txHash: '0xabcdef1234567890abcdef1234567890abcdef12',
        blockNumber: 48500000,
        gasUsed: '21000',
        gasFee: '0.001',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 3 * 60 * 1000).toISOString(),
        description: 'Service subscription',
        metadata: {
          subscriptionId: 'sub_789',
        },
      },
      {
        id: 'tx_3',
        paymentId: 'pay_3',
        amount: '500.00',
        currency: 'USDC',
        status: 'pending',
        customer: '0x3F7E8A1B5C9D2E6F0A3B7C1D4E8F2A5B9C0D3E7F',
        customerEmail: 'buyer@shop.com',
        chain: 'Base',
        txHash: null,
        blockNumber: null,
        gasUsed: null,
        gasFee: null,
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        completedAt: null,
        description: 'Large order payment',
        metadata: {
          orderId: 'order_456',
          items: ['item1', 'item2', 'item3'],
        },
      },
      {
        id: 'tx_4',
        paymentId: 'pay_4',
        amount: '75.50',
        currency: 'USDC',
        status: 'completed',
        customer: '0x9D2C5E8F1A4B7C0D3E6F9A2B5C8D1E4F7A0B3C6D',
        customerEmail: 'client@business.com',
        chain: 'Ethereum',
        txHash: '0xfedcba0987654321fedcba0987654321fedcba09',
        blockNumber: 18500100,
        gasUsed: '21000',
        gasFee: '0.004',
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 8 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(),
        description: 'Consulting service payment',
        metadata: {
          serviceId: 'svc_123',
          hours: 5,
        },
      },
      {
        id: 'tx_5',
        paymentId: 'pay_5',
        amount: '1200.00',
        currency: 'USDC',
        status: 'completed',
        customer: '0x6A4B2F9E5C8D1A7B0E3F6C9A2D5E8F1B4A7C0D3E',
        customerEmail: 'enterprise@corp.com',
        chain: 'Base',
        txHash: '0x567890abcdef1234567890abcdef1234567890ab',
        blockNumber: 8500000,
        gasUsed: '21000',
        gasFee: '0.002',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(),
        description: 'Enterprise license',
        metadata: {
          licenseType: 'enterprise',
          duration: '1year',
        },
      },
      {
        id: 'tx_6',
        paymentId: 'pay_6',
        amount: '45.00',
        currency: 'USDC',
        status: 'failed',
        customer: '0x1E4F7A0B3C6D9E2F5A8B1C4D7E0F3A6B9C2D5E8F',
        customerEmail: 'failed@payment.com',
        chain: 'Polygon',
        txHash: null,
        blockNumber: null,
        gasUsed: null,
        gasFee: null,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        completedAt: null,
        description: 'Monthly subscription',
        metadata: {
          subscriptionId: 'sub_failed',
          reason: 'Insufficient balance',
        },
      },
    ];

    // Filter transactions based on query parameters
    let filteredTransactions = mockTransactions;
    
    if (status) {
      filteredTransactions = filteredTransactions.filter(tx => tx.status === status);
    }
    
    if (chain) {
      filteredTransactions = filteredTransactions.filter(tx => tx.chain.toLowerCase() === chain.toLowerCase());
    }

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      transactions: paginatedTransactions,
      pagination: {
        page,
        limit,
        total: filteredTransactions.length,
        totalPages: Math.ceil(filteredTransactions.length / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    
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