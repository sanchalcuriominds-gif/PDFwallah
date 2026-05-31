// Email utility for sending receipts and download links
// Uses Resend (https://resend.com) - free tier: 3,000 emails/month

// Dynamic import to avoid build errors when resend is not installed
type ResendType = import('resend').Resend;

let _resend: ResendType | null = null;
async function getResend(): Promise<ResendType> {
  if (!_resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    const { Resend } = await import('resend');
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

// The "from" email address - must be a verified domain in Resend
// For testing without domain verification, use onboarding@resend.dev
const FROM_EMAIL = process.env.EMAIL_FROM || 'Vedant Academy <onboarding@resend.dev>';

interface ReceiptEmailData {
  buyerEmail: string;
  buyerPhone?: string;
  pdfTitle: string;
  amount: number;
  orderId: string;
  downloadToken: string;
  appUrl: string;
}

export async function sendPurchaseReceipt(data: ReceiptEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set - skipping email send');
      return { success: false, error: 'Email not configured' };
    }

    const downloadUrl = `${data.appUrl}/api/download?token=${data.downloadToken}`;
    const recoveryUrl = `${data.appUrl}/recover?email=${encodeURIComponent(data.buyerEmail)}`;

    const { error } = await (await getResend()).emails.send({
      from: FROM_EMAIL,
      to: data.buyerEmail,
      subject: `Your Purchase: ${data.pdfTitle} - Vedant Academy`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table role="presentation" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px;">
            <!-- Header -->
            <tr>
              <td style="background: linear-gradient(135deg, #059669, #0d9488); padding: 32px 40px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Vedant Academy</h1>
                <p style="margin: 8px 0 0; color: #d1fae5; font-size: 14px;">Payment Confirmation</p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 32px 40px;">
                <p style="margin: 0 0 16px; font-size: 16px; color: #1f2937;">Hi there! 👋</p>
                <p style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.6;">
                  Thank you for your purchase! Your payment has been confirmed. Here are your details:
                </p>

                <!-- Receipt Details -->
                <table role="presentation" width="100%" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; width: 140px; color: #6b7280; font-size: 14px;">Notes</td>
                    <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #1f2937; font-size: 14px;">${data.pdfTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Amount Paid</td>
                    <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #059669; font-size: 14px;">₹${data.amount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Order ID</td>
                    <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; font-family: monospace; color: #1f2937; font-size: 13px;">${data.orderId.substring(0, 12)}...</td>
                  </tr>
                  ${data.buyerPhone ? `
                  <tr>
                    <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">Phone</td>
                    <td style="padding: 16px 20px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px;">${data.buyerPhone}</td>
                  </tr>
                  ` : ''}
                </table>

                <!-- Download Button -->
                <table role="presentation" width="100%" style="margin-bottom: 16px;">
                  <tr>
                    <td style="text-align: center; padding: 8px 0;">
                      <a href="${downloadUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669, #0d9488); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        📥 Download Your Notes
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin: 16px 0; font-size: 13px; color: #6b7280; text-align: center; line-height: 1.5;">
                  ⏰ This download link is valid for 24 hours and can be used once.<br>
                  If you need to download again, visit our <a href="${recoveryUrl}" style="color: #059669;">recovery page</a>.
                </p>

                <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                  <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280; line-height: 1.5;">
                    If the button above doesn't work, copy and paste this link into your browser:
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #059669; word-break: break-all;">
                    ${downloadUrl}
                  </p>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding: 24px 40px; background-color: #f9fafb; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                  Vedant Academy - Your Digital Notes Store<br>
                  This is an automated email. Please do not reply.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Send a recovery email with all download links for a user
interface RecoveryEmailData {
  buyerEmail: string;
  orders: Array<{
    pdfTitle: string;
    amount: number;
    downloadToken: string | null;
    tokenExpiry: string | null;
    createdAt: string;
  }>;
  appUrl: string;
}

export async function sendRecoveryEmail(data: RecoveryEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not set - skipping email send');
      return { success: false, error: 'Email not configured' };
    }

    const activeOrders = data.orders.filter(o => o.downloadToken);
    const expiredOrders = data.orders.filter(o => !o.downloadToken);

    const orderRows = activeOrders.map(order => {
      const downloadUrl = `${data.appUrl}/api/download?token=${order.downloadToken}`;
      return `
        <tr>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-weight: 500; color: #1f2937; font-size: 14px;">${order.pdfTitle}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; color: #059669; font-size: 14px;">₹${order.amount}</td>
          <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">
            <a href="${downloadUrl}" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 6px 16px; border-radius: 4px; font-size: 13px; font-weight: 500;">Download</a>
          </td>
        </tr>
      `;
    }).join('');

    const expiredNote = expiredOrders.length > 0
      ? `<p style="margin: 16px 0 0; font-size: 13px; color: #f59e0b;">⚠️ ${expiredOrders.length} older purchase(s) have expired download links. Contact support if you need to re-download them.</p>`
      : '';

    const { error } = await (await getResend()).emails.send({
      from: FROM_EMAIL,
      to: data.buyerEmail,
      subject: 'Your Download Links - Vedant Academy',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <table role="presentation" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin-top: 40px; margin-bottom: 40px;">
            <tr>
              <td style="background: linear-gradient(135deg, #059669, #0d9488); padding: 32px 40px; text-align: center;">
                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">Vedant Academy</h1>
                <p style="margin: 8px 0 0; color: #d1fae5; font-size: 14px;">Your Download Links</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 40px;">
                <p style="margin: 0 0 16px; font-size: 16px; color: #1f2937;">Hi there!</p>
                <p style="margin: 0 0 24px; font-size: 15px; color: #4b5563; line-height: 1.6;">
                  Here are all your download links. Each link is valid for 24 hours and can be used once.
                </p>

                <table role="presentation" width="100%" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                  <tr style="background-color: #f9fafb;">
                    <td style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Notes</td>
                    <td style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Price</td>
                    <td style="padding: 10px 16px; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; text-align: center;">Link</td>
                  </tr>
                  ${orderRows}
                </table>

                ${expiredNote}

                <p style="margin: 24px 0 0; font-size: 13px; color: #6b7280; line-height: 1.5;">
                  If you have any issues, feel free to contact us. Save this email for future reference!
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 24px 40px; background-color: #f9fafb; text-align: center;">
                <p style="margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.5;">
                  Vedant Academy - Your Digital Notes Store<br>
                  This is an automated email. Please do not reply.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send recovery email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Recovery email send error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
