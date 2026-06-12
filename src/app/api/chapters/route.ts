import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');
    
    const where = subjectId ? { subjectId } : {};
    
    const chapters = await db.chapter.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        subjectId: true,
        subject: {
          select: {
            name: true,
            slug: true,
            class: { select: { name: true, slug: true } },
          },
        },
        _count: { select: { topics: true, pdfs: true } },
      },
      orderBy: { name: 'asc' },
    });
    
    // Cache for 30 seconds
    const response = NextResponse.json(chapters);
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return response;
  } catch (error) {
    console.error('Error fetching chapters:', error);
    return NextResponse.json({ error: 'Failed to fetch chapters' }, { status: 500 });
  }
}
