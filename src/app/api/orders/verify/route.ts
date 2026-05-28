import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyRazorpayPayment } from '@/lib/razorpay';
import { createDownloadToken } from '@/lib/download-token';

// POST /api/orders/verify - Verify Razorpay payment and generate download token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = body;

    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: 'Missing required payment details' }, { status: 400 });
    }

    // Verify the payment signature using HMAC-SHA256 (timing-safe)
    const isValid = verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature);

    if (!isValid) {
      // Mark order as failed
      await db.order.update({
        where: { id: orderId },
        data: { status: 'failed' },
      });
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 400 });
    }

    // Double-payment prevention: Check if order is already paid (idempotency)
    const existingOrder = await db.order.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if ((existingOrder as any).status === 'paid') {
      // Already paid - return existing download token
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        downloadToken: (existingOrder as any).downloadToken,
        pdfTitle: (existingOrder as any).pdf?.title || 'Your purchase',
      });
    }

    // Update order status
    const order = await db.order.update({
      where: { id: orderId },
      data: {
        status: 'paid',
        razorpayPaymentId,
        razorpaySignature,
        watermarkText: 'Purchased from PDFWallah',
      },
      include: { pdf: true },
    });

    // Increment sales count
    await db.pdf.update({
      where: { id: order.pdfId },
      data: { salesCount: { increment: 1 } },
    });

    // Generate download token (24hr validity, 3 downloads)
    const downloadToken = await createDownloadToken(orderId);

    // Send email receipt (non-blocking - don't wait for it)
    if ((order as any).buyerEmail) {
      sendEmailReceipt(
        (order as any).buyerEmail,
        (order as any).pdf?.title || 'Your Notes',
        downloadToken,
        (order as any).amount
      ).catch((err) => {
        console.error('Failed to send email receipt:', err);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      downloadToken,
      pdfTitle: (order as any).pdf?.title,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}

// Send email receipt via Resend
async function sendEmailReceipt(
  email: string,
  pdfTitle: string,
  downloadToken: string,
  amount: number
) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'PDFWallah <onboarding@resend.dev>';

  if (!resendApiKey) {
    console.log('RESEND_API_KEY not set - skipping email receipt');
    return;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://my-project-rho-lake.vercel.app';
  const downloadUrl = `${baseUrl}/api/download?token=${downloadToken}`;

  const emailPayload = {
    from: emailFrom,
    to: email,
    subject: `Your Purchase: ${pdfTitle} - PDFWallah`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #059669; margin: 0;">PDFWallah</h1>
          <p style="color: #6b7280; margin: 5px 0 0;">Digital Notes Store</p>
        </div>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #065f46; margin: 0 0 10px;">Payment Successful!</h2>
          <p style="margin: 0; color: #374151;">Thank you for your purchase.</p>
        </div>
        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h3 style="margin: 0 0 15px; color: #111827;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Product</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600;">${pdfTitle}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">Amount Paid</td>
              <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #059669;">₹${amount}</td>
            </tr>
          </table>
        </div>
        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${downloadUrl}" style="background: #059669; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Download Your Notes</a>
        </div>
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Important:</strong> This download link is valid for 24 hours and allows up to 3 downloads. Please save the file to your device.
          </p>
        </div>
        <div style="text-align: center; color: #9ca3af; font-size: 12px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0;">PDFWallah - Digital Notes Store</p>
          <p style="margin: 5px 0 0;">If you need help, reply to this email.</p>
        </div>
      </div>
    `,
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Resend API error:', response.status, errorText);
  } else {
    const result = await response.json();
    console.log('Email receipt sent:', result.id);
  }
}
