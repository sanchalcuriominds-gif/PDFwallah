/**
 * PDF Page Renderer Utility
 * 
 * Renders a specific page of a PDF to a PNG image blob using PDF.js.
 * Runs entirely in the browser (client-side) — no server needed.
 */

import * as pdfjsLib from 'pdfjs-dist'

// Set up the worker for PDF.js
// We use the CDN version to avoid bundling the worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
}

/**
 * Render a specific page of a PDF to a PNG Blob
 * 
 * @param pdfUrl - URL of the PDF file (can be a Google Drive download URL, blob URL, etc.)
 * @param pageNum - The page number to render (1-indexed)
 * @param scale - Render scale factor (default 2 for crisp thumbnails)
 * @returns Promise<Blob> - PNG image blob of the rendered page
 */
export async function renderPdfPageToBlob(
  pdfUrl: string,
  pageNum: number = 1,
  scale: number = 2
): Promise<Blob> {
  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({
    url: pdfUrl,
    // Disable font rendering issues
    useSystemFonts: true,
  })

  const pdf = await loadingTask.promise

  // Validate page number
  if (pageNum < 1 || pageNum > pdf.numPages) {
    throw new Error(`Page number ${pageNum} is out of range. PDF has ${pdf.numPages} pages.`)
  }

  // Get the specific page
  const page = await pdf.getPage(pageNum)

  // Get the viewport at the desired scale
  const viewport = page.getViewport({ scale })

  // Create a canvas element
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const context = canvas.getContext('2d')!

  // Render the page to the canvas
  await page.render({
    canvasContext: context,
    viewport,
  }).promise

  // Convert canvas to PNG blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to convert canvas to blob'))
        }
      },
      'image/png',
      1.0
    )
  })
}

/**
 * Get the total number of pages in a PDF
 */
export async function getPdfPageCount(pdfUrl: string): Promise<number> {
  const loadingTask = pdfjsLib.getDocument({
    url: pdfUrl,
    useSystemFonts: true,
  })
  const pdf = await loadingTask.promise
  return pdf.numPages
}

/**
 * Convert a Google Drive "view" URL to a direct download URL
 * that PDF.js can fetch and parse
 */
export function getGoogleDriveDownloadUrl(viewUrl: string): string {
  // Extract file ID from Google Drive URL
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ]

  for (const pattern of patterns) {
    const match = viewUrl.match(pattern)
    if (match) {
      // Use the Google Drive export/download URL
      return `https://drive.google.com/uc?export=download&id=${match[1]}`
    }
  }

  // Return as-is if not a Google Drive URL
  return viewUrl
}
