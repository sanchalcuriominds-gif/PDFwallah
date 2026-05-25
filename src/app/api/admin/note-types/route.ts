import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAdminSession } from '@/lib/admin-auth';

// GET /api/admin/note-types - List all note types
export async function GET() {
  try {
    const noteTypes = await db.noteType.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(noteTypes);
  } catch (error) {
    console.error('Error fetching note types:', error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST /api/admin/note-types - Create a new note type
export async function POST(request: NextRequest) {
  try {
    // Verify admin
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => c.split('='))
    );
    const isAdmin = await validateAdminSession(cookies.admin_token);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Auto-generate slug from name if not provided
    const noteTypeSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    const noteType = await db.noteType.create({
      data: { name, slug: noteTypeSlug },
    });

    return NextResponse.json(noteType, { status: 201 });
  } catch (error: any) {
    console.error('Error creating note type:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create note type' },
      { status: 500 }
    );
  }
}
