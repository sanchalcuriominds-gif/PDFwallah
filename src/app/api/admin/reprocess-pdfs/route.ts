import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAdminSession } from '@/lib/admin-auth';
import { processNewPdf } from '@/lib/pdf-processor';

/**
 * POST /api/admin/reprocess-pdfs
 *
 * Re-processes existing PDFs to fix:
 * - Page count = 0 (downloads PDF and counts pages server-side)
 * - Missing thumbnails (caches Google Drive thumbnail to Supabase)
 *
 * Request body (optional):
 * {
 *   "pdfId": "specific-pdf-id",   // Process one specific PDF
 *   "fixPageCount": true,          // Fix PDFs with pageCount = 0 (default: true)
 *   "fixThumbnail": true,          // Fix PDFs with no thumbnail (default: true)
 *   "limit": 20                    // Max PDFs to process per call (default: 20)
 * }
 *
 * Authentication: Cookie-based admin session OR API key header
 */

// Helper: validate API key or admin session cookie
async function authenticate(request: NextRequest): Promise<boolean> {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    const validApiKey = process.env.ADMIN_API_KEY;
    if (validApiKey && apiKey === validApiKey) {
      return true;
    }
    return false;
  }

  const token = request.cookies.get('admin_token')?.value;
  if (token && (await validateAdminSession(token))) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    if (!(await authenticate(request))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() || {};
    const fixPageCount = body.fixPageCount !== false;
    const fixThumbnail = body.fixThumbnail !== false;
    const limit = Math.min(body.limit || 20, 50);

    let pdfsToProcess: any[] = [];

    if (body.pdfId) {
      // Process a specific PDF by ID
      const pdf = await db.pdf.findUnique({
        where: { id: body.pdfId },
        select: {
          id: true,
          title: true,
          fullFileUrl: true,
          thumbnailPath: true,
          pageCount: true,
          class: { select: { name: true } },
          subject: { select: { name: true } },
        },
      });
      if (pdf) {
        pdfsToProcess = [pdf];
      }
    } else {
      // Find PDFs that need fixing
      // Get all PDFs and filter in JS (Supabase doesn't support OR + null filters easily)
      const allPdfs = await db.pdf.findMany({
        select: {
          id: true,
          title: true,
          fullFileUrl: true,
          thumbnailPath: true,
          pageCount: true,
          class: { select: { name: true } },
          subject: { select: { name: true } },
        },
        take: 200,
      });

      pdfsToProcess = allPdfs.filter((pdf: any) => {
        if (fixPageCount && (!pdf.pageCount || pdf.pageCount === 0)) return true;
        if (fixThumbnail && !pdf.thumbnailPath) return true;
        return false;
      }).slice(0, limit);
    }

    if (pdfsToProcess.length === 0) {
      return NextResponse.json({
        message: 'No PDFs found that need processing',
        processed: 0,
        results: [],
      });
    }

    console.log(`Reprocess: Found ${pdfsToProcess.length} PDFs to process`);

    const results = [];

    for (const pdf of pdfsToProcess) {
      try {
        // Skip PDFs without a Google Drive URL
        if (!pdf.fullFileUrl) {
          results.push({
            id: pdf.id,
            title: pdf.title,
            skipped: true,
            reason: 'No fullFileUrl (Google Drive URL)',
          });
          continue;
        }

        console.log(`Reprocess: Processing "${pdf.title}" (${pdf.id})...`);

        const processed = await processNewPdf(
          pdf.fullFileUrl,
          pdf.id,
          pdf.pageCount || 0
        );

        const updates: Record<string, any> = {};

        if (processed.pageCount > 0 && processed.pageCount !== (pdf.pageCount || 0)) {
          updates.pageCount = processed.pageCount;
        }

        if (processed.thumbnailPath && !pdf.thumbnailPath) {
          updates.thumbnailPath = processed.thumbnailPath;
        }

        if (Object.keys(updates).length > 0) {
          await db.pdf.update({
            where: { id: pdf.id },
            data: updates,
          });

          results.push({
            id: pdf.id,
            title: pdf.title,
            updated: true,
            oldPageCount: pdf.pageCount || 0,
            newPageCount: processed.pageCount,
            thumbnailCached: !!processed.thumbnailPath,
          });

          console.log(`Reprocess: Updated "${pdf.title}" — pageCount: ${pdf.pageCount || 0} → ${processed.pageCount}, thumbnail: ${processed.thumbnailPath ? 'cached' : 'skipped'}`);
        } else {
          results.push({
            id: pdf.id,
            title: pdf.title,
            updated: false,
            message: 'No changes needed',
          });
        }
      } catch (error) {
        console.error(`Reprocess: Error processing ${pdf.id}:`, error);
        results.push({
          id: pdf.id,
          title: pdf.title,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const updatedCount = results.filter((r: any) => r.updated).length;
    const errorCount = results.filter((r: any) => r.error).length;

    return NextResponse.json({
      message: `Processed ${pdfsToProcess.length} PDFs: ${updatedCount} updated, ${errorCount} errors`,
      processed: pdfsToProcess.length,
      updated: updatedCount,
      errors: errorCount,
      results,
    });
  } catch (error) {
    console.error('Reprocess: Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to reprocess: ${message}` }, { status: 500 });
  }
}
