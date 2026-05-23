// Download token utility for secure PDF downloads
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';

const DOWNLOAD_LINK_DURATION_MINUTES = 30;

export async function createDownloadToken(orderId: string): Promise<string> {
  const token = uuidv4();
  const tokenExpiry = new Date(Date.now() + DOWNLOAD_LINK_DURATION_MINUTES * 60 * 1000);

  await db.order.update({
    where: { id: orderId },
    data: {
      downloadToken: token,
      tokenExpiry: tokenExpiry.toISOString(),
    }
  });

  return token;
}

export async function validateDownloadToken(token: string): Promise<{ valid: boolean; orderId?: string; pdfPath?: string }> {
  if (!token) return { valid: false };

  // Use findUnique with downloadToken as the where filter
  const order = await db.order.findUnique({
    where: { downloadToken: token },
    include: { pdf: true }
  });

  if (!order) return { valid: false };

  // Supabase returns dates as strings, Prisma returns Date objects
  // Handle both cases
  const tokenExpiry = typeof order.tokenExpiry === 'string'
    ? new Date(order.tokenExpiry)
    : order.tokenExpiry;

  if (!tokenExpiry || tokenExpiry < new Date()) return { valid: false };
  if (order.status !== 'paid') return { valid: false };

  return { valid: true, orderId: order.id, pdfPath: order.pdf?.pdfPath };
}

export async function invalidateDownloadToken(token: string): Promise<void> {
  try {
    // Find the order with this token first, then update it
    const order = await db.order.findUnique({
      where: { downloadToken: token },
    });

    if (order) {
      await db.order.update({
        where: { id: order.id },
        data: { downloadToken: null, tokenExpiry: null }
      });
    }
  } catch {
    // Token might not exist
  }
}
