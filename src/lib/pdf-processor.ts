/**
 * Server-Side PDF Processor
 *
 * Handles:
 * 1. Page counting using pdf-lib (reliable, even for encrypted/linearized PDFs)
 * 2. Thumbnail generation:
 *    - Priority 1: Cache Google Drive thumbnail to Supabase (fast, works for small files)
 *    - Priority 2: Render first page server-side using pdfjs-dist + @napi-rs/canvas (works for ALL PDFs including large ones)
 * 3. PDF downloading from Google Drive
 *
 * Used by the auto-upload route to ensure page count and thumbnails
 * are always correct, regardless of what the Google Apps Script sends.
 */

import { PDFDocument } from 'pdf-lib';
import { extractGoogleDriveFileId, getGoogleDriveThumbnailUrl } from '@/lib/google-drive';
import { uploadFile, getPublicUrl, isSupabaseConfigured, THUMBNAIL_BUCKET } from '@/lib/supabase';

// Timeout wrapper for fetch calls
function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = 15000): Promise<Response> {
  return Promise.race([
    fetch(url, options),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Fetch timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * Download a PDF from Google Drive and return its bytes
 */
export async function downloadPdfFromGoogleDrive(fullFileUrl: string): Promise<Uint8Array | null> {
  try {
    const fileId = extractGoogleDriveFileId(fullFileUrl);
    if (!fileId) {
      console.error('PDF Processor: Could not extract Google Drive file ID from URL:', fullFileUrl);
      return null;
    }

    // Use the direct download URL
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

    console.log(`PDF Processor: Downloading PDF from Google Drive, fileId: ${fileId}`);

    const response = await fetchWithTimeout(downloadUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    }, 60000); // 60s timeout for large PDFs

    if (!response.ok) {
      console.error(`PDF Processor: Google Drive download failed: ${response.status}`);
      return null;
    }

    // Check if we got HTML (virus scan page) instead of PDF
    const contentType = response.headers.get('content-type') || '';
    const arrayBuffer = await response.arrayBuffer();

    if (contentType.includes('text/html') && arrayBuffer.byteLength < 50000) {
      const html = new TextDecoder().decode(arrayBuffer);
      if (html.includes('virus') || html.includes('confirm') || html.includes('scan')) {
        console.log('PDF Processor: Got virus scan page, attempting bypass...');

        // Try with confirm parameter
        const confirmUrl = `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`;
        const confirmResponse = await fetchWithTimeout(confirmUrl, {
          redirect: 'follow',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }, 60000);

        if (confirmResponse.ok) {
          const confirmBuffer = await confirmResponse.arrayBuffer();
          if (isPdfBuffer(confirmBuffer)) {
            return new Uint8Array(confirmBuffer);
          }
        }
      }
    }

    // Validate it's actually a PDF
    if (!isPdfBuffer(arrayBuffer)) {
      console.error(`PDF Processor: Downloaded content is not a valid PDF. Content-Type: ${contentType}, Size: ${arrayBuffer.byteLength}`);
      return null;
    }

    console.log(`PDF Processor: Successfully downloaded PDF, size: ${arrayBuffer.byteLength} bytes`);
    return new Uint8Array(arrayBuffer);
  } catch (error) {
    console.error('PDF Processor: Error downloading PDF:', error);
    return null;
  }
}

/**
 * Count pages in a PDF using pdf-lib
 * This is reliable for all PDF formats including encrypted and linearized PDFs
 */
export async function countPdfPages(pdfBytes: Uint8Array): Promise<number> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBytes, {
      ignoreEncryption: true, // Handle encrypted PDFs
      updateMetadata: false,
    });
    const pageCount = pdfDoc.getPageCount();
    console.log(`PDF Processor: Page count from pdf-lib: ${pageCount}`);
    return pageCount;
  } catch (error) {
    console.error('PDF Processor: Error counting pages with pdf-lib:', error);

    // Fallback: try regex-based counting (same as GAS script)
    try {
      const content = new TextDecoder('latin1').decode(pdfBytes);

      // Method 1: Find /Count in /Pages dictionary
      const countMatches: number[] = [];
      const countRegex = /\/Count\s+(\d+)/g;
      let countMatch;
      while ((countMatch = countRegex.exec(content)) !== null) {
        countMatches.push(parseInt(countMatch[1]));
      }
      if (countMatches.length > 0) {
        const maxCount = Math.max(...countMatches);
        console.log(`PDF Processor: Page count from regex /Count: ${maxCount}`);
        return maxCount;
      }

      // Method 2: Count /Type /Page entries
      let pageCount = 0;
      const pageRegex = /\/Type\s*\/Page(?!s)/g;
      while (pageRegex.exec(content) !== null) {
        pageCount++;
      }
      if (pageCount > 0) {
        console.log(`PDF Processor: Page count from regex /Type /Page: ${pageCount}`);
        return pageCount;
      }
    } catch (regexError) {
      console.error('PDF Processor: Regex fallback also failed:', regexError);
    }

    return 0;
  }
}

/**
 * Render the first page of a PDF to a PNG buffer using server-side pdfjs-dist + @napi-rs/canvas
 * This works for ALL PDFs, including large ones where Google Drive can't generate thumbnails
 */
export async function renderPdfFirstPage(pdfBytes: Uint8Array): Promise<Buffer | null> {
  try {
    // Dynamic imports to avoid bundling issues in client-side code
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const { createCanvas } = await import('@napi-rs/canvas');

    // Canvas factory for pdfjs-dist (required for Node.js rendering)
    class NodeCanvasFactory {
      create(width: number, height: number) {
        const canvas = createCanvas(width, height);
        const context = canvas.getContext('2d');
        return { canvas, context };
      }
      reset(canvasAndContext: any, width: number, height: number) {
        canvasAndContext.canvas = createCanvas(width, height);
        canvasAndContext.context = canvasAndContext.canvas.getContext('2d');
      }
      destroy(canvasAndContext: any) {
        canvasAndContext.canvas = null;
        canvasAndContext.context = null;
      }
    }

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(pdfBytes),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    // Render at scale 1.5 for good quality thumbnails (not too large)
    const scale = 1.5;
    const viewport = page.getViewport({ scale });

    const canvasFactory = new NodeCanvasFactory();
    const { canvas, context } = canvasFactory.create(viewport.width, viewport.height);

    await page.render({
      canvasContext: context,
      viewport,
    }).promise;

    // Convert to PNG buffer
    const pngBuffer = canvas.toBuffer('image/png');

    console.log(`PDF Processor: Rendered first page as PNG, size: ${pngBuffer.length} bytes (${Math.round(viewport.width)}x${Math.round(viewport.height)})`);

    return pngBuffer;
  } catch (error) {
    console.error('PDF Processor: Error rendering PDF first page:', error);
    return null;
  }
}

/**
 * Fetch Google Drive thumbnail and cache it in Supabase Storage
 * Returns the Supabase public URL if successful, null otherwise
 *
 * NOTE: Google Drive thumbnails fail for large PDFs (>~25MB)
 */
export async function cacheGoogleDriveThumbnail(
  fullFileUrl: string,
  pdfId: string
): Promise<string | null> {
  try {
    if (!isSupabaseConfigured()) {
      console.log('PDF Processor: Supabase not configured, skipping thumbnail caching');
      return null;
    }

    const fileId = extractGoogleDriveFileId(fullFileUrl);
    if (!fileId) {
      console.error('PDF Processor: Could not extract Google Drive file ID for thumbnail');
      return null;
    }

    // Fetch the Google Drive thumbnail image
    const thumbnailUrl = getGoogleDriveThumbnailUrl(fileId, 'w400');
    console.log(`PDF Processor: Fetching Google Drive thumbnail for caching: ${thumbnailUrl}`);

    const response = await fetchWithTimeout(thumbnailUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'PDFWallah/1.0',
      },
    }, 15000);

    if (!response.ok) {
      console.log(`PDF Processor: Google Drive thumbnail fetch failed: ${response.status} (will try server-side rendering)`);
      return null;
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Validate it's actually an image (not HTML error page)
    if (contentType.includes('text/html') || imageBuffer.byteLength < 1000) {
      console.log(`PDF Processor: Google Drive thumbnail is not a valid image (Content-Type: ${contentType}, Size: ${imageBuffer.byteLength})`);
      return null;
    }

    const filePath = `pdfs/${pdfId}/thumbnail.png`;

    // Upload to Supabase Storage
    const { path: uploadedPath, error: uploadError } = await uploadFile(
      THUMBNAIL_BUCKET,
      filePath,
      imageBuffer,
      contentType.includes('png') ? 'image/png' : 'image/jpeg'
    );

    if (uploadError || !uploadedPath) {
      console.error('PDF Processor: Thumbnail upload to Supabase failed:', uploadError);
      return null;
    }

    // Get the public URL
    const publicUrl = getPublicUrl(THUMBNAIL_BUCKET, uploadedPath);
    console.log(`PDF Processor: Google Drive thumbnail cached in Supabase: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    console.error('PDF Processor: Error caching Google Drive thumbnail:', error);
    return null;
  }
}

/**
 * Render the first page of a PDF and cache it as thumbnail in Supabase Storage
 * This is the FALLBACK when Google Drive thumbnails don't work (large PDFs, etc.)
 * Returns the Supabase public URL if successful, null otherwise
 */
export async function renderAndCacheThumbnail(
  pdfBytes: Uint8Array,
  pdfId: string
): Promise<string | null> {
  try {
    if (!isSupabaseConfigured()) {
      console.log('PDF Processor: Supabase not configured, skipping thumbnail rendering');
      return null;
    }

    console.log('PDF Processor: Rendering first page as thumbnail (Google Drive thumbnail unavailable)...');

    const pngBuffer = await renderPdfFirstPage(pdfBytes);
    if (!pngBuffer) {
      return null;
    }

    const filePath = `pdfs/${pdfId}/thumbnail.png`;

    // Upload to Supabase Storage
    const { path: uploadedPath, error: uploadError } = await uploadFile(
      THUMBNAIL_BUCKET,
      filePath,
      pngBuffer,
      'image/png'
    );

    if (uploadError || !uploadedPath) {
      console.error('PDF Processor: Rendered thumbnail upload to Supabase failed:', uploadError);
      return null;
    }

    // Get the public URL
    const publicUrl = getPublicUrl(THUMBNAIL_BUCKET, uploadedPath);
    console.log(`PDF Processor: Rendered thumbnail cached in Supabase: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    console.error('PDF Processor: Error rendering and caching thumbnail:', error);
    return null;
  }
}

/**
 * Process a newly uploaded PDF:
 * 1. Download the PDF from Google Drive
 * 2. Count pages server-side using pdf-lib (reliable)
 * 3. Generate thumbnail:
 *    - Try Google Drive thumbnail first (fast)
 *    - If that fails, render first page server-side (works for ALL PDFs)
 * 4. Return updated data
 */
export async function processNewPdf(
  fullFileUrl: string,
  pdfId: string,
  providedPageCount: number
): Promise<{ pageCount: number; thumbnailPath: string | null }> {
  const result: { pageCount: number; thumbnailPath: string | null } = {
    pageCount: providedPageCount,
    thumbnailPath: null,
  };

  // Step 1: Try Google Drive thumbnail first (fast, no need to download the whole PDF)
  console.log('PDF Processor: Trying Google Drive thumbnail...');
  const cachedThumbnail = await cacheGoogleDriveThumbnail(fullFileUrl, pdfId);
  if (cachedThumbnail) {
    result.thumbnailPath = cachedThumbnail;
  }

  // Step 2: Download PDF for page counting and/or thumbnail rendering
  // Download if: pageCount is 0 OR Google Drive thumbnail failed
  const needsDownload = !providedPageCount || providedPageCount === 0 || !result.thumbnailPath;

  if (needsDownload) {
    console.log('PDF Processor: Downloading PDF for server-side processing...');
    const pdfBytes = await downloadPdfFromGoogleDrive(fullFileUrl);

    if (pdfBytes) {
      // Count pages if needed
      if (!providedPageCount || providedPageCount === 0) {
        const serverPageCount = await countPdfPages(pdfBytes);
        if (serverPageCount > 0) {
          result.pageCount = serverPageCount;
        }
      }

      // Render thumbnail if Google Drive thumbnail failed
      if (!result.thumbnailPath) {
        const renderedThumbnail = await renderAndCacheThumbnail(pdfBytes, pdfId);
        if (renderedThumbnail) {
          result.thumbnailPath = renderedThumbnail;
        }
      }
    }
  }

  return result;
}

/**
 * Check if a buffer starts with the PDF magic bytes (%PDF-)
 */
function isPdfBuffer(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 5) return false;
  const header = new Uint8Array(buffer.slice(0, 5));
  const pdfMagic = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
  return header.every((byte, i) => byte === pdfMagic[i]);
}
