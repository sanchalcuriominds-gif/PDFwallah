import { NextRequest, NextResponse } from 'next/server';

/**
 * Render a specific page of a PDF as a thumbnail image.
 *
 * This route is a FALLBACK that tells the client to render the thumbnail
 * using client-side PDF.js. The actual rendering happens in the browser
 * because server-side rendering requires native canvas modules that
 * aren't available on Vercel's serverless platform.
 *
 * The client should use the /api/admin/proxy-pdf endpoint to fetch the PDF
 * (avoiding CORS), then render the page with PDF.js and upload via
 * /api/admin/upload-thumbnail.
 *
 * This route just returns the proxy URL the client should use.
 */
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await validateAdminSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { driveUrl, pageNumber } = body;

    if (!driveUrl) {
      return NextResponse.json({ error: 'Missing driveUrl' }, { status: 400 });
    }

    // Return the proxy URL for client-side rendering
    const proxyUrl = `/api/admin/proxy-pdf?url=${encodeURIComponent(driveUrl)}`;

    return NextResponse.json({
      renderClientSide: true,
      proxyUrl,
      pageNumber: pageNumber || 1,
    });
  } catch (error) {
    console.error('Render-Thumbnail: Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

import { validateAdminSession } from '@/lib/admin-auth';
