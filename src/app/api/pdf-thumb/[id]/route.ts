import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractGoogleDriveFileId, getGoogleDriveThumbnailUrl } from '@/lib/google-drive';

// GET /api/pdf-thumb/[id] - Proxy Google Drive thumbnail for a PDF
// This avoids CORS issues and allows us to cache aggressively
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch the PDF from the database
    const pdf = await db.pdf.findUnique({
      where: { id },
    });

    if (!pdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    // Try to extract Google Drive file ID from available URL fields
    const fields = [
      pdf.thumbnailPath,
      pdf.previewFileUrl,
      pdf.fullFileUrl,
      pdf.pdfPath,
    ];

    let fileId: string | null = null;
    for (const field of fields) {
      if (!field) continue;
      fileId = extractGoogleDriveFileId(field);
      if (fileId) break;
    }

    if (!fileId) {
      return NextResponse.json({ error: 'No thumbnail available' }, { status: 404 });
    }

    // Fetch the Google Drive thumbnail
    const thumbnailUrl = getGoogleDriveThumbnailUrl(fileId, 'w400');
    const response = await fetch(thumbnailUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'PDFWallah/1.0',
      },
    });

    if (!response.ok) {
      console.error(`Google Drive thumbnail fetch failed: ${response.status} for PDF ${id}`);
      return NextResponse.json({ error: 'Thumbnail fetch failed' }, { status: 502 });
    }

    const imageBuffer = await response.arrayBuffer();

    // Determine content type from response headers or default to JPEG
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with aggressive caching (30 days)
    // Google Drive thumbnails don't change for a given file ID
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable',
        'CDN-Cache-Control': 'public, max-age=2592000',
        'Vercel-CDN-Cache-Control': 'public, max-age=2592000',
      },
    });
  } catch (error) {
    console.error('Error serving PDF thumbnail:', error);
    return NextResponse.json({ error: 'Failed to serve thumbnail' }, { status: 500 });
  }
}
