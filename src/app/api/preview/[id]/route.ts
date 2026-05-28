import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

const MAX_PREVIEW_PAGES = 2;

/**
 * Convert Google Drive view/share URLs to direct download URLs
 */
function convertToDirectDownloadUrl(url: string): string {
  if (url.includes('drive.google.com/uc?export=download')) return url;

  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) {
    return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
  }

  const idParamMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch) {
    return `https://drive.google.com/uc?export=download&id=${idParamMatch[1]}`;
  }

  return url;
}

/**
 * Add diagonal watermark text to a PDF page
 */
async function addWatermarkToPage(
  pdfDoc: PDFDocument,
  page: any,
  text: string,
  font: any
) {
  const { width, height } = page.getSize();
  const fontSize = Math.min(width, height) * 0.06;

  const lines = [
    { x: width * 0.1, y: height * 0.85, rotation: degrees(-35) },
    { x: width * 0.5, y: height * 0.55, rotation: degrees(-35) },
    { x: width * 0.15, y: height * 0.25, rotation: degrees(-35) },
  ];

  for (const line of lines) {
    page.drawText(text, {
      x: line.x,
      y: line.y,
      size: fontSize,
      font: font,
      color: rgb(0.85, 0.85, 0.85),
      opacity: 0.4,
      rotate: line.rotation,
    });
  }
}

/**
 * Fetch PDF from Google Drive with retry logic
 */
async function fetchPdfFromUrl(url: string): Promise<ArrayBuffer | null> {
  const directUrl = convertToDirectDownloadUrl(url);

  const response = await fetch(directUrl, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    if (directUrl.includes('drive.google.com')) {
      const confirmUrl = directUrl + '&confirm=t';
      const retryResponse = await fetch(confirmUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (retryResponse.ok) {
        const buffer = await retryResponse.arrayBuffer();
        const buf = Buffer.from(buffer);
        if (buf.length > 4 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
          return buffer;
        }
      }
    }
    return null;
  }

  const pdfBuffer = await response.arrayBuffer();
  const buf = Buffer.from(pdfBuffer);
  const isPdf = buf.length > 4 &&
    buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46;

  if (!isPdf) {
    if (directUrl.includes('drive.google.com')) {
      const confirmUrl = directUrl + '&confirm=t';
      const retryResponse = await fetch(confirmUrl, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (retryResponse.ok) {
        const retryBuffer = await retryResponse.arrayBuffer();
        const retryBuf = Buffer.from(retryBuffer);
        if (retryBuf.length > 4 && retryBuf[0] === 0x25 && retryBuf[1] === 0x50 && retryBuf[2] === 0x44 && retryBuf[3] === 0x46) {
          return retryBuffer;
        }
      }
    }
    return null;
  }

  return pdfBuffer;
}

// GET /api/preview/[id] - Serve preview PDF (limited to 2 pages, watermarked)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const pdf = await db.pdf.findUnique({
      where: { id },
    });

    if (!pdf) {
      return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
    }

    const previewUrl = (pdf as any).previewFileUrl || (pdf as any).fullFileUrl || pdf.pdfPath;

    if (!previewUrl) {
      return NextResponse.json({ error: 'No preview available' }, { status: 404 });
    }

    const pdfBuffer = await fetchPdfFromUrl(previewUrl);

    if (!pdfBuffer) {
      console.error('Failed to fetch preview PDF:', previewUrl);
      return NextResponse.json({ error: 'Failed to load preview' }, { status: 502 });
    }

    try {
      const sourcePdf = await PDFDocument.load(pdfBuffer);
      const totalPages = sourcePdf.getPageCount();

      const newPdf = await PDFDocument.create();
      const pagesToCopy = Math.min(totalPages, MAX_PREVIEW_PAGES);
      const copiedPages = await newPdf.copyPages(sourcePdf, Array.from({ length: pagesToCopy }, (_, i) => i));

      const font = await newPdf.embedFont(StandardFonts.HelveticaBold);
      const watermarkText = 'PREVIEW — PDFWALLAH';

      for (let i = 0; i < copiedPages.length; i++) {
        const page = copiedPages[i];
        newPdf.addPage(page);
        await addWatermarkToPage(newPdf, newPdf.getPage(i), watermarkText, font);
      }

      if (totalPages > MAX_PREVIEW_PAGES) {
        const noticePage = newPdf.addPage([595, 842]);
        const { width, height } = noticePage.getSize();

        noticePage.drawText('Preview Only', {
          x: width / 2 - 80,
          y: height / 2 + 60,
          size: 28,
          font: font,
          color: rgb(0.13, 0.55, 0.13),
        });

        noticePage.drawText(`This preview shows only ${MAX_PREVIEW_PAGES} of ${totalPages} pages.`, {
          x: width / 2 - 180,
          y: height / 2,
          size: 14,
          font: await newPdf.embedFont(StandardFonts.Helvetica),
          color: rgb(0.4, 0.4, 0.4),
        });

        noticePage.drawText('Purchase the full notes to access all pages.', {
          x: width / 2 - 185,
          y: height / 2 - 30,
          size: 14,
          font: await newPdf.embedFont(StandardFonts.Helvetica),
          color: rgb(0.4, 0.4, 0.4),
        });

        noticePage.drawText('— PDFWallah —', {
          x: width / 2 - 60,
          y: height / 2 - 80,
          size: 12,
          font: font,
          color: rgb(0.13, 0.55, 0.13),
        });
      }

      const protectedPdfBytes = await newPdf.save();

      return new NextResponse(protectedPdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
          'Content-Length': protectedPdfBytes.byteLength.toString(),
        },
      });
    } catch (pdfLibError) {
      console.error('pdf-lib processing failed, serving original:', pdfLibError);

      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
          'Content-Length': pdfBuffer.byteLength.toString(),
        },
      });
    }
  } catch (error) {
    console.error('Error serving preview:', error);
    return NextResponse.json({ error: 'Preview failed' }, { status: 500 });
  }
}
