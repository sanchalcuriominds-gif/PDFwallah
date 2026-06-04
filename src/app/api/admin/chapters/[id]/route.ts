import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAdminSession } from '@/lib/admin-auth';

// DELETE /api/admin/chapters/[id] - Delete a chapter and all its children
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

    // Check for associated PDFs
    const pdfs = await db.pdf.findMany({ where: { chapterId: id }, take: 1 });
    if (pdfs.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete chapter with associated PDFs. Delete or reassign the PDFs first.',
      }, { status: 400 });
    }

    // Delete topics first, then chapter
    await db.topic.deleteMany({ where: { chapterId: id } });
    await db.chapter.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `Chapter "${chapter.name}" deleted successfully` });
  } catch (error) {
    console.error('Error deleting chapter:', error);
    return NextResponse.json({ error: 'Failed to delete chapter' }, { status: 500 });
  }
}
