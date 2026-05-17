import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getThumbnailFilePath, getPdfFilePath, fileExists } from '@/lib/file-utils';
import fs from 'fs';

// GET /api/thumbnail?path=xxx - Serve thumbnail image
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const thumbPath = searchParams.get('path');

    if (!thumbPath) {
      return NextResponse.json({ error: 'Path is required' }, { status: 400 });
    }

    // Security: prevent directory traversal
    if (thumbPath.includes('..')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const filePath = getThumbnailFilePath(thumbPath);

    if (!fileExists(filePath)) {
      // Return a default placeholder
      return new NextResponse(null, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const ext = thumbPath.split('.').pop()?.toLowerCase();
    const contentType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'gif' ? 'image/gif' : 'image/png';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error serving thumbnail:', error);
    return NextResponse.json({ error: 'Failed to serve thumbnail' }, { status: 500 });
  }
}
