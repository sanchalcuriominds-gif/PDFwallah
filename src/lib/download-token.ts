// Download token utility for secure PDF downloads
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';

const DOWNLOAD_LINK_DURATION_MINUTES = 24 * 60; // 24 hours
const MAX_DOWNLOAD_USES = 3; // Max 3 downloads per token

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

export async function validateDownloadToken(token: string): Promise<{ valid: boolean; orderId?: string; pdfPath?: string; reason?: string }> {
  if (!token) return { valid: false, reason: 'No token provided' };

  // Use findUnique with downloadToken as the where filter
  const order = await db.order.findUnique({
    where: { downloadToken: token },
    include: { pdf: true }
  });

  if (!order) return { valid: false, reason: 'Invalid download link' };

  // Check payment status
  if ((order as any).status !== 'paid') return { valid: false, reason: 'Order not paid' };

  // Check expiry
  const tokenExpiry = typeof (order as any).tokenExpiry === 'string'
    ? new Date((order as any).tokenExpiry)
    : (order as any).tokenExpiry;

  if (!tokenExpiry || tokenExpiry < new Date()) {
    return { valid: false, reason: 'Download link expired. Use "Recover Download Links" to get a new link.' };
  }

  // Check download use count (3 downloads max)
  const useCount = (order as any).downloadUseCount || 0;
  if (useCount >= MAX_DOWNLOAD_USES) {
    return { valid: false, reason: `Maximum downloads (${MAX_DOWNLOAD_USES}) reached for this purchase.` };
  }

  return { valid: true, orderId: order.id, pdfPath: (order as any).pdf?.pdfPath };
}

export async function incrementDownloadUseCount(token: string): Promise<void> {
  try {
    const order = await db.order.findUnique({
      where: { downloadToken: token },
    });

    if (order) {
      const currentCount = (order as any).downloadUseCount || 0;
      await db.order.update({
        where: { id: order.id },
        data: { downloadUseCount: currentCount + 1 } as any,
      });
    }
  } catch (error) {
    console.error('Error incrementing download count:', error);
    // Don't fail the download if count update fails
  }
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
