import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAdminSession } from '@/lib/admin-auth';

// GET /api/admin/pdfs - List all PDFs for admin
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await validateAdminSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pdfs = await db.pdf.findMany({
      include: {
        class: true,
        subject: true,
        chapter: true,
        topic: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(pdfs);
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
    const { title, description, price, classId, subjectId, chapterId, topicId, featured, published, pdfPath, thumbnailPath, pageCount } = body;

    if (!title || !classId || !subjectId || !chapterId || !topicId || !pdfPath) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const pdf = await db.pdf.create({
      data: {
        title,
        description: description || '',
        price: parseFloat(price) || 0,
        classId,
        subjectId,
        chapterId,
        topicId,
        featured: featured || false,
        published: published !== false,
        pdfPath,
        thumbnailPath: thumbnailPath || null,
        pageCount: parseInt(pageCount) || 0,
      },
      include: {
        class: true,
        subject: true,
        chapter: true,
        topic: true,
      },
    });

    return NextResponse.json(pdf, { status: 201 });
  } catch (error) {
    console.error('Error creating PDF:', error);
    return NextResponse.json({ error: 'Failed to create PDF' }, { status: 500 });
  }
}
