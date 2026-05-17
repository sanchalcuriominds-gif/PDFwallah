import { NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/admin-auth';

// Admin auth middleware helper - validates admin session from cookie
export async function getAdminToken(request: Request): Promise<string | null> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;
  
  const cookies = Object.fromEntries(
    cookieHeader.split('; ').map(c => c.split('='))
  );
  
  return cookies.admin_token || null;
}

export async function requireAdmin(request: Request): Promise<NextResponse | null> {
  const token = await getAdminToken(request);
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const isValid = await validateAdminSession(token);
  if (!isValid) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 });
  }
  
  return null; // null means authorized
}
