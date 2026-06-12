import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    
    const where = classId ? { classId } : {};
    
    const subjects = await db.subject.findMany({
      where,
      select: {
        id: true,
        name: true,
        slug: true,
        classId: true,
        class: { select: { name: true, slug: true } },
        _count: { select: { chapters: true, pdfs: true } },
      },
      orderBy: { name: 'asc' },
    });
    
    // Cache for 30 seconds
    const response = NextResponse.json(subjects);
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return response;
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
  }
}
