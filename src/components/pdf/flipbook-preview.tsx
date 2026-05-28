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
  const [containerWidth, setContainerWidth] = useState(600)

  // Measure container width for responsive page rendering
  useEffect(() => {
    const measureWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    measureWidth()
    window.addEventListener('resize', measureWidth)
    return () => window.removeEventListener('resize', measureWidth)
  }, [])

  // Handle fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
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

  // Calculate page width based on container and scale
  const pageWidth = Math.max(containerWidth - 32, 300) * scale

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-muted/30 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 bg-black/95' : ''}`}
      style={!isFullscreen ? { minHeight: '500px' } : undefined}
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
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={zoomIn} title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen} title="Fullscreen">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* PDF Page Display */}
      <div
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
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-muted/50 rounded-lg min-h-[400px]">
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
                loading={
                  <div className="flex items-center justify-center min-h-[400px] min-w-[300px]">
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

          {/* Page dots / indicators */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(numPages, 7) }, (_, i) => {
              const pageNum = i + 1
              // If more than 7 pages, show first 3, dots, last 3
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
            })}
            {numPages > 7 && (
              <>
                <span className="text-xs text-muted-foreground mx-1">...</span>
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

      {/* Swipe hint for mobile */}
      {!error && numPages > 1 && !isFullscreen && (
        <p className="text-center text-[10px] text-muted-foreground/50 pb-1">
          Swipe or use arrows to flip pages
        </p>
      )}
    </div>
  )
}
