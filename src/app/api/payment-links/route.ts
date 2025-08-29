import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getAuthenticatedUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // Decode the Privy JWT token to get user information
    const decoded = jwt.decode(token) as any;
    
    if (!decoded || (!decoded.sub && !decoded.userId)) {
      return null;
    }
    
    const userId = decoded.sub || decoded.userId;
    
    if (!userId) {
      return null;
    }

    // Find user in database or create if doesn't exist
    let user = await prisma.user.findFirst({
      where: { 
        OR: [
          { id: userId },
          { walletAddress: userId }
        ]
      }
    });
    
    // If user doesn't exist, create a basic user record
    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            id: userId,
            walletAddress: userId,
          },
        });
      } catch (createError) {
        console.error('Error creating user:', createError);
        return null;
      }
    }

    return user;
  } catch (error) {
    console.error('Token parsing error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate the request
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's merchant account
    const merchant = await prisma.merchant.findFirst({
      where: { userId: user.id },
    });

    if (!merchant) {
      return NextResponse.json(
        { error: 'Merchant account not found' },
        { status: 404 }
      );
    }

    console.log('GET /api/payment-links - Fetching payment links for merchant:', merchant.id);

    // Fetch payment links from database
    const paymentLinks = await (prisma as any).paymentLink.findMany({
      where: {
        merchantId: merchant.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log('GET /api/payment-links - Found payment links:', paymentLinks.length);

    // Format response data
    const formattedLinks = paymentLinks.map((link: any) => ({
      id: link.id,
      amount: parseFloat(link.amount.toString()),
      description: link.description,
      chainId: link.chainId,
      currency: link.currency,
      status: link.isActive ? (link.expiresAt && new Date(link.expiresAt) < new Date() ? 'expired' : 'active') : 'inactive',
      createdAt: link.createdAt.toISOString(),
      expiresAt: link.expiresAt?.toISOString() || null,
      usageCount: link.usageCount,
      maxUsage: link.maxUsage,
      isActive: link.isActive,
      metadata: link.metadata || {},
    }));

    return NextResponse.json({
      success: true,
      data: formattedLinks,
    });
  } catch (error) {
    console.error('Error fetching payment links:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/payment-links - Starting request processing');
    
    // Authenticate the request
    const user = await getAuthenticatedUser(request);
    if (!user) {
      console.log('POST /api/payment-links - Authentication failed');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('POST /api/payment-links - User authenticated:', user.id);

    // Get merchant from database or create if doesn't exist
    let merchant = await prisma.merchant.findFirst({
      where: { userId: user.id },
    });

    if (!merchant) {
      console.log('POST /api/payment-links - No merchant found, creating one');
      // Create a basic merchant record for the user
      try {
        merchant = await prisma.merchant.create({
           data: {
             userId: user.id,
             businessName: user.username || 'My Business',
             category: 'general',
             status: 'ACTIVE',
           },
         });
        console.log('POST /api/payment-links - Merchant created:', merchant.id);
      } catch (createError) {
        console.error('POST /api/payment-links - Error creating merchant:', createError);
        return NextResponse.json(
          { error: 'Failed to create merchant profile' },
          { status: 500 }
        );
      }
    }

    console.log('POST /api/payment-links - Using merchant:', merchant.id);

    // Parse request body
    const body = await request.json();
    const { amount, description, chainId, expiresAt, maxUsage } = body;

    // Validate required fields
    if (!amount || !description || !chainId) {
      return NextResponse.json(
        { error: 'Missing required fields: amount, description, chainId' },
        { status: 400 }
      );
    }

    // Validate amount is a positive number
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    console.log('POST /api/payment-links - Creating payment link with data:', {
      merchantId: merchant.id,
      amount: numericAmount,
      description,
      chainId: parseInt(chainId),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      maxUsage: maxUsage ? parseInt(maxUsage) : null,
    });

    // Create the payment link in database
    const paymentLink = await (prisma as any).paymentLink.create({
      data: {
        merchantId: merchant.id,
        amount: numericAmount,
        description,
        chainId: parseInt(chainId),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        maxUsage: maxUsage ? parseInt(maxUsage) : null,
      },
    });

    console.log('POST /api/payment-links - Payment link created:', paymentLink.id);

    // Format response
    const responseData = {
      id: paymentLink.id,
      amount: paymentLink.amount.toString(),
      currency: paymentLink.currency,
      description: paymentLink.description,
      chainId: paymentLink.chainId,
      expiresAt: paymentLink.expiresAt?.toISOString() || null,
      maxUsage: paymentLink.maxUsage,
      isActive: paymentLink.isActive,
      usageCount: 0,
      createdAt: paymentLink.createdAt.toISOString(),
      updatedAt: paymentLink.updatedAt.toISOString(),
      url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/${paymentLink.id}`,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error creating payment link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}