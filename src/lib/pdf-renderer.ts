/**
 * PDF Page Renderer Utility - CDN Version
 *
 * Renders a specific page of a PDF to a PNG image blob using PDF.js.
 * Loads PDF.js from CDN to avoid webpack/Next.js bundling issues.
 * Runs entirely in the browser (client-side).
 */

let pdfjsLoaded = false;
let pdfjsLib: any = null;

/**
 * Load PDF.js from CDN (only once)
 */
async function loadPdfJs(): Promise<any> {
  if (pdfjsLoaded && pdfjsLib) return pdfjsLib;

  return new Promise((resolve, reject) => {
    // Check if already loaded globally
    if ((window as any).pdfjsLib) {
      pdfjsLib = (window as any).pdfjsLib;
      pdfjsLoaded = true;
      resolve(pdfjsLib);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs';
    script.type = 'module';

    // For module scripts, we need a different approach
    // Use the global assignment method instead
    const globalScript = document.createElement('script');
    globalScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    globalScript.onload = () => {
      pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        // Set worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        pdfjsLoaded = true;
        resolve(pdfjsLib);
      } else {
        reject(new Error('PDF.js failed to load'));
      }
    };
    globalScript.onerror = () => reject(new Error('Failed to load PDF.js from CDN'));

    document.head.appendChild(globalScript);
  });
}

/**
 * Render a specific page of a PDF to a PNG Blob
 *
 * @param pdfUrl - URL of the PDF file (should be a same-origin URL like our proxy)
 * @param pageNum - The page number to render (1-indexed)
 * @param scale - Render scale factor (default 2 for crisp thumbnails)
 * @returns Promise<Blob> - PNG image blob of the rendered page
 */
export async function renderPdfPageToBlob(
  pdfUrl: string,
  pageNum: number = 1,
  scale: number = 2
): Promise<Blob> {
  const pdfjsLib = await loadPdfJs();

  // Load the PDF document
  const loadingTask = pdfjsLib.getDocument({
    url: pdfUrl,
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;

  // Validate page number
  if (pageNum < 1 || pageNum > pdf.numPages) {
    throw new Error(`Page number ${pageNum} is out of range. PDF has ${pdf.numPages} pages.`);
  }

  // Get the specific page
  const page = await pdf.getPage(pageNum);

  // Get the viewport at the desired scale
  const viewport = page.getViewport({ scale });

  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const context = canvas.getContext('2d')!;

  // Render the page to the canvas
  await page.render({
    canvasContext: context,
    viewport,
  }).promise;

  // Convert canvas to PNG blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      'image/png',
      1.0
    );
  });
}
