import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRazorpayPayment } from '@/lib/razorpay';
import { createDownloadToken } from '@/lib/download-token';

// POST /api/orders/verify - Verify payment and generate download token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing required payment details' }, { status: 400 });
    }

    // Verify the payment signature
    const isValid = verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      // Mark order as failed
      await db.order.update({
        where: { id: orderId },
        data: { status: 'failed' },
      });
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Update order status
    const order = await db.order.update({
      where: { id: orderId },
      data: {
        status: 'paid',
        razorpayPaymentId,
        razorpaySignature,
        watermarkText: 'Purchased from Vedant Academy',
      },
      include: { pdf: true },
    });

    // Increment sales count
    await db.pdf.update({
      where: { id: order.pdfId },
      data: { salesCount: { increment: 1 } },
    });

    // Generate download token
    const downloadToken = await createDownloadToken(orderId);

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      downloadToken,
      pdfTitle: order.pdf.title,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}
