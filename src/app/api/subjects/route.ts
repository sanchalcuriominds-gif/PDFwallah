import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    
    const where = classId ? { classId } : {};
    
    const subjects = await db.subject.findMany({
      where,
      include: {
        class: true,
        _count: { select: { chapters: true, pdfs: true } }
      },
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
  }
}
