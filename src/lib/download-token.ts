// Download token utility for secure PDF downloads
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';

const DOWNLOAD_LINK_DURATION_MINUTES = 30;

export async function createDownloadToken(orderId: string): Promise<string> {
  const token = uuidv4();
  const tokenExpiry = new Date(Date.now() + DOWNLOAD_LINK_DURATION_MINUTES * 60 * 1000);
  
  await db.order.update({
    where: { id: orderId },
    data: { downloadToken: token, tokenExpiry }
  });
  
  return token;
}

export async function validateDownloadToken(token: string): Promise<{ valid: boolean; orderId?: string; pdfPath?: string }> {
  if (!token) return { valid: false };
  
  const order = await db.order.findFirst({
    where: { downloadToken: token },
    include: { pdf: true }
  });
  
  if (!order) return { valid: false };
  if (!order.tokenExpiry || order.tokenExpiry < new Date()) return { valid: false };
  if (order.status !== 'paid') return { valid: false };
  
  return { valid: true, orderId: order.id, pdfPath: order.pdf.pdfPath };
}

export async function invalidateDownloadToken(token: string): Promise<void> {
  try {
    await db.order.updateMany({
      where: { downloadToken: token },
      data: { downloadToken: null, tokenExpiry: null }
    });
  } catch {
    // Token might not exist
  }
}
