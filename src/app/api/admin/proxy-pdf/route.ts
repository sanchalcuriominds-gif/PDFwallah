import { NextRequest, NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/admin-auth';
import { extractGoogleDriveFileId } from '@/lib/google-drive';

// GET /api/admin/proxy-pdf - Proxy a Google Drive PDF for client-side PDF.js rendering
// This avoids CORS issues since the browser can't fetch Google Drive PDFs directly
export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await validateAdminSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const urlParam = request.nextUrl.searchParams.get('url');
    if (!urlParam) {
      return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
    }

    // Extract Google Drive file ID and build download URL
    const fileId = extractGoogleDriveFileId(urlParam);
    if (!fileId) {
      return NextResponse.json({ error: 'Could not extract Google Drive file ID' }, { status: 400 });
    }

    // Try the Google Drive thumbnail-based approach first (lightweight - just for page rendering)
    // Use the export/download URL
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    console.log(`Proxy: Fetching PDF from Google Drive, fileId: ${fileId}`);

    // Fetch the PDF server-side (no CORS restrictions)
    const response = await fetch(downloadUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      console.error(`Proxy: Google Drive fetch failed: ${response.status}`);
      return NextResponse.json({ error: `Failed to fetch PDF from Google Drive (${response.status})` }, { status: 502 });
    }

    // Check if we got a PDF (Google Drive sometimes returns HTML for virus scan warnings)
    const contentType = response.headers.get('content-type') || '';
    const pdfBuffer = await response.arrayBuffer();

    if (contentType.includes('text/html') && pdfBuffer.byteLength < 50000) {
      // Likely a virus scan confirmation page - try to extract the confirm link
      const html = new TextDecoder().decode(pdfBuffer);
      if (html.includes('virus') || html.includes('confirm') || html.includes('scan')) {
        console.log('Proxy: Got virus scan page, attempting to bypass...');

        // Try with confirm parameter
        const confirmUrl = `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`;
        const confirmResponse = await fetch(confirmUrl, {
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (confirmResponse.ok) {
          const confirmContentType = confirmResponse.headers.get('content-type') || '';
          const confirmBuffer = await confirmResponse.arrayBuffer();

          // Check if this is actually a PDF now
          if (confirmContentType.includes('pdf') || isPdfBuffer(confirmBuffer)) {
            return new NextResponse(confirmBuffer, {
              headers: {
                'Content-Type': 'application/pdf',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-store',
              },
            });
          }
        }
      }
    }

    // Validate that we actually got a PDF
    if (!isPdfBuffer(pdfBuffer)) {
      console.error(`Proxy: Response is not a valid PDF. Content-Type: ${contentType}, Size: ${pdfBuffer.byteLength}`);
      return NextResponse.json({ error: 'Downloaded file is not a valid PDF' }, { status: 502 });
    }

    console.log(`Proxy: Successfully fetched PDF, size: ${pdfBuffer.byteLength} bytes`);

    // Return the PDF with CORS-friendly headers
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error proxying PDF:', error);
    return NextResponse.json({ error: 'Failed to proxy PDF' }, { status: 500 });
  }
}

/**
 * Check if a buffer starts with the PDF magic bytes (%PDF-)
 */
function isPdfBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 5) return false;
  const header = new Uint8Array(buffer.slice(0, 5));
  const pdfMagic = [0x25, 0x50, 0x44, 0x46, 0x2D]; // %PDF-
  return header.every((byte, i) => byte === pdfMagic[i]);
}
