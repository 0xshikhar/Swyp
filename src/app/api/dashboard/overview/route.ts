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

    // Mock dashboard overview data
    const mockOverview = {
      stats: {
        totalRevenue: '125,430.50',
        totalTransactions: 1247,
        pendingPayments: 23,
        successRate: 98.5,
      },
      recentPayments: [
        {
          id: 'pay_1',
          amount: '250.00',
          currency: 'USDC',
          status: 'completed',
          customer: '0x742d...4B73',
          chain: 'Ethereum',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          txHash: '0x1234567890abcdef1234567890abcdef12345678',
        },
        {
          id: 'pay_2',
          amount: '99.99',
          currency: 'USDC',
          status: 'completed',
          customer: '0x8B5A...9C2D',
          chain: 'Polygon',
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          txHash: '0xabcdef1234567890abcdef1234567890abcdef12',
        },
        {
          id: 'pay_3',
          amount: '500.00',
          currency: 'USDC',
          status: 'pending',
          customer: '0x3F7E...8A1B',
          chain: 'Base',
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          txHash: null,
        },
        {
          id: 'pay_4',
          amount: '75.50',
          currency: 'USDC',
          status: 'completed',
          customer: '0x9D2C...5E8F',
          chain: 'Ethereum',
          createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
          txHash: '0xfedcba0987654321fedcba0987654321fedcba09',
        },
        {
          id: 'pay_5',
          amount: '1200.00',
          currency: 'USDC',
          status: 'completed',
          customer: '0x6A4B...2F9E',
          chain: 'Base',
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          txHash: '0x567890abcdef1234567890abcdef1234567890ab',
        },
      ],
      balances: [
        { chain: 'Ethereum', balance: '45,230.50', pending: '1,250.00' },
        { chain: 'Polygon', balance: '38,920.25', pending: '890.75' },
        { chain: 'Base', balance: '41,279.75', pending: '2,100.00' },
      ],
      chartData: [
        { date: '2024-01-01', revenue: 12500 },
        { date: '2024-01-02', revenue: 15200 },
        { date: '2024-01-03', revenue: 18900 },
        { date: '2024-01-04', revenue: 14300 },
        { date: '2024-01-05', revenue: 16800 },
        { date: '2024-01-06', revenue: 19200 },
        { date: '2024-01-07', revenue: 21500 },
      ],
    };

    return NextResponse.json({
      success: true,
      overview: mockOverview,
    });
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    
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