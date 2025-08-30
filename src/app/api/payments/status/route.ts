import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cctpService } from '@/lib/cctp';
import { z } from 'zod';

const statusRequestSchema = z.object({
  paymentId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        merchant: {
          select: {
            businessName: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // If payment is processing and has a message hash, check CCTP status
    let cctpStatus = null;
    if (payment.status === 'PROCESSING' && payment.cctpMessageHash && payment.sourceChainId !== payment.destinationChainId) {
      try {
        // Note: cctpService expects string chain names, need to map chainId to chain name
        const chainMap: Record<number, 'ethereum' | 'polygon' | 'base'> = { 1: 'ethereum', 137: 'polygon', 8453: 'base' };
        const chainName = chainMap[payment.destinationChainId] || 'ethereum';
        cctpStatus = await cctpService.getTransferStatus(payment.cctpMessageHash, chainName);

        // Update payment status if CCTP status has changed
        if (cctpStatus === 'completed' && payment.status === 'PROCESSING') {
          await prisma.payment.update({
            where: { id: paymentId },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
            },
          });

          // Refresh payment data
          const updatedPayment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
              merchant: {
                select: {
                  businessName: true,
                  status: true,
                },
              },
            },
          });

          if (updatedPayment) {
            Object.assign(payment, updatedPayment);
          }
        }
      } catch (error) {
        console.error('Failed to check CCTP status:', error);
      }
    }

    // Calculate progress percentage
    let progressPercentage = 0;
    switch (payment.status) {
      case 'PENDING':
        progressPercentage = 10;
        break;
      case 'PROCESSING':
        progressPercentage = payment.sourceChainId !== payment.destinationChainId ? 50 : 90;
        break;
      case 'COMPLETED':
        progressPercentage = 100;
        break;
      case 'FAILED':
        // EXPIRED status doesn't exist in schema, removing
        break;
    }

    // Determine estimated completion time
    let estimatedCompletion = null;
    if (payment.status === 'PROCESSING') {
      const processingTime = payment.sourceChainId !== payment.destinationChainId ? 15 : 2; // minutes
      estimatedCompletion = new Date(Date.now() + processingTime * 60 * 1000);
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        sourceChainId: payment.sourceChainId,
        destinationChainId: payment.destinationChainId,
        // Transaction details
        platformFee: payment.platformFee,
        sourceTxHash: payment.sourceTxHash,
        destinationTxHash: payment.destinationTxHash,
        cctpMessageHash: payment.cctpMessageHash,
        failureReason: payment.failureReason,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
        estimatedCompletion,
        merchant: {
          businessName: payment.merchant.businessName,
          status: payment.merchant.status,
        },
        // metadata field doesn't exist in schema
        cctpStatus,
      },
    });
  } catch (error) {
    console.error('Payment status fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment status' },
      { status: 500 }
    );
  }
}

// Update payment status (for internal use or webhooks)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, status, transactionHash, messageHash, attestationHash, failureReason } = body;

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'FAILED', 'REFUNDED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (status) updateData.status = status;
    if (transactionHash) updateData.transactionHash = transactionHash;
    if (messageHash) updateData.messageHash = messageHash;
    if (attestationHash) updateData.attestationHash = attestationHash;
    if (failureReason) updateData.failureReason = failureReason;

    // Set completion time if status is completed
    if (status === 'COMPLETED' && !payment.completedAt) {
      updateData.completedAt = new Date();
    }

    // Update payment
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        sourceTxHash: updatedPayment.sourceTxHash,
        destinationTxHash: updatedPayment.destinationTxHash,
        cctpMessageHash: updatedPayment.cctpMessageHash,
        completedAt: updatedPayment.completedAt,
        updatedAt: updatedPayment.updatedAt,
      },
    });
  } catch (error) {
    console.error('Payment status update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}