import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const chapterId = searchParams.get('chapterId');
    
    const where = chapterId ? { chapterId } : {};
    
    const topics = await db.topic.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        chapterId: true,
        chapter: {
          select: {
            name: true,
            slug: true,
            subject: {
              select: {
                name: true,
                slug: true,
                class: { select: { name: true, slug: true } },
              },
            },
          },
        },
        _count: { select: { pdfs: true } },
      },
      orderBy: { name: 'asc' },
    });
    
    // Cache for 30 seconds
    const response = NextResponse.json(topics);
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return response;
  } catch (error) {
    console.error('Error fetching topics:', error);
    return NextResponse.json({ error: 'Failed to fetch topics' }, { status: 500 });
  }
}
