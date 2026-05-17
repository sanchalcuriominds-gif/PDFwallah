import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createRazorpayOrder, amountToPaise, getRazorpayKeyId } from '@/lib/razorpay';

// POST /api/orders/create - Create a new order
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

    const amountInPaise = amountToPaise(pdf.price);

    // Create Razorpay order
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
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
