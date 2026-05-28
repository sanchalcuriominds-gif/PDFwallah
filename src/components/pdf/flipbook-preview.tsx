'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, AlertCircle, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

interface FlipbookPreviewProps {
  pdfUrl: string
  title: string
  pageCount?: number
}

export function FlipbookPreview({ pdfUrl, title, pageCount: knownPageCount }: FlipbookPreviewProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [scale, setScale] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const pageAreaRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(600)
  const [pageAreaHeight, setPageAreaHeight] = useState(500)
  const [pageAspectRatio, setPageAspectRatio] = useState<number | null>(null) // width / height of first page

  // Measure container dimensions for responsive rendering
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
      if (pageAreaRef.current) {
        setPageAreaHeight(pageAreaRef.current.offsetHeight)
      }
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  // Re-measure when fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      // Delayed re-measure after fullscreen transition
      setTimeout(() => {
        if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth)
        if (pageAreaRef.current) setPageAreaHeight(pageAreaRef.current.offsetHeight)
      }, 100)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }, [])

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages)
    setIsLoading(false)
    setError(null)
  }, [])

  // Capture page aspect ratio from the first rendered page
  const onPageRenderSuccess = useCallback((page: any) => {
    if (!pageAspectRatio && page?.originalWidth && page?.originalHeight) {
      setPageAspectRatio(page.originalWidth / page.originalHeight)
    }
  }, [pageAspectRatio])

  const onDocumentLoadError = useCallback((err: Error) => {
    console.error('PDF load error:', err)
    setError('Failed to load preview. The PDF might not be available yet.')
    setIsLoading(false)
  }, [])

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, numPages)))
  }, [numPages])

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1)
  }, [currentPage, goToPage])

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1)
  }, [currentPage, goToPage])

  const zoomIn = useCallback(() => {
    setScale(s => Math.min(s + 0.25, 3))
  }, [])

  const zoomOut = useCallback(() => {
    setScale(s => Math.max(s - 0.25, 0.5))
  }, [])

  const resetZoom = useCallback(() => {
    setScale(1)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        nextPage()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        prevPage()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextPage, prevPage])

  // Swipe support for mobile
  const touchStartRef = useRef<number | null>(null)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientX
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartRef.current === null) return
    const diff = touchStartRef.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextPage()
      else prevPage()
    }
    touchStartRef.current = null
  }, [nextPage, prevPage])

  // Calculate optimal page dimensions so the full page fits without scrolling
  // Strategy: Fit by height on desktop, fit by width on mobile
  const getMaxPageWidth = () => {
    const availableWidth = containerWidth - 32 // padding
    const availableHeight = pageAreaHeight - 16 // small padding

    if (availableHeight <= 0 || availableWidth <= 0) return Math.min(availableWidth, 500)

    if (pageAspectRatio) {
      // We know the page's aspect ratio — use it to fit perfectly
      const widthFromHeight = availableHeight * pageAspectRatio
      const widthFromWidth = availableWidth

      // Use whichever is smaller (the page fits both ways)
      const baseWidth = Math.min(widthFromHeight, widthFromWidth)
      return Math.max(baseWidth * scale, 200)
    }

    // Fallback: no aspect ratio yet — on wide screens, limit width
    // A4 aspect ratio is ~0.707 (width/height), so if height is 600, width ≈ 424
    const isWide = availableWidth > 600
    if (isWide) {
      // Assume A4-ish ratio, fit by height
      const estimatedWidth = availableHeight * 0.707
      return Math.max(Math.min(estimatedWidth, availableWidth) * scale, 200)
    }

    // Narrow screen (mobile) — fit by width
    return Math.max(availableWidth * scale, 200)
  }

  const pageWidth = getMaxPageWidth()

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-muted/30 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-black/95' : ''}`}
      style={!isFullscreen ? { height: '620px' } : undefined}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-background/80 backdrop-blur-sm border-b shrink-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Page {currentPage} of {numPages || '?'}
          </Badge>
          {numPages > 2 && currentPage <= 2 && (
            <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
              Preview Only
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomOut} title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer min-w-[40px] text-center"
            onClick={resetZoom}
            title="Reset Zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn} title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen} title="Fullscreen">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* PDF Page Display */}
      <div
        ref={pageAreaRef}
        className="flex-1 flex items-center justify-center overflow-auto select-none"
        onContextMenu={(e) => e.preventDefault()}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {error ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <AlertCircle className="w-10 h-10 text-amber-500" />
            <p className="text-sm text-muted-foreground text-center px-4">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null)
                setIsLoading(true)
              }}
            >
              Retry
            </Button>
          </div>
        ) : (
          <div className="relative" style={{ lineHeight: 0 }}>
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-muted/50 rounded-lg" style={{ minHeight: '400px', minWidth: '300px' }}>
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" />
                <p className="text-sm text-muted-foreground">Loading preview...</p>
              </div>
            )}
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
              className="flex justify-center"
            >
              <Page
                pageNumber={currentPage}
                width={pageWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onRenderSuccess={onPageRenderSuccess}
                loading={
                  <div className="flex items-center justify-center" style={{ minHeight: '400px', minWidth: '300px' }}>
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  </div>
                }
              />
            </Document>
          </div>
        )}
      </div>

      {/* Navigation Bar */}
      {!error && numPages > 0 && (
        <div className="flex items-center justify-center gap-3 px-3 py-2 bg-background/80 backdrop-blur-sm border-t shrink-0">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={prevPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>

          {/* Page indicators */}
          <div className="flex items-center gap-1.5">
            {numPages <= 7 ? (
              // Show all page dots
              Array.from({ length: numPages }, (_, i) => {
                const pageNum = i + 1
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      currentPage === pageNum
                        ? 'bg-emerald-600 scale-125'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                )
              })
            ) : (
              // Show first 3, ..., last 3
              <>
                {[1, 2, 3].map(p => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      currentPage === p
                        ? 'bg-emerald-600 scale-125'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
                <span className="text-xs text-muted-foreground mx-0.5">...</span>
                {[numPages - 2, numPages - 1, numPages].map(p => (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      currentPage === p
                        ? 'bg-emerald-600 scale-125'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                    }`}
                  />
                ))}
              </>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={nextPage}
            disabled={currentPage >= numPages}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
