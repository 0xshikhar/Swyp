import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Decode the Privy JWT token to get user information
    const decoded = jwt.decode(token) as any;
    
    if (!decoded || (!decoded.sub && !decoded.userId)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const userId = decoded.sub || decoded.userId;
      
    if (!userId) {
      return NextResponse.json(
        { error: 'Token missing user ID' },
        { status: 401 }
      );
    }

    // Get user profile from database or create if doesn't exist
    let user = await prisma.user.findFirst({
      where: { 
        OR: [
          { id: userId },
          { walletAddress: userId }
        ]
      },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        avatar: true,
        bio: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
    
    // If user doesn't exist, create a basic user record
    if (!user) {
      try {
        user = await prisma.user.create({
          data: {
            id: userId,
            walletAddress: userId,
          },
          select: {
            id: true,
            walletAddress: true,
            username: true,
            avatar: true,
            bio: true,
            createdAt: true,
            lastLoginAt: true,
          },
        });
      } catch (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: 'Failed to create user profile' },
          { status: 500 }
        );
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header missing or invalid' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as any;
    
    if (!decoded || (!decoded.sub && !decoded.userId)) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    const userId = decoded.sub || decoded.userId;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, avatar, bio } = body;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        avatar,
        bio,
        lastLoginAt: new Date(),
      },
      select: {
        id: true,
        walletAddress: true,
        username: true,
        avatar: true,
        bio: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}