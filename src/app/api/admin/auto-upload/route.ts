import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAdminSession } from '@/lib/admin-auth';
import { processNewPdf } from '@/lib/pdf-processor';

/**
 * POST /api/admin/auto-upload
 *
 * Smart upload endpoint for automation (n8n).
 * Accepts category NAMES instead of IDs — auto-creates categories if they don't exist.
 * Also supports API key authentication for non-browser clients.
 *
 * Request body:
 * {
 *   "title": "Class 10 Electricity Notes PDF RBSE | PDFWallah",
 *   "description": "Download Class 10 Electricity Notes PDF...",
 *   "slug": "class-10-electricity-notes-pdf-rbse",        // optional, auto-generated from title
 *   "fullFileUrl": "https://drive.google.com/...",         // required
 *   "previewFileUrl": "https://drive.google.com/...",      // optional
 *   "price": 29,                                           // optional, default 0
 *   "mrp": 49,                                             // optional
 *   "pageCount": 25,                                       // optional
 *   "className": "Class 10",                               // required
 *   "classType": "school",                                 // optional, default "school"
 *   "subjectName": "Science",                              // required
 *   "chapterName": "Electricity",                          // required
 *   "topicName": "Electric Current",                       // optional, defaults to chapterName
 *   "noteTypeName": "Notes",                               // optional
 *   "featured": false,                                     // optional
 *   "published": true,                                     // optional, default true
 *   "skipDuplicate": true                                  // optional, default true
 * }
 *
 * Authentication: Cookie-based (admin_token) OR API key header (x-api-key)
 */

// Helper: generate a URL-safe slug from text
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove special characters
    .replace(/[\s_]+/g, '-')       // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-')           // Replace multiple hyphens with single
    .replace(/^-|-$/g, '');        // Remove leading/trailing hyphens
}

// Helper: validate API key or admin session cookie
async function authenticate(request: NextRequest): Promise<boolean> {
  // Method 1: API key in header (for n8n automation)
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    const validApiKey = process.env.ADMIN_API_KEY;
    if (validApiKey && apiKey === validApiKey) {
      return true;
    }
    // If API key is provided but wrong, reject immediately
    return false;
  }

  // Method 2: Cookie-based admin session (for browser/admin panel)
  const token = request.cookies.get('admin_token')?.value;
  if (token && (await validateAdminSession(token))) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    if (!(await authenticate(request))) {
      return NextResponse.json({ error: 'Unauthorized. Use admin session cookie or x-api-key header.' }, { status: 401 });
    }

    const body = await request.json();

    // === Validate required fields ===
    const { title, fullFileUrl, className, subjectName, chapterName } = body;

    if (!title) {
      return NextResponse.json({ error: 'Missing required field: title' }, { status: 400 });
    }
    if (!fullFileUrl) {
      return NextResponse.json({ error: 'Missing required field: fullFileUrl' }, { status: 400 });
    }
    if (!className) {
      return NextResponse.json({ error: 'Missing required field: className' }, { status: 400 });
    }
    if (!subjectName) {
      return NextResponse.json({ error: 'Missing required field: subjectName' }, { status: 400 });
    }
    if (!chapterName) {
      return NextResponse.json({ error: 'Missing required field: chapterName' }, { status: 400 });
    }

    // === Generate slug if not provided ===
    const slug = body.slug || generateSlug(title);

    // === Duplicate check (skip if title already exists) ===
    const skipDuplicate = body.skipDuplicate !== false; // default true
    if (skipDuplicate) {
      const existing = await db.pdf.findMany({
        where: { title: { contains: title } },
        limit: 5,
      });
      if (existing && existing.length > 0) {
        return NextResponse.json({
          skipped: true,
          message: `PDF with title "${title}" already exists`,
          existingId: existing[0].id,
        }, { status: 200 });
      }
    }

    // === Find or Create Class ===
    const classSlug = generateSlug(className);
    let classRecord = await db.class.findUnique({ where: { slug: classSlug } });

    if (!classRecord) {
      classRecord = await db.class.create({
        data: {
          name: className,
          slug: classSlug,
          type: body.classType || 'school',
          sortOrder: 0,
        },
      });
      console.log(`Auto-Upload: Created class "${className}" (${classRecord.id})`);
    }

    // === Find or Create Subject ===
    const subjectSlug = generateSlug(subjectName);
    let subjectRecord = await db.subject.findMany({
      where: { slug: subjectSlug, classId: classRecord.id },
      limit: 1,
    });

    if (!subjectRecord || subjectRecord.length === 0) {
      subjectRecord = [await db.subject.create({
        data: {
          name: subjectName,
          slug: subjectSlug,
          classId: classRecord.id,
        },
      })];
      console.log(`Auto-Upload: Created subject "${subjectName}" (${subjectRecord[0].id})`);
    }
    const subject = subjectRecord[0];

    // === Find or Create Chapter ===
    const chapterSlug = generateSlug(chapterName);
    let chapterRecord = await db.chapter.findMany({
      where: { slug: chapterSlug, subjectId: subject.id },
      limit: 1,
    });

    if (!chapterRecord || chapterRecord.length === 0) {
      chapterRecord = [await db.chapter.create({
        data: {
          name: chapterName,
          slug: chapterSlug,
          subjectId: subject.id,
        },
      })];
      console.log(`Auto-Upload: Created chapter "${chapterName}" (${chapterRecord[0].id})`);
    }
    const chapter = chapterRecord[0];

    // === Find or Create Topic ===
    const topicName = body.topicName || chapterName; // Default to chapter name if no topic specified
    const topicSlug = generateSlug(topicName);
    let topicRecord = await db.topic.findMany({
      where: { slug: topicSlug, chapterId: chapter.id },
      limit: 1,
    });

    if (!topicRecord || topicRecord.length === 0) {
      topicRecord = [await db.topic.create({
        data: {
          name: topicName,
          slug: topicSlug,
          chapterId: chapter.id,
        },
      })];
      console.log(`Auto-Upload: Created topic "${topicName}" (${topicRecord[0].id})`);
    }
    const topic = topicRecord[0];

    // === Find NoteType if specified ===
    let noteTypeId: string | null = null;
    if (body.noteTypeName) {
      const noteTypeSlug = generateSlug(body.noteTypeName);
      let noteTypeRecord = await db.noteType.findUnique({ where: { slug: noteTypeSlug } });

      if (!noteTypeRecord) {
        noteTypeRecord = await db.noteType.create({
          data: {
            name: body.noteTypeName,
            slug: noteTypeSlug,
          },
        });
        console.log(`Auto-Upload: Created note type "${body.noteTypeName}" (${noteTypeRecord.id})`);
      }
      noteTypeId = noteTypeRecord.id;
    }

    // === Create the PDF entry ===
    const providedPageCount = parseInt(body.pageCount) || 0;
    const providedFileSize = parseInt(body.fileSize) || 0;

    const pdf = await db.pdf.create({
      data: {
        title,
        description: body.description || '',
        price: parseFloat(body.price) || 0,
        mrp: body.mrp ? parseFloat(body.mrp) : null,
        classId: classRecord.id,
        subjectId: subject.id,
        chapterId: chapter.id,
        topicId: topic.id,
        noteTypeId,
        fullFileUrl,
        previewFileUrl: body.previewFileUrl || null,
        thumbnailPath: body.thumbnailPath || null,
        pageCount: providedPageCount,
        fileSize: providedFileSize || null,
        featured: body.featured || false,
        published: body.published !== false, // default true
        pdfPath: `pdfs/${Date.now()}-${slug}.pdf`,
      },
      include: {
        class: true,
        subject: true,
        chapter: true,
        topic: true,
      },
    });

    console.log(`Auto-Upload: Created PDF "${title}" (${pdf.id}) with pageCount=${providedPageCount}`);

    // === Server-Side PDF Processing ===
    // Fix page count (if 0) and auto-generate thumbnail by downloading the PDF
    // This runs AFTER creating the record so the upload response isn't blocked on success
    let finalPageCount = providedPageCount;
    let finalThumbnailPath: string | null = body.thumbnailPath || null;
    let processingMessage = '';

    try {
      console.log(`Auto-Upload: Starting server-side PDF processing for ${pdf.id}...`);
      const processed = await processNewPdf(fullFileUrl, pdf.id, providedPageCount);

      const updates: Record<string, any> = {};

      if (processed.pageCount > 0 && processed.pageCount !== providedPageCount) {
        updates.pageCount = processed.pageCount;
        finalPageCount = processed.pageCount;
        console.log(`Auto-Upload: Updated page count from ${providedPageCount} to ${processed.pageCount}`);
      }

      if (processed.thumbnailPath) {
        updates.thumbnailPath = processed.thumbnailPath;
        finalThumbnailPath = processed.thumbnailPath;
        console.log(`Auto-Upload: Cached thumbnail to Supabase`);
      }

      // Update the PDF record if we have corrections
      if (Object.keys(updates).length > 0) {
        await db.pdf.update({
          where: { id: pdf.id },
          data: updates,
        });
        processingMessage = `Processed: pageCount=${finalPageCount}, thumbnail=${finalThumbnailPath ? 'cached' : 'fallback'}`;
      }
    } catch (processingError) {
      // Don't fail the upload if processing fails — the PDF is still created
      console.error(`Auto-Upload: PDF processing failed (non-fatal):`, processingError);
      processingMessage = 'Processing failed, using provided values';
    }

    return NextResponse.json({
      success: true,
      message: 'PDF uploaded and published successfully',
      processing: processingMessage || undefined,
      pdf: {
        id: pdf.id,
        title: pdf.title,
        slug,
        published: pdf.published,
        pageCount: finalPageCount,
        thumbnailCached: !!finalThumbnailPath,
        class: pdf.class?.name,
        subject: pdf.subject?.name,
        chapter: pdf.chapter?.name,
        topic: pdf.topic?.name,
      },
      created: {
        class: !classRecord ? className : null,
        subject: subjectRecord.length > 1 ? subjectName : null,
        chapter: chapterRecord.length > 1 ? chapterName : null,
        topic: topicRecord.length > 1 ? topicName : null,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Auto-Upload: Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to auto-upload: ${message}` }, { status: 500 });
  }
}

/**
 * GET /api/admin/auto-upload
 *
 * Health check / status endpoint for n8n to verify the API is accessible.
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await authenticate(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return basic stats
    const totalPdfs = await db.pdf.count();
    const totalClasses = await db.class.count();

    return NextResponse.json({
      status: 'ok',
      endpoint: '/api/admin/auto-upload',
      version: '1.0.0',
      stats: {
        totalPdfs,
        totalClasses,
      },
      supportedFields: [
        'title (required)',
        'fullFileUrl (required)',
        'className (required)',
        'subjectName (required)',
        'chapterName (required)',
        'description (optional)',
        'slug (optional, auto-generated)',
        'price (optional, default 0)',
        'mrp (optional)',
        'pageCount (optional)',
        'previewFileUrl (optional)',
        'topicName (optional, defaults to chapterName)',
        'classType (optional, school|competitive)',
        'noteTypeName (optional)',
        'featured (optional, default false)',
        'published (optional, default true)',
        'skipDuplicate (optional, default true)',
      ],
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
