import { NextRequest, NextResponse } from 'next/server';
import { validateDownloadToken, incrementDownloadUseCount } from '@/lib/download-token';

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

    // Proxy the PDF file - never expose the actual URL
    const pdfUrl = result.pdfUrl;

    console.log('Downloading PDF from:', pdfUrl.substring(0, 80) + '...');

    // Add confirm=t for Google Drive shared links to bypass virus scan warning
    let fetchUrl = pdfUrl;
    if (fetchUrl.includes('drive.google.com') && !fetchUrl.includes('confirm=')) {
      const separator = fetchUrl.includes('?') ? '&' : '?';
      fetchUrl = `${fetchUrl}${separator}confirm=t`;
    }

    try {
      const response = await fetch(fetchUrl, {
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

      const contentType = response.headers.get('content-type') || 'application/pdf';
      const pdfBuffer = await response.arrayBuffer();

      // Use the PDF title from validation result if available
      const filename = result.pdfTitle
        ? `${result.pdfTitle.replace(/[^a-zA-Z0-9._-]/g, '_')}.pdf`
        : 'PDFWallah_Notes.pdf';

      // Force download with Content-Disposition: attachment
      // and prevent browser from trying to display the PDF inline
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Content-Type-Options': 'nosniff',
          'Content-Length': pdfBuffer.byteLength.toString(),
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
