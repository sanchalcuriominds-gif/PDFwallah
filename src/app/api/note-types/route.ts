import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/note-types - List all note types (public)
export async function GET() {
  try {
    const noteTypes = await db.noteType.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });
    // Cache for 30 seconds
    const response = NextResponse.json(noteTypes);
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return response;
  } catch (error) {
    console.error('Error fetching note types:', error);
    return NextResponse.json([], { status: 200 }); // Graceful fallback
  }
}
