import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    
    const where = subjectId ? { subjectId } : {};
    
    const chapters = await db.chapter.findMany({
      where,
      include: {
        subject: { include: { class: true } },
        _count: { select: { topics: true, pdfs: true } }
      },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(chapters);
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
  }
}
