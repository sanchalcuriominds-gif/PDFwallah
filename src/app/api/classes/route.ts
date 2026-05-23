import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const classes = await db.class.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { subjects: true, pdfs: true } }
      }
    });
    return NextResponse.json(classes);
  } catch (error: any) {
    console.error('Error fetching classes:', error);
    // Return more details for debugging
    return NextResponse.json({ 
      error: 'Failed to fetch classes', 
      details: error?.message || String(error),
      dbUrl: process.env.DATABASE_URL ? 'SET (' + process.env.DATABASE_URL.substring(0, 30) + '...)' : 'NOT SET',
    }, { status: 500 });
  }
}
