import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAdminSession } from '@/lib/admin-auth';

// DELETE /api/admin/classes/[id] - Delete a class and all its children
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

    // Check for associated PDFs
    const pdfs = await db.pdf.findMany({ where: { classId: id }, take: 1 });
    if (pdfs.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete class with associated PDFs. Delete or reassign the PDFs first.',
      }, { status: 400 });
    }

    // Delete in order: topics → chapters → subjects → class
    // First find all subjects under this class
    const subjects = await db.subject.findMany({ where: { classId: id } });

    for (const subject of subjects) {
      // Find chapters under each subject
      const chapters = await db.chapter.findMany({ where: { subjectId: subject.id } });

      for (const chapter of chapters) {
        // Delete topics under each chapter
        await db.topic.deleteMany({ where: { chapterId: chapter.id } });
      }

      // Delete chapters under each subject
      await db.chapter.deleteMany({ where: { subjectId: subject.id } });
    }

    // Delete subjects under this class
    await db.subject.deleteMany({ where: { classId: id } });

    // Finally delete the class
    await db.class.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `Class "${cls.name}" deleted successfully` });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json({ error: 'Failed to delete class' }, { status: 500 });
  }
}
