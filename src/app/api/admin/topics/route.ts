import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAdminSession } from '@/lib/admin-auth';

// GET - List all topics for admin
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await validateAdminSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const topics = await db.topic.findMany({
      orderBy: { name: 'asc' },
      include: {
        chapter: { select: { name: true } },
        _count: { select: { pdfs: true } },
      },
    });

    const result = topics.map((t) => ({
      ...t,
      chapterName: t.chapter.name,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}

// POST - Create a new topic
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await validateAdminSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, slug, chapterId } = body;

    if (!name || !slug || !chapterId) {
      return NextResponse.json({ error: 'Name, slug, and chapterId are required' }, { status: 400 });
    }

    const topic = await db.topic.create({
      data: { name, slug, chapterId },
    });

    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error('Error creating topic:', error);
    return NextResponse.json({ error: 'Failed to create topic' }, { status: 500 });
  }
}
