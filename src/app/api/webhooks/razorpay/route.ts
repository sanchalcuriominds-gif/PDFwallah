import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { createDownloadToken } from '@/lib/download-token';

// POST /api/webhooks/razorpay - Handle Razorpay webhook events
// This handles async payment events like payment.captured when the user
// closes the browser before the client-side verification completes.
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    try {
      if (!crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(signature, 'hex')
      )) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    console.log(`Razorpay webhook received: ${eventType}`);

    // Handle payment.captured event
    if (eventType === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;
      const razorpayPaymentId = payment.id;

      if (!razorpayOrderId) {
        return NextResponse.json({ received: true });
      }

      // Find the order by Razorpay order ID
      const order = await db.order.findFirst({
        where: { razorpayOrderId },
        include: { pdf: true },
      });

      if (!order) {
        console.warn(`Webhook: Order not found for Razorpay order ${razorpayOrderId}`);
        return NextResponse.json({ received: true });
      }

      // Only process if order is not already paid
      if (order.status !== 'paid') {
        // Update order status
        await db.order.update({
          where: { id: order.id },
          data: {
            status: 'paid',
            razorpayPaymentId,
            watermarkText: 'Purchased from Vedant Academy',
          },
        });

        // Increment sales count
        await db.pdf.update({
          where: { id: order.pdfId },
          data: { salesCount: { increment: 1 } },
        });

        // Generate download token
        const downloadToken = await createDownloadToken(order.id);

        // Send purchase receipt email (don't block the response on this)
        if (order.buyerEmail) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://my-project-rho-lake.vercel.app';
          import('@/lib/email').then(({ sendPurchaseReceipt }) => {
            sendPurchaseReceipt({
              buyerEmail: order.buyerEmail!,
              buyerPhone: order.buyerPhone || undefined,
              pdfTitle: order.pdf.title,
              amount: order.amount,
              orderId: order.id,
              downloadToken,
              appUrl,
            }).catch((err: Error) => console.error('Webhook email send failed:', err));
          }).catch(() => {});
        }

        console.log(`Webhook: Order ${order.id} marked as paid via webhook, email sent to ${order.buyerEmail}`);
      }
    }

    // Handle payment.failed event
    if (eventType === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;

      if (razorpayOrderId) {
        const order = await db.order.findFirst({
          where: { razorpayOrderId },
        });

        if (order && order.status === 'created') {
          await db.order.update({
            where: { id: order.id },
            data: { status: 'failed' },
          });
        }
      }
    }

    // Always return 200 to acknowledge webhook receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Still return 200 to prevent Razorpay from retrying unnecessarily
    return NextResponse.json({ received: true });
  }
}
