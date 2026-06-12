import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!q || q.trim().length === 0) {
      return NextResponse.json({ results: [] });
    }

    const where: Record<string, unknown> = {
      published: true,
      OR: [
        { title: { contains: q } },
        { description: { contains: q } },
      ],
    };

    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;

    const results = await db.pdf.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        mrp: true,
        pageCount: true,
        salesCount: true,
        downloadCount: true,
        featured: true,
        thumbnailPath: true,
        noteTypeId: true,
        createdAt: true,
        class: { select: { name: true, slug: true } },
        subject: { select: { name: true, slug: true } },
        chapter: { select: { name: true, slug: true } },
        topic: { select: { name: true, slug: true } },
        noteType: { select: { name: true, slug: true } },
      },
      take: limit,
      orderBy: { salesCount: 'desc' },
    });

    const response = NextResponse.json({ results });
    response.headers.set('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=30');
    return response;
  } catch (error) {
    console.error('Error searching PDFs:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
