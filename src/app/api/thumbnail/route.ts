import { NextRequest, NextResponse } from 'next/server';
import { getThumbnailFilePath, fileExists } from '@/lib/file-utils';
import { isSupabaseConfigured, getSignedUrl, THUMBNAIL_BUCKET } from '@/lib/supabase';
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

    // Try Supabase Storage first
    if (isSupabaseConfigured()) {
      const { url, error } = await getSignedUrl(THUMBNAIL_BUCKET, thumbPath, 3600); // 1 hour

      if (!error && url) {
        return NextResponse.redirect(url);
      }
    }

    // Fallback to local file
    const filePath = getThumbnailFilePath(thumbPath);

    if (!fileExists(filePath)) {
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
