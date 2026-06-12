import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAdminSession } from '@/lib/admin-auth';

// GET /api/admin/pdfs - List PDFs for admin with server-side filtering & pagination
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await validateAdminSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));

    const where: Record<string, unknown> = {};
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;
    if (search) {
      where.title = { contains: search };
    }

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
          previewPageCount: true,
          salesCount: true,
          downloadCount: true,
          featured: true,
          published: true,
          thumbnailPath: true,
          previewFileUrl: true,
          fullFileUrl: true,
          pdfPath: true,
          fileSize: true,
          noteTypeId: true,
          classId: true,
          subjectId: true,
          chapterId: true,
          topicId: true,
          createdAt: true,
          updatedAt: true,
          class: { select: { id: true, name: true, slug: true } },
          subject: { select: { id: true, name: true, slug: true } },
          chapter: { select: { id: true, name: true, slug: true } },
          topic: { select: { id: true, name: true, slug: true } },
          noteType: { select: { id: true, name: true, slug: true } },
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.pdf.count({ where }),
    ]);

    return NextResponse.json({
      pdfs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching admin PDFs:', error);
    return NextResponse.json({ error: 'Failed to fetch PDFs' }, { status: 500 });
  }
}

// POST /api/admin/pdfs - Create a new PDF entry
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await validateAdminSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, price, mrp, classId, subjectId, chapterId, topicId, featured, published, pdfPath, thumbnailPath, pageCount, previewFileUrl, fullFileUrl, noteTypeId } = body;

    if (!title || !classId || !subjectId || !chapterId || !topicId) {
      return NextResponse.json({ error: 'Missing required fields: title, classId, subjectId, chapterId, topicId' }, { status: 400 });
    }

    const pdf = await db.pdf.create({
      data: {
        title,
        description: description || '',
        price: parseFloat(price) || 0,
        mrp: mrp ? parseFloat(mrp) : null,
        classId,
        subjectId,
        chapterId,
        topicId,
        noteTypeId: noteTypeId || null,
        featured: featured || false,
        published: published !== false,
        pdfPath: pdfPath || `pdfs/${Date.now()}-${title.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        thumbnailPath: thumbnailPath || null,
        previewFileUrl: previewFileUrl || null,
        fullFileUrl: fullFileUrl || null,
        pageCount: parseInt(pageCount) || 0,
      },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        mrp: true,
        pageCount: true,
        featured: true,
        published: true,
        thumbnailPath: true,
        previewFileUrl: true,
        fullFileUrl: true,
        class: { select: { name: true, slug: true } },
        subject: { select: { name: true, slug: true } },
        chapter: { select: { name: true, slug: true } },
        topic: { select: { name: true, slug: true } },
      },
    });

    return NextResponse.json(pdf, { status: 201 });
  } catch (error: any) {
    console.error('Error creating PDF:', error);
    return NextResponse.json({ error: 'Failed to create PDF' }, { status: 500 });
  }
}
