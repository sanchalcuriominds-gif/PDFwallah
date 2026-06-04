import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAdminSession } from '@/lib/admin-auth';

// DELETE /api/admin/topics/[id] - Delete a topic
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

    // Check if topic exists
    const topic = await db.topic.findUnique({ where: { id } });
    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // Check for associated PDFs
    const pdfs = await db.pdf.findMany({ where: { topicId: id }, take: 1 });
    if (pdfs.length > 0) {
      return NextResponse.json({
        error: 'Cannot delete topic with associated PDFs. Delete or reassign the PDFs first.',
      }, { status: 400 });
    }

    await db.topic.delete({ where: { id } });

    return NextResponse.json({ success: true, message: `Topic "${topic.name}" deleted successfully` });
  } catch (error) {
    console.error('Error deleting topic:', error);
    return NextResponse.json({ error: 'Failed to delete topic' }, { status: 500 });
  }
}
