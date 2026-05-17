import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/pdfs/[id] - Get single PDF details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const pdf = await db.pdf.findUnique({
      where: { id },
      include: {
        class: true,
        subject: true,
        chapter: true,
        topic: true,
      },
    });

    if (!pdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    // Don't expose the full pdfPath publicly
    const safePdf = {
      ...pdf,
      pdfPath: undefined,
      hasFile: !!pdf.pdfPath,
    };

    return NextResponse.json(safePdf);
  } catch (error) {
    console.error('Error fetching PDF:', error);
    return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 });
  }
}
