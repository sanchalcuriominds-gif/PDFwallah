import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    const where = type ? { type } : {};

    const classes = await db.class.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        sortOrder: true,
        _count: { select: { subjects: true, pdfs: true } },
      },
    });
    // Cache for 30 seconds
    const response = NextResponse.json(classes);
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return response;
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
