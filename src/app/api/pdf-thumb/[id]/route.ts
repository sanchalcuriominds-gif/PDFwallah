import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { extractGoogleDriveFileId, getGoogleDriveThumbnailUrl } from '@/lib/google-drive';
import { isSupabaseConfigured } from '@/lib/supabase';
import { downloadPdfFromGoogleDrive, renderAndCacheThumbnail } from '@/lib/pdf-processor';

// GET /api/pdf-thumb/[id] - Serve thumbnail image for a PDF
// Priority: 1) Custom thumbnail in Supabase Storage, 2) Google Drive auto thumbnail, 3) Server-side render
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
    // thumbnailPath will contain a Supabase public URL if a custom thumbnail was uploaded/rendered
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
        console.error('Failed to fetch custom thumbnail, falling back:', e);
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

    if (fileId) {
      const thumbnailUrl = getGoogleDriveThumbnailUrl(fileId, 'w400');
      const response = await fetch(thumbnailUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'PDFWallah/1.0',
        },
      });

      if (response.ok) {
        const imageBuffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        // Validate it's actually an image
        if (!contentType.includes('text/html') && imageBuffer.byteLength > 1000) {
          return new NextResponse(imageBuffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable',
              'CDN-Cache-Control': 'public, max-age=2592000',
              'Vercel-CDN-Cache-Control': 'public, max-age=2592000',
            },
          });
        }
      }

      console.log(`Google Drive thumbnail failed for PDF ${id}, trying server-side render...`);
    }

    // === PRIORITY 3: Server-side render first page ===
    // This handles cases where Google Drive can't generate thumbnails (large PDFs, etc.)
    if (pdf.fullFileUrl && isSupabaseConfigured()) {
      try {
        console.log(`Attempting server-side thumbnail render for PDF ${id}...`);
        const pdfBytes = await downloadPdfFromGoogleDrive(pdf.fullFileUrl);

        if (pdfBytes) {
          const thumbnailUrl = await renderAndCacheThumbnail(pdfBytes, id);

          if (thumbnailUrl) {
            // Update the PDF record with the new thumbnail URL
            await db.pdf.update({
              where: { id },
              data: { thumbnailPath: thumbnailUrl },
            });

            // Fetch and return the newly cached thumbnail
            const thumbResponse = await fetch(thumbnailUrl, { redirect: 'follow' });
            if (thumbResponse.ok) {
              const imageBuffer = await thumbResponse.arrayBuffer();
              const contentType = thumbResponse.headers.get('content-type') || 'image/png';
              return new NextResponse(imageBuffer, {
                headers: {
                  'Content-Type': contentType,
                  'Cache-Control': 'public, max-age=86400, s-maxage=86400',
                },
              });
            }
          }
        }
      } catch (renderError) {
        console.error(`Server-side thumbnail render failed for PDF ${id}:`, renderError);
      }
    }

    // === FALLBACK: Return a simple placeholder image ===
    // Generate a minimal SVG placeholder so the UI doesn't show a broken image
    const svgPlaceholder = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#34d399;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#14b8a6;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#bg)"/>
      <g transform="translate(170,100)">
        <path d="M0 0h40v50H0z" fill="none" stroke="white" stroke-width="2" opacity="0.6"/>
        <path d="M10 0v20H0" fill="none" stroke="white" stroke-width="2" opacity="0.6"/>
        <rect x="8" y="25" width="24" height="2" rx="1" fill="white" opacity="0.5"/>
        <rect x="8" y="31" width="18" height="2" rx="1" fill="white" opacity="0.5"/>
        <rect x="8" y="37" width="22" height="2" rx="1" fill="white" opacity="0.5"/>
      </g>
      <text x="200" y="180" text-anchor="middle" fill="white" font-family="system-ui,sans-serif" font-size="14" opacity="0.8">Preview Loading...</text>
    </svg>`;

    return new NextResponse(svgPlaceholder, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60, s-maxage=60', // Short cache - retry soon
      },
    });
  } catch (error) {
    console.error('Error serving PDF thumbnail:', error);
    return NextResponse.json({ error: 'Failed to serve thumbnail' }, { status: 500 });
  }
}
