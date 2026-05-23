// Use Supabase JS client for database access (works over HTTPS from Vercel)
// Falls back to Prisma for local development if Supabase is not configured
import { isSupabaseConfigured } from './supabase';

let _db: any = null;

export function getDb() {
  if (!_db) {
    if (isSupabaseConfigured()) {
      // Use Supabase client (HTTPS - works from Vercel)
      const supabaseDb = require('./db-supabase');
      _db = supabaseDb.db;
    } else {
      // Fallback to Prisma for local development
      try {
        const { PrismaClient } = require('@prisma/client');
        const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
        _db = globalForPrisma.prisma ?? new PrismaClient({ log: ['query'] });
        if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = _db;
      } catch (e) {
        throw new Error('Neither Supabase nor Prisma is available. Configure Supabase env vars for production.');
      }
    }
  }
  return _db;
}

export const db = new Proxy({} as any, {
  get(_target, prop) {
    return getDb()[prop];
  },
});

export default db;
