import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAdminSession } from '@/lib/admin-auth';

// DELETE /api/admin/classes/[id] - Delete a class and all its children (subjects, chapters, topics, PDFs, orders)
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

    // Check if class exists
    const cls = await db.class.findUnique({ where: { id } });
    if (!cls) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Cascade-delete in the correct FK order inside a transaction:
    //   1. Orders that reference PDFs under this class
    //   2. PDFs under this class
    //   3. Topics under all chapters of all subjects of this class
    //   4. Chapters under all subjects of this class
    //   5. Subjects under this class
    //   6. The class itself
    await db.$transaction(async (tx) => {
      const pdfIds = (await tx.pdf.findMany({
        where: { classId: id },
        select: { id: true },
      })).map(p => p.id);

      if (pdfIds.length > 0) {
        await tx.order.deleteMany({ where: { pdfId: { in: pdfIds } } });
        await tx.pdf.deleteMany({ where: { id: { in: pdfIds } } });
      }

      const subjectIds = (await tx.subject.findMany({
        where: { classId: id },
        select: { id: true },
      })).map(s => s.id);

      if (subjectIds.length > 0) {
        const chapterIds = (await tx.chapter.findMany({
          where: { subjectId: { in: subjectIds } },
          select: { id: true },
        })).map(c => c.id);

        if (chapterIds.length > 0) {
          await tx.topic.deleteMany({ where: { chapterId: { in: chapterIds } } });
          await tx.chapter.deleteMany({ where: { id: { in: chapterIds } } });
        }

        await tx.subject.deleteMany({ where: { id: { in: subjectIds } } });
      }

      await tx.class.delete({ where: { id } });
    });

    return NextResponse.json({
      success: true,
      message: `Class "${cls.name}" deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }
}
