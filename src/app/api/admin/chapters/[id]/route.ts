import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAdminSession } from '@/lib/admin-auth';

// DELETE /api/admin/chapters/[id] - Delete a chapter and all its children (topics, PDFs, orders)
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

    // Check if chapter exists
    const chapter = await db.chapter.findUnique({ where: { id } });
    if (!chapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    // Cascade-delete in the correct FK order inside a transaction:
    //   1. Orders that reference PDFs under this chapter
    //   2. PDFs under this chapter
    //   3. Topics under this chapter
    //   4. The chapter itself
    await db.$transaction(async (tx) => {
      const pdfIds = (await tx.pdf.findMany({
        where: { chapterId: id },
        select: { id: true },
      })).map(p => p.id);

      if (pdfIds.length > 0) {
        await tx.order.deleteMany({ where: { pdfId: { in: pdfIds } } });
        await tx.pdf.deleteMany({ where: { id: { in: pdfIds } } });
      }

      await tx.topic.deleteMany({ where: { chapterId: id } });
      await tx.chapter.delete({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      message: `Chapter "${chapter.name}" deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return NextResponse.json({ error: 'Failed to delete chapter' }, { status: 500 });
  }
}
