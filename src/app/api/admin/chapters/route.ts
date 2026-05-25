import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAdminSession } from '@/lib/admin-auth';

// GET - List all chapters for admin
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await validateAdminSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chapters = await db.chapter.findMany({
      orderBy: { name: 'asc' },
      include: {
        subject: { select: { name: true } },
        _count: { select: { topics: true, pdfs: true } },
      },
    });

    const result = chapters.map((c) => ({
      ...c,
      subjectName: c.subject.name,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
  }
}

// POST - Create a new chapter
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await validateAdminSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, subjectId } = body;

    if (!name || !slug || !subjectId) {
      return NextResponse.json({ error: 'Name, slug, and subjectId are required' }, { status: 400 });
    }

    const chapter = await db.chapter.create({
      data: { name, slug, subjectId },
    });

    return NextResponse.json(chapter, { status: 201 });
  } catch (error) {
    console.error('Error creating chapter:', error);
    return NextResponse.json({ error: 'Failed to create chapter' }, { status: 500 });
  }
}
