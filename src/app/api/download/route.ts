import { NextRequest, NextResponse } from 'next/server';
import { validateDownloadToken, invalidateDownloadToken } from '@/lib/download-token';
import { getPdfFilePath, fileExists } from '@/lib/file-utils';
import fs from 'fs';
import path from 'path';

// GET /api/download?token=xxx - Download a PDF with valid token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Download token is required' }, { status: 400 });
    }

    const result = await validateDownloadToken(token);

    if (!result.valid || !result.pdfPath) {
      return NextResponse.json({ error: 'Invalid or expired download link' }, { status: 403 });
    }

    const filePath = getPdfFilePath(result.pdfPath);

    if (!fileExists(filePath)) {
      return NextResponse.json({ error: 'PDF file not found' }, { status: 404 });
    }

    // Read the PDF file
    const fileBuffer = fs.readFileSync(filePath);

    // Create a watermarked version info (in production, use pdf-lib to add watermark)
    // For now, we'll serve the file with appropriate headers
    const fileName = path.basename(result.pdfPath);

    // Invalidate the token after use (single-use download link)
    await invalidateDownloadToken(token);

    // Return the PDF file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
