import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAdminSession } from '@/lib/admin-auth';

// DELETE /api/admin/subjects/[id] - Delete a subject and all its children
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

    // Check for associated PDFs
    const pdfs = await db.pdf.findMany({ where: { subjectId: id }, take: 1 });
    if (pdfs.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete subject with associated PDFs. Delete or reassign the PDFs first.',
      }, { status: 400 });
    }

    // Delete in order: topics → chapters → subject
    const chapters = await db.chapter.findMany({ where: { subjectId: id } });

    for (const chapter of chapters) {
      await db.topic.deleteMany({ where: { chapterId: chapter.id } });
    }

    await db.chapter.deleteMany({ where: { subjectId: id } });
    await db.subject.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `Subject "${subject.name}" deleted successfully` });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
}
