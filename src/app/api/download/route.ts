import { NextRequest, NextResponse } from 'next/server';
import { validateDownloadToken, incrementDownloadUseCount } from '@/lib/download-token';

// Convert Google Drive URLs to direct download URLs
// Google Drive "view" links (e.g. /file/d/ID/view) return HTML, not the file.
// We need to convert them to /uc?export=download&id=ID format which returns the actual file.
function getDirectDownloadUrl(url: string): string {
  if (!url) return url;

  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
  // Pattern 2: https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    const fileId = fileMatch[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  }

  // Pattern 3: https://drive.google.com/open?id=FILE_ID
  const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
  if (openMatch) {
    const fileId = openMatch[1];
    return `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;
  }

  // Pattern 4: Already a /uc?export=download URL — just add confirm=t if missing
  if (url.includes('drive.google.com/uc') && !url.includes('confirm=')) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}confirm=t`;
  }

  // Not a Google Drive URL — return as-is
  return url;
}

// GET /api/download?token=xxx - Download a PDF with valid token
// Uses proxy approach to never expose Google Drive URLs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Download token is required' }, { status: 400 });
    }

    const result = await validateDownloadToken(token);

    if (!result.valid || !result.pdfUrl) {
      return NextResponse.json(
        {
          error: result.reason || 'Invalid or expired download link',
          recoveryUrl: '/recover'
        },
        { status: 403 }
      );
    }

    // Increment download use count (before serving the file)
    await incrementDownloadUseCount(token);

    // Convert Google Drive view URLs to direct download URLs
    const pdfUrl = getDirectDownloadUrl(result.pdfUrl);

    console.log('Downloading PDF from:', pdfUrl.substring(0, 80) + '...');

    try {
      const response = await fetch(pdfUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch PDF from storage:', response.status, response.statusText);
        return NextResponse.json(
          {
            error: 'Failed to download file. Please try again later.',
            recoveryUrl: '/recover'
          },
          { status: 502 }
        );
      }

      // Check if response is actually a PDF (not HTML error page)
      const contentType = response.headers.get('content-type') || '';
      const buffer = await response.arrayBuffer();

      // Google Drive sometimes returns an HTML page with a virus scan warning
      // for large files. Check if we got HTML instead of PDF.
      if (contentType.includes('text/html') || 
          (buffer.byteLength < 1000 && new TextDecoder().decode(buffer).includes('<html'))) {
        console.error('Got HTML instead of PDF. URL may need virus scan confirmation.');
        // Try with a cookie-based approach — add a random t parameter
        const retryUrl = pdfUrl + '&t=' + Date.now();
        const retryResponse = await fetch(retryUrl, {
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Cookie': 'NID=placeholder', // Sometimes helps bypass virus scan
          },
        });
        
        if (retryResponse.ok) {
          const retryBuffer = await retryResponse.arrayBuffer();
          const retryContentType = retryResponse.headers.get('content-type') || '';
          
          if (!retryContentType.includes('text/html') && retryBuffer.byteLength > 1000) {
            // Got the actual file on retry
            const filename = result.pdfTitle
              ? `${result.pdfTitle.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100)}.pdf`
              : 'PDFWallah_Notes.pdf';

            return new NextResponse(retryBuffer, {
              headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
                'Cache-Control': 'no-store, no-cache, must-revalidate',
                'X-Content-Type-Options': 'nosniff',
                'Content-Length': retryBuffer.byteLength.toString(),
              },
            });
          }
        }

        return NextResponse.json(
          {
            error: 'File is too large for direct download. Please contact support.',
            recoveryUrl: '/recover'
          },
          { status: 502 }
        );
      }

      // Use the PDF title for filename
      const filename = result.pdfTitle
        ? `${result.pdfTitle.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100)}.pdf`
        : 'PDFWallah_Notes.pdf';

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Content-Type-Options': 'nosniff',
          'Content-Length': buffer.byteLength.toString(),
        },
      });
    } catch (fetchError) {
      console.error('Error proxying PDF:', fetchError);
      return NextResponse.json(
        {
          error: 'Failed to download file. Please try again later.',
          recoveryUrl: '/recover'
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
