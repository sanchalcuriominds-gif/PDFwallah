import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createRazorpayOrder, amountToPaise, getRazorpayKeyId } from '@/lib/razorpay';

// POST /api/orders/create - Create a new Razorpay order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pdfId, buyerEmail, buyerPhone } = body;

    if (!pdfId) {
      return NextResponse.json({ error: 'PDF ID is required' }, { status: 400 });
    }

    const pdf = await db.pdf.findUnique({
      where: { id: pdfId },
    });

    if (!pdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    if (!pdf.published) {
      return NextResponse.json({ error: 'PDF is not available for purchase' }, { status: 400 });
    }

    // Check if already purchased (by email)
    if (buyerEmail) {
      const existingPaid = await db.order.findFirst({
        where: {
          pdfId: pdfId,
          buyerEmail: buyerEmail,
          status: 'paid',
        },
      });

      if (existingPaid) {
        return NextResponse.json({
          error: 'You have already purchased this note. Check your email for the download link.',
          alreadyPurchased: true,
          downloadToken: existingPaid.downloadToken,
        }, { status: 409 });
      }
    }

    // Spam prevention: Check for too many recent orders by this email/phone (within 10 min)
    if (buyerEmail || buyerPhone) {
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const recentOrders = await db.order.findMany({
        where: {
          pdfId: pdfId,
          status: 'created',
          createdAt: { gte: tenMinAgo },
        },
        take: 5,
      });

      const spammyOrders = recentOrders.filter(
        (o: any) =>
          (buyerEmail && o.buyerEmail === buyerEmail) ||
          (buyerPhone && o.buyerPhone === buyerPhone)
      );

      if (spammyOrders.length >= 3) {
        return NextResponse.json(
          { error: 'Too many pending orders. Please wait a few minutes and try again.' },
          { status: 429 }
        );
      }
    }

    // ⚠️ IMPORTANT: Always create a FRESH Razorpay order for each checkout attempt.
    // Previously we reused "created" orders but this caused "Something went wrong" errors
    // because:
    // 1. Razorpay orders expire after a certain time and can't be reused
    // 2. If a previous attempt was partially completed, reusing the order_id breaks
    // 3. Race conditions where status hadn't been updated yet
    // Now we always create a new order — Razorpay allows multiple orders per PDF.

    // Mark any old "created" orders for this PDF as abandoned (cleanup)
    try {
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      await db.order.updateMany({
        where: {
          pdfId: pdfId,
          status: 'created',
          createdAt: { lt: fiveMinAgo },
        },
        data: {
          status: 'failed',
        },
      });
    } catch (cleanupErr) {
      // Non-critical — don't block order creation if cleanup fails
      console.error('Order cleanup error:', cleanupErr);
    }

    // Create a NEW Razorpay order every time
    const amountInPaise = amountToPaise(pdf.price);

    console.log(`Creating Razorpay order: ₹${pdf.price} (${amountInPaise} paise) for PDF ${pdf.id}`);

    const razorpayOrder = await createRazorpayOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        pdfId: pdf.id,
        pdfTitle: pdf.title,
      },
    });

    console.log(`Razorpay order created: ${razorpayOrder.id}`);

    // Create order in database
    const order = await db.order.create({
      data: {
        razorpayOrderId: razorpayOrder.id,
        amount: pdf.price,
        currency: 'INR',
        status: 'created',
        pdfId: pdf.id,
        buyerEmail: buyerEmail || null,
        buyerPhone: buyerPhone || null,
      },
    });

    return NextResponse.json({
      orderId: order.id,
      razorpayOrderId: razorpayOrder.id,
      amount: pdf.price,
      currency: 'INR',
      keyId: getRazorpayKeyId(),
      pdfTitle: pdf.title,
      pdfDescription: pdf.description,
    });
  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create order' },
      { status: 500 }
    );
  }
}
