import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/pdfs - List PDFs with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const chapterId = searchParams.get('chapterId');
    const topicId = searchParams.get('topicId');
    const search = searchParams.get('search');
    const featured = searchParams.get('featured');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { published: true };

    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    if (chapterId) where.chapterId = chapterId;
    if (topicId) where.topicId = topicId;
    if (featured === 'true') where.featured = true;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const orderBy: Record<string, string> = sort === 'popular'
      ? { salesCount: 'desc' }
      : sort === 'downloads'
      ? { downloadCount: 'desc' }
      : sort === 'price-low'
      ? { price: 'asc' }
      : sort === 'price-high'
      ? { price: 'desc' }
      : { createdAt: 'desc' };

    const [pdfs, total] = await Promise.all([
      db.pdf.findMany({
        where,
        include: {
          class: true,
          subject: true,
          chapter: true,
          topic: true,
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.pdf.count({ where }),
    ]);

    return NextResponse.json({
      pdfs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    return NextResponse.json({ error: 'Failed to fetch PDFs' }, { status: 500 });
  }
}
