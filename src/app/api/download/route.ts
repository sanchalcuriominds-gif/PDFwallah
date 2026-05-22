import { NextRequest, NextResponse } from 'next/server';
import { validateDownloadToken, invalidateDownloadToken } from '@/lib/download-token';
import { getPdfFilePath, fileExists } from '@/lib/file-utils';
import { isSupabaseConfigured, getSignedUrl, PDF_BUCKET } from '@/lib/supabase';
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

    // Invalidate the token after use (single-use download link)
    await invalidateDownloadToken(token);

    // Try Supabase Storage first
    if (isSupabaseConfigured()) {
      const { url, error } = await getSignedUrl(PDF_BUCKET, result.pdfPath, 300); // 5 min

      if (!error && url) {
        // Redirect to the signed Supabase URL
        return NextResponse.redirect(url);
      }
    }

    // Fallback to local file storage
    const filePath = getPdfFilePath(result.pdfPath);

    if (!fileExists(filePath)) {
      return NextResponse.json({ error: 'PDF file not found' }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(result.pdfPath);

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
