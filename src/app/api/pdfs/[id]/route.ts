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
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        mrp: true,
        pageCount: true,
        previewPageCount: true,
        salesCount: true,
        downloadCount: true,
        featured: true,
        published: true,
        thumbnailPath: true,
        previewFileUrl: true,
        fullFileUrl: true,
        pdfPath: true,
        noteTypeId: true,
        createdAt: true,
        class: { select: { name: true, slug: true } },
        subject: { select: { name: true, slug: true } },
        chapter: { select: { name: true, slug: true } },
        topic: { select: { name: true, slug: true } },
        noteType: { select: { name: true, slug: true } },
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

    const response = NextResponse.json(safePdf);
    response.headers.set('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=60');
    return response;
  } catch (error: any) {
    console.error('Error fetching PDF:', error);
    return NextResponse.json({ error: 'Failed to fetch PDF' }, { status: 500 });
  }
}
