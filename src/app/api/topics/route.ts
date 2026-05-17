import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    
    const where = chapterId ? { chapterId } : {};
    
    const topics = await db.topic.findMany({
      where,
      include: {
        chapter: { include: { subject: { include: { class: true } } } },
        _count: { select: { pdfs: true } }
      },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(topics);
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}
