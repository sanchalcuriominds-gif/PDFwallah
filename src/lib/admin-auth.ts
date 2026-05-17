// Admin authentication utility
import { v4 as uuidv4 } from 'uuid';
import { db } from './db';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const SESSION_DURATION_HOURS = 24;

export function validateAdminPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export async function createAdminSession(): Promise<string> {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
  
  await db.adminSession.create({
    data: { token, expiresAt }
  });
  
  return token;
}

export async function validateAdminSession(token: string): Promise<boolean> {
  if (!token) return false;
  
  const session = await db.adminSession.findUnique({
    where: { token }
  });
  
  if (!session) return false;
  if (session.expiresAt < new Date()) {
    await db.adminSession.delete({ where: { token } });
    return false;
  }
  
  return true;
}

export async function deleteAdminSession(token: string): Promise<void> {
  try {
    await db.adminSession.delete({ where: { token } });
  } catch {
    // Session might not exist
  }
}
