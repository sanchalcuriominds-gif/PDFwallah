import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPdfFilePath, fileExists } from '@/lib/file-utils';
import { isSupabaseConfigured, getSignedUrl, PDF_BUCKET } from '@/lib/supabase';
import { getGoogleDriveEmbedUrl, isGoogleDriveUrl } from '@/lib/google-drive';
import fs from 'fs';

// GET /api/preview?id=xxx - Get preview file for a PDF (publicly accessible)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pdfId = searchParams.get('id');

    if (!pdfId) {
      return NextResponse.json({ error: 'PDF ID is required' }, { status: 400 });
    }

    const pdf = await db.pdf.findUnique({
      where: { id: pdfId },
      select: {
        id: true,
        title: true,
        previewFilePath: true,
        previewFileUrl: true,
        published: true,
      },
    });

    if (!pdf || !pdf.published) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    // Priority 1: Google Drive / external URL for preview
    if (pdf.previewFileUrl) {
      // Convert Google Drive sharing URL to embed URL for iframe
      if (isGoogleDriveUrl(pdf.previewFileUrl)) {
        const embedUrl = getGoogleDriveEmbedUrl(pdf.previewFileUrl);
        return NextResponse.json({
          type: 'google-drive',
          url: embedUrl || pdf.previewFileUrl,
          originalUrl: pdf.previewFileUrl,
          title: pdf.title,
        });
      }
      // Non-Google Drive external URL
      return NextResponse.json({
        type: 'external',
        url: pdf.previewFileUrl,
        title: pdf.title,
      });
    }

    // Priority 2: Supabase Storage
    if (pdf.previewFilePath && isSupabaseConfigured()) {
      const { url, error } = await getSignedUrl(PDF_BUCKET, pdf.previewFilePath, 3600);
      if (!error && url) {
        return NextResponse.json({
          type: 'signed',
          url,
          title: pdf.title,
        });
      }
    }

    // Priority 3: Local file storage
    if (pdf.previewFilePath) {
      const filePath = getPdfFilePath(pdf.previewFilePath);
      if (fileExists(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="preview-${pdf.title}.pdf"`,
            'Cache-Control': 'public, max-age=3600',
          },
        });
      }
    }

    // No preview available
    return NextResponse.json({
      type: 'none',
      url: null,
      title: pdf.title,
      message: 'No preview available for this note',
    });
  } catch (error) {
    console.error('Error fetching preview:', error);
    return NextResponse.json({ error: 'Failed to fetch preview' }, { status: 500 });
  }
}
