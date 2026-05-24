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

    // Spam prevention: Check for recent unpaid orders by this email/phone (within 10 min)
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

      // Filter by email or phone match
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

    // Reuse existing unpaid order within 10 minutes (idempotency)
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const existingOrder = await db.order.findFirst({
      where: {
        pdfId: pdfId,
        status: 'created',
        buyerEmail: buyerEmail || null,
        buyerPhone: buyerPhone || null,
        createdAt: { gte: tenMinAgo },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existingOrder) {
      // Reuse the existing Razorpay order
      return NextResponse.json({
        orderId: existingOrder.id,
        razorpayOrderId: (existingOrder as any).razorpayOrderId,
        amount: pdf.price,
        currency: 'INR',
        keyId: getRazorpayKeyId(),
        pdfTitle: pdf.title,
        pdfDescription: pdf.description,
      });
    }

    // Create a REAL Razorpay order
    const amountInPaise = amountToPaise(pdf.price);

    const razorpayOrder = await createRazorpayOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        pdfId: pdf.id,
        pdfTitle: pdf.title,
      },
    });

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
