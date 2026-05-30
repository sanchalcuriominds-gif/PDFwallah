/**
 * Google Drive URL Utilities
 * 
 * Extracts file IDs from various Google Drive URL formats and builds
 * thumbnail URLs for displaying PDF cover images.
 * 
 * Supported URL formats:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=drive_link
 * - https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk
 * - https://drive.google.com/file/d/FILE_ID/view
 * - https://drive.google.com/open?id=FILE_ID
 * - https://docs.google.com/document/d/FILE_ID/...
 * - Just a raw file ID (alphanumeric string)
 */

/**
 * Extract Google Drive file ID from various URL formats
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url || typeof url !== 'string') return null

  const trimmed = url.trim()

  // Pattern 1: /file/d/FILE_ID/... (most common)
  const filePattern = /\/file\/d\/([a-zA-Z0-9_-]+)/
  const fileMatch = trimmed.match(filePattern)
  if (fileMatch) return fileMatch[1]

  // Pattern 2: ?id=FILE_ID
  const idPattern = /[?&]id=([a-zA-Z0-9_-]+)/
  const idMatch = trimmed.match(idPattern)
  if (idMatch) return idMatch[1]

  // Pattern 3: /document/d/FILE_ID/..., /spreadsheets/d/FILE_ID/, etc.
  const docPattern = /\/d\/([a-zA-Z0-9_-]+)/
  const docMatch = trimmed.match(docPattern)
  if (docMatch) return docMatch[1]

  // Pattern 4: Just a raw file ID (no URL, just alphanumeric)
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed)) {
    return trimmed
  }

  return null
}

/**
 * Build a Google Drive thumbnail URL from a file ID
 * 
 * @param fileId - Google Drive file ID
 * @param size - Thumbnail size (default w400 for card display)
 * @returns Google Drive thumbnail URL
 */
export function getGoogleDriveThumbnailUrl(fileId: string, size: string = 'w400'): string {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`
}

/**
 * Get the best available thumbnail URL for a PDF
 * 
 * Tries thumbnailPath first, then previewFileUrl, then fullFileUrl/pdfPath
 * to find a Google Drive file ID and build a thumbnail URL.
 */
export function getPdfThumbnailSource(pdf: {
  thumbnailPath?: string | null
  previewFileUrl?: string | null
  fullFileUrl?: string | null
  pdfPath?: string | null
}): string | null {
  // Try each field in priority order
  const fields = [
    pdf.thumbnailPath,
    pdf.previewFileUrl,
    pdf.fullFileUrl,
    pdf.pdfPath,
  ]

  for (const field of fields) {
    if (!field) continue
    const fileId = extractGoogleDriveFileId(field)
    if (fileId) {
      return getGoogleDriveThumbnailUrl(fileId)
    }
  }

  return null
}
