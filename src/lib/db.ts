// Use Supabase JS client for database access (works over HTTPS from Vercel)
// Falls back to Prisma for local development if Supabase is not configured
import { isSupabaseConfigured } from './supabase';

let _db: any = null;

export function getDb() {
  if (_db) return _db;
  const globalForPrisma = globalThis as unknown as { prisma: any | undefined; _prismaFingerprint?: string };
  if (isSupabaseConfigured()) {
    const supabaseDb = require('./db-supabase');
    _db = supabaseDb.db;
  } else {
    try {
      const { Prisma, PrismaClient } = require('@prisma/client');
      // Fingerprint the generated client's Pdf model so that after `prisma generate`
      // + dev server restart, stale cached instances are automatically replaced
      const pdfFields = Prisma?.dmmf?.datamodel?.models?.find((m: any) => m.name === 'Pdf')?.fields?.map((f: any) => f.name).join(',') ?? '';
      if (!globalForPrisma.prisma || globalForPrisma._prismaFingerprint !== pdfFields) {
        if (globalForPrisma.prisma?.$disconnect) {
          globalForPrisma.prisma.$disconnect().catch(() => {});
        }
        globalForPrisma.prisma = new PrismaClient({ log: ['query'] });
        globalForPrisma._prismaFingerprint = pdfFields;
      }
      _db = globalForPrisma.prisma;
    } catch (e) {
      throw new Error('Neither Supabase nor Prisma is available. Configure Supabase env vars for production.');
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
