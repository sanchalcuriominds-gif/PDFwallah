import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAdminSession } from '@/lib/admin-auth';

// GET /api/admin/pdfs/[id] - Get single PDF for admin
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await validateAdminSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const pdf = await db.pdf.findUnique({
      where: { id },
      include: { class: true, subject: true, chapter: true, topic: true, orders: true },
    });

    if (!pdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    return NextResponse.json(pdf);
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 });
  }
}

// PUT /api/admin/pdfs/[id] - Update a PDF
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await validateAdminSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, price, classId, subjectId, chapterId, topicId, featured, published, pdfPath, thumbnailPath, pageCount } = body;

    const pdf = await db.pdf.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(classId !== undefined && { classId }),
        ...(subjectId !== undefined && { subjectId }),
        ...(chapterId !== undefined && { chapterId }),
        ...(topicId !== undefined && { topicId }),
        ...(featured !== undefined && { featured }),
        ...(published !== undefined && { published }),
        ...(pdfPath !== undefined && { pdfPath }),
        ...(thumbnailPath !== undefined && { thumbnailPath }),
        ...(pageCount !== undefined && { pageCount: parseInt(pageCount) }),
      },
      include: { class: true, subject: true, chapter: true, topic: true },
    });

    return NextResponse.json(pdf);
  } catch (error) {
    console.error('Error updating PDF:', error);
    return NextResponse.json({ error: 'Failed to update PDF' }, { status: 500 });
  }
}

// DELETE /api/admin/pdfs/[id] - Delete a PDF
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await validateAdminSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await db.pdf.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    return NextResponse.json({ error: 'Failed to delete PDF' }, { status: 500 });
  }
}
