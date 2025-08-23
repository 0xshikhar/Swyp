import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cctpService } from '@/lib/cctp';
import { z } from 'zod';
import { ethers } from 'ethers';

const processPaymentSchema = z.object({
  paymentId: z.string(),
  signature: z.string(),
  senderAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid sender address'),
  transactionHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, signature, senderAddress, transactionHash } = processPaymentSchema.parse(body);

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        merchant: {
          include: { settings: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Payment is not in pending status' },
        { status: 400 }
      );
    }

    // Check if payment has expired (24 hours)
    const expirationTime = new Date(payment.createdAt.getTime() + 24 * 60 * 60 * 1000);
    if (new Date() > expirationTime) {
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: 'expired' },
      });
      
      return NextResponse.json(
        { success: false, error: 'Payment has expired' },
        { status: 400 }
      );
    }

    // Verify the transaction on the source chain
    const provider = new ethers.JsonRpcProvider(
      payment.fromChain === 'ethereum' ? process.env.ETHEREUM_RPC_URL :
      payment.fromChain === 'polygon' ? process.env.POLYGON_RPC_URL :
      process.env.BASE_RPC_URL
    );

    let txReceipt;
    try {
      txReceipt = await provider.getTransactionReceipt(transactionHash);
      if (!txReceipt) {
        return NextResponse.json(
          { success: false, error: 'Transaction not found or not confirmed' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to verify transaction' },
        { status: 400 }
      );
    }

    // Verify transaction was successful
    if (txReceipt.status !== 1) {
      return NextResponse.json(
        { success: false, error: 'Transaction failed on blockchain' },
        { status: 400 }
      );
    }

    // Update payment status to processing
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'processing',
        transactionHash: transactionHash,
        senderAddress: senderAddress,
      },
    });

    // If it's a cross-chain payment, initiate CCTP transfer
    if (payment.fromChain !== payment.toChain) {
      try {
        // Extract message hash from the transaction (this would be done by monitoring the transaction)
        // For now, we'll simulate this process
        const messageHash = ethers.keccak256(ethers.toUtf8Bytes(`${transactionHash}_${Date.now()}`));
        
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            messageHash: messageHash,
          },
        });

        // Start monitoring for attestation
        // In a real implementation, this would be handled by a background job
        setTimeout(async () => {
          await monitorAttestation(paymentId, messageHash);
        }, 5000);

      } catch (error) {
        console.error('CCTP transfer initiation failed:', error);
        
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'failed',
            failureReason: 'CCTP transfer initiation failed',
          },
        });

        return NextResponse.json(
          { success: false, error: 'Cross-chain transfer failed' },
          { status: 500 }
        );
      }
    } else {
      // Same-chain payment, mark as completed
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'completed',
          completedAt: new Date(),
        },
      });

      // Send webhook notification
      if (payment.merchant.settings?.webhookUrl) {
        await sendWebhook(payment.merchant.settings.webhookUrl, {
          event: 'payment.completed',
          paymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: 'completed',
          transactionHash: transactionHash,
          completedAt: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: payment.fromChain !== payment.toChain 
        ? 'Cross-chain transfer initiated. Please wait for attestation.'
        : 'Payment completed successfully',
      payment: {
        id: payment.id,
        status: payment.fromChain !== payment.toChain ? 'processing' : 'completed',
        transactionHash: transactionHash,
      },
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    
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
      { success: false, error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}

// Helper function to monitor attestation (would be in a separate service in production)
async function monitorAttestation(paymentId: string, messageHash: string) {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    let attempts = 0;

    const checkAttestation = async () => {
      try {
        const attestation = await cctpService.getAttestation(messageHash);
        
        if (attestation) {
          // Update payment with attestation
          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              attestationHash: attestation,
              status: 'completed',
              completedAt: new Date(),
            },
          });

          // Get payment details for webhook
          const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
              merchant: {
                include: { settings: true },
              },
            },
          });

          // Send webhook notification
          if (payment?.merchant.settings?.webhookUrl) {
            await sendWebhook(payment.merchant.settings.webhookUrl, {
              event: 'payment.completed',
              paymentId: payment.id,
              amount: payment.amount,
              currency: payment.currency,
              status: 'completed',
              transactionHash: payment.transactionHash,
              messageHash: payment.messageHash,
              attestationHash: attestation,
              completedAt: payment.completedAt?.toISOString(),
            });
          }

          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkAttestation, 5000); // Check again in 5 seconds
        } else {
          // Mark as failed after max attempts
          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: 'failed',
              failureReason: 'Attestation timeout',
            },
          });
        }
      } catch (error) {
        console.error('Attestation monitoring error:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkAttestation, 5000);
        }
      }
    };

    checkAttestation();
}

// Helper function to send webhook notifications
async function sendWebhook(webhookUrl: string, payload: any) {
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Swyp-Webhook/1.0',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Webhook delivery failed:', error);
    }
}