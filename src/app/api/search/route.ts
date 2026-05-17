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
      include: {
        class: true,
        subject: true,
        chapter: true,
        topic: true,
      },
      take: limit,
      orderBy: { salesCount: 'desc' },
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching PDFs:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
