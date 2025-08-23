import { NextRequest, NextResponse } from 'next/server';
import { generateNonce } from 'siwe';
import { storeNonce } from '@/lib/auth';
import { z } from 'zod';

const nonceRequestSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address } = nonceRequestSchema.parse(body);

    // Generate a new nonce
    const nonce = generateNonce();
    
    // Store the nonce temporarily
    storeNonce(address, nonce);

    return NextResponse.json({
      success: true,
      nonce,
      message: `Welcome to Swyp!\n\nPlease sign this message to authenticate your wallet.\n\nWallet: ${address}\nNonce: ${nonce}\nTimestamp: ${new Date().toISOString()}`,
    });
  } catch (error) {
    console.error('Nonce generation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate nonce',
      },
      { status: 500 }
    );
  }
}