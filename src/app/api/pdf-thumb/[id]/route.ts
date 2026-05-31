import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractGoogleDriveFileId, getGoogleDriveThumbnailUrl } from '@/lib/google-drive';
import { isSupabaseConfigured, getSupabaseAdmin, THUMBNAIL_BUCKET } from '@/lib/supabase';

// GET /api/pdf-thumb/[id] - Serve thumbnail image for a PDF
// Priority: 1) Custom thumbnail in Supabase Storage, 2) Google Drive auto thumbnail
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

    // === PRIORITY 1: Check if there's a custom thumbnail in Supabase Storage ===
    // thumbnailPath will contain a Supabase public URL if a custom thumbnail was uploaded
    if (pdf.thumbnailPath && pdf.thumbnailPath.includes('supabase.co') && pdf.thumbnailPath.includes('/storage/v1/object/public/')) {
      try {
        const thumbResponse = await fetch(pdf.thumbnailPath, {
          redirect: 'follow',
        });
        if (thumbResponse.ok) {
          const imageBuffer = await thumbResponse.arrayBuffer();
          const contentType = thumbResponse.headers.get('content-type') || 'image/png';
          return new NextResponse(imageBuffer, {
            headers: {
              'Content-Type': contentType,
              // Custom thumbnails are user-chosen pages - cache 1 day so updates are visible
              'Cache-Control': 'public, max-age=86400, s-maxage=86400',
            },
          });
        }
      } catch (e) {
        console.error('Failed to fetch custom thumbnail, falling back to Google Drive:', e);
      }
    }

    // === PRIORITY 2: Try Google Drive auto thumbnail ===
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
