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

    // Mock analytics data
    const mockAnalytics = {
      overview: {
        totalRevenue: '125,430.50',
        totalTransactions: 1247,
        averageTransaction: '100.58',
        successRate: 98.5,
      },
      revenueData: [
        { date: '2024-01-01', revenue: 12500 },
        { date: '2024-01-02', revenue: 15200 },
        { date: '2024-01-03', revenue: 18900 },
        { date: '2024-01-04', revenue: 14300 },
        { date: '2024-01-05', revenue: 16800 },
        { date: '2024-01-06', revenue: 19200 },
        { date: '2024-01-07', revenue: 21500 },
      ],
      chainDistribution: [
        { chain: 'Ethereum', volume: 45230.50, percentage: 36.1, transactions: 450 },
        { chain: 'Polygon', volume: 38920.25, percentage: 31.0, transactions: 520 },
        { chain: 'Base', volume: 41279.75, percentage: 32.9, transactions: 277 },
      ],
      paymentMethods: [
        { method: 'Wallet Connect', volume: 52430.25, percentage: 41.8 },
        { method: 'MetaMask', volume: 38920.50, percentage: 31.0 },
        { method: 'Coinbase Wallet', volume: 34079.75, percentage: 27.2 },
      ],
      hourlyDistribution: [
        { hour: '00:00', transactions: 12 },
        { hour: '01:00', transactions: 8 },
        { hour: '02:00', transactions: 5 },
        { hour: '03:00', transactions: 3 },
        { hour: '04:00', transactions: 4 },
        { hour: '05:00', transactions: 7 },
        { hour: '06:00', transactions: 15 },
        { hour: '07:00', transactions: 25 },
        { hour: '08:00', transactions: 35 },
        { hour: '09:00', transactions: 45 },
        { hour: '10:00', transactions: 52 },
        { hour: '11:00', transactions: 48 },
        { hour: '12:00', transactions: 55 },
        { hour: '13:00', transactions: 58 },
        { hour: '14:00', transactions: 62 },
        { hour: '15:00', transactions: 59 },
        { hour: '16:00', transactions: 54 },
        { hour: '17:00', transactions: 48 },
        { hour: '18:00', transactions: 42 },
        { hour: '19:00', transactions: 38 },
        { hour: '20:00', transactions: 32 },
        { hour: '21:00', transactions: 28 },
        { hour: '22:00', transactions: 22 },
        { hour: '23:00', transactions: 18 },
      ],
    };

    return NextResponse.json({
      success: true,
      analytics: mockAnalytics,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    
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