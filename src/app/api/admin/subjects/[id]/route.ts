import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAdminSession } from '@/lib/admin-auth';

// DELETE /api/admin/subjects/[id] - Delete a subject and all its children (chapters, topics, PDFs, orders)
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

    // Check if subject exists
    const subject = await db.subject.findUnique({ where: { id } });
    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    // Cascade-delete in the correct FK order inside a transaction:
    //   1. Orders that reference PDFs under this subject
    //   2. PDFs under this subject
    //   3. Topics under all chapters of this subject
    //   4. Chapters under this subject
    //   5. The subject itself
    await db.$transaction(async (tx) => {
      const pdfIds = (await tx.pdf.findMany({
        where: { subjectId: id },
        select: { id: true },
      })).map(p => p.id);

      if (pdfIds.length > 0) {
        await tx.order.deleteMany({ where: { pdfId: { in: pdfIds } } });
        await tx.pdf.deleteMany({ where: { id: { in: pdfIds } } });
      }

      const chapterIds = (await tx.chapter.findMany({
        where: { subjectId: id },
        select: { id: true },
      })).map(c => c.id);

      if (chapterIds.length > 0) {
        await tx.topic.deleteMany({ where: { chapterId: { in: chapterIds } } });
        await tx.chapter.deleteMany({ where: { id: { in: chapterIds } } });
      }

      await tx.subject.delete({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      message: `Subject "${subject.name}" deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}
