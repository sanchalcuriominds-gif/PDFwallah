import { NextRequest, NextResponse } from 'next/server';
import { validateAdminSession } from '@/lib/admin-auth';
import { uploadFile, getPublicUrl, THUMBNAIL_BUCKET } from '@/lib/supabase';
import { db } from '@/lib/db';

// POST /api/admin/upload-thumbnail - Upload a custom thumbnail image for a PDF
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('admin_token')?.value;
    if (!token || !(await validateAdminSession(token))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('thumbnail') as File | null;
    const pdfId = formData.get('pdfId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No thumbnail file provided' }, { status: 400 });
    }

    if (!pdfId) {
      return NextResponse.json({ error: 'No PDF ID provided' }, { status: 400 });
    }

    // Verify PDF exists
    const pdf = await db.pdf.findUnique({ where: { id: pdfId } });
    if (!pdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    // Upload to Supabase Storage thumbnails bucket
    const filePath = `pdfs/${pdfId}/thumbnail.png`;
    const arrayBuffer = await file.arrayBuffer();

    const { path: uploadedPath, error: uploadError } = await uploadFile(
      THUMBNAIL_BUCKET,
      filePath,
      arrayBuffer,
      'image/png'
    );

    if (uploadError || !uploadedPath) {
      console.error('Thumbnail upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload thumbnail' }, { status: 500 });
    }

    // Get the public URL
    const publicUrl = getPublicUrl(THUMBNAIL_BUCKET, uploadedPath);

    // Update the PDF's thumbnailPath with the Supabase public URL
    await db.pdf.update({
      where: { id: pdfId },
      data: { thumbnailPath: publicUrl },
    });

    return NextResponse.json({
      success: true,
      thumbnailUrl: publicUrl,
    });
  } catch (error) {
    console.error('Error uploading thumbnail:', error);
    return NextResponse.json({ error: 'Failed to upload thumbnail' }, { status: 500 });
  }
}
