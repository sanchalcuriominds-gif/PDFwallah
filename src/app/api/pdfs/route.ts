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
    const classType = searchParams.get('type');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = { published: true };

    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    if (chapterId) where.chapterId = chapterId;
    if (topicId) where.topicId = topicId;
    if (featured === 'true') where.featured = true;
    // Handle class type filter: fetch matching class IDs first
    let classIds: string[] | null = null;
    if (classType) {
      const matchingClasses = await db.class.findMany({
        where: { type: classType },
        select: { id: true },
      });
      classIds = matchingClasses.map((c) => c.id);
      if (classIds.length === 0) {
        // No classes of this type, return empty result
        return NextResponse.json({
          pdfs: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
      where.classId = { in: classIds };
    }

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
          published: true,
          thumbnailPath: true,
          noteTypeId: true,
          createdAt: true,
          class: { select: { name: true, slug: true } },
          subject: { select: { name: true, slug: true } },
          chapter: { select: { name: true, slug: true } },
          topic: { select: { name: true, slug: true } },
          noteType: { select: { name: true, slug: true } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.pdf.count({ where }),
    ]);

    // Cache for 5 seconds (changes more frequently)
    const response = NextResponse.json({
      pdfs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
    response.headers.set('Cache-Control', 'public, s-maxage=5, stale-while-revalidate=30');
    return response;
  } catch (error: any) {
    console.error('Error fetching PDFs:', error);
    return NextResponse.json({ error: 'Failed to fetch PDFs' }, { status: 500 });
  }
}
