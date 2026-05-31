import { NextRequest, NextResponse } from 'next/server';
import { findOrdersByEmailOrPhone, regenerateDownloadToken } from '@/lib/download-token';
import { sendRecoveryEmail } from '@/lib/email';

// POST /api/recover - Find and resend download links for a user's purchases
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone } = body;

    if (!email && !phone) {
      return NextResponse.json({ error: 'Please provide your email or phone number' }, { status: 400 });
    }

    const orders = await findOrdersByEmailOrPhone(
      email || undefined,
      phone || undefined
    );

    if (orders.length === 0) {
      return NextResponse.json({
        found: false,
        message: 'No purchases found for this email/phone. Make sure you used the same email or phone when purchasing.',
      });
    }

    // Regenerate download tokens for orders that have expired or missing tokens
    const updatedOrders = await Promise.all(
      orders.map(async (order) => {
        if (!order.downloadToken) {
          const newToken = await regenerateDownloadToken(order.id);
          return { ...order, downloadToken: newToken };
        }

        // Check if token is expired
        if (order.tokenExpiry) {
          const expiryDate = new Date(order.tokenExpiry);
          if (expiryDate < new Date()) {
            const newToken = await regenerateDownloadToken(order.id);
            return { ...order, downloadToken: newToken };
          }
        }

        return order;
      })
    );

    // Send recovery email if email is provided
    if (email && updatedOrders.some(o => o.downloadToken)) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://my-project-rho-lake.vercel.app';
      const emailResult = await sendRecoveryEmail({
        buyerEmail: email,
        orders: updatedOrders,
        appUrl,
      });

      if (!emailResult.success && !emailResult.error?.includes('not configured')) {
        console.error('Recovery email failed:', emailResult.error);
      }
    }

    // Return order info (without tokens - those are sent via email for security)
    const safeOrders = updatedOrders.map(o => ({
      id: o.id,
      pdfTitle: o.pdfTitle,
      amount: o.amount,
      createdAt: o.createdAt,
      hasDownloadLink: !!o.downloadToken,
    }));

    return NextResponse.json({
      found: true,
      count: safeOrders.length,
      orders: safeOrders,
      emailSent: !!email,
      message: email
        ? `Found ${safeOrders.length} purchase(s). Download links have been sent to ${email}.`
        : `Found ${safeOrders.length} purchase(s). Please provide your email to receive download links.`,
    });
  } catch (error) {
    console.error('Recovery error:', error);
    return NextResponse.json({ error: 'Recovery failed. Please try again.' }, { status: 500 });
  }
}
