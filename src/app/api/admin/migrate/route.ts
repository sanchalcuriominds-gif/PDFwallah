import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { requireAdmin } from '@/lib/admin-middleware';

// POST /api/admin/migrate - Run database migrations
// This endpoint checks for missing columns and provides SQL to add them.
// Must be called with a valid admin session cookie.
export async function POST(request: NextRequest) {
  try {
    // Verify admin auth
    const authError = await requireAdmin(request);
    if (authError) return authError;

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const results: string[] = [];
    const sqlToRun: string[] = [];

    // Migration 1: Add downloadUseCount column to Order table
    try {
      const admin = getSupabaseAdmin();

      // Check if column already exists by trying to select it
      const { error: checkError } = await admin
        .from('Order')
        .select('downloadUseCount')
        .limit(1);

      if (checkError && checkError.message.includes('does not exist')) {
        // Column doesn't exist - provide SQL to add it
        const sql = 'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "downloadUseCount" INTEGER NOT NULL DEFAULT 0;';
        sqlToRun.push(sql);
        results.push('downloadUseCount column needs to be added');
      } else {
        results.push('downloadUseCount column already exists ✓');
      }
    } catch (err) {
      results.push(`Error checking downloadUseCount: ${err instanceof Error ? err.message : 'Unknown'}`);
    }

    return NextResponse.json({
      success: true,
      migrations: results,
      sqlToRun: sqlToRun.length > 0 ? sqlToRun : undefined,
      message: sqlToRun.length > 0
        ? 'Some columns need to be added. Run the SQL below in Supabase Dashboard > SQL Editor.'
        : 'All migrations are up to date!',
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
  }
}
