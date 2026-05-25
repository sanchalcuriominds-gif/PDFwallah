import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/note-types - List all note types (public)
export async function GET() {
  try {
    const noteTypes = await db.noteType.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(noteTypes);
  } catch (error) {
    console.error('Error fetching note types:', error);
    return NextResponse.json([], { status: 200 }); // Graceful fallback
  }
}
