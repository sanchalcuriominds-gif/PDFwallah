'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  FileText,
  Download,
  Star,
  BookOpen,
  Calendar,
  Layers,
  ShoppingBag,
  Shield,
  MessageCircle,
  CheckCircle,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { PdfGrid } from '@/components/pdf/pdf-grid'
import { PaymentModal } from '@/components/pdf/payment-modal'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'

// Lazy-load FlipbookPreview — keeps react-pdf + pdfjs-dist out of the initial bundle
function PdfViewerSkeleton() {
  return (
    <div className="flex flex-col bg-muted/30 rounded-lg overflow-hidden" style={{ height: '620px' }}>
      <div className="flex items-center justify-between px-3 py-2 bg-background/80 backdrop-blur-sm border-b shrink-0">
        <div className="h-5 w-24 bg-muted animate-pulse rounded" />
        <div className="flex items-center gap-1">
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
          <div className="h-4 w-10 bg-muted animate-pulse rounded" />
          <div className="h-8 w-8 bg-muted animate-pulse rounded" />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center">
        <div className="space-y-3 flex flex-col items-center">
          <div className="w-[300px] h-[400px] bg-muted/60 animate-pulse rounded-lg" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading PDF viewer...</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-3 px-3 py-2 bg-background/80 backdrop-blur-sm border-t shrink-0">
        <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-2.5 h-2.5 bg-muted animate-pulse rounded-full" />
          ))}
        </div>
        <div className="h-9 w-9 bg-muted animate-pulse rounded-md" />
      </div>
    </div>
  )
}

const FlipbookPreview = dynamic(
  () => import('@/components/pdf/flipbook-preview').then((mod) => mod.FlipbookPreview),
  {
    ssr: false,
    loading: () => <PdfViewerSkeleton />,
  }
)

function getNoteTypeColor(name: string): string {
  const lower = name.toLowerCase()
  if (lower === 'pyq') return 'bg-orange-500 text-white'
  if (lower === 'handwritten') return 'bg-blue-500 text-white'
  if (lower === 'ncert') return 'bg-purple-500 text-white'
  if (lower === 'test paper') return 'bg-amber-500 text-white'
  if (lower === 'formula sheet') return 'bg-cyan-500 text-white'
  return 'bg-slate-500 text-white'
}

interface PdfDetail {
  id: string
  title: string
  description: string
  price: number
  mrp?: number | null
  pageCount: number
  salesCount: number
  downloadCount: number
  featured: boolean
  previewFileUrl?: string | null
  fullFileUrl?: string | null
  thumbnailPath: string | null
  hasFile?: boolean
  createdAt: string
  noteType?: { name: string; slug: string } | null
  class: { name: string; slug: string }
  subject: { name: string; slug: string }
  chapter: { name: string; slug: string }
  topic: { name: string; slug: string }
}

interface RelatedPdf {
  id: string
  title: string
  description: string
  price: number
  mrp?: number | null
  pageCount: number
  salesCount: number
  downloadCount: number
  featured: boolean
  thumbnailPath: string | null
  noteType?: { name: string; slug: string } | null
  class: { name: string; slug: string }
  subject: { name: string; slug: string }
  chapter: { name: string; slug: string }
  topic: { name: string; slug: string }
}

const faqItems = [
  { question: 'How will I receive my notes?', answer: 'Instantly after payment. You\'ll get a download link right away.' },
  { question: 'Is the payment secure?', answer: 'Yes, 100% secure. We use Razorpay for all transactions.' },
  { question: 'Can I download multiple times?', answer: 'Yes, up to 3 times within 24 hours of purchase.' },
  { question: 'What if I lose my download link?', answer: 'Use \'Recover Download Links\' in the footer to get your link back.' },
  { question: 'Is there a refund policy?', answer: 'Due to the digital nature of the product, refunds are not available.' },
]

interface PdfDetailClientProps {
  pdf: PdfDetail
  relatedPdfs: RelatedPdf[]
  productSchema: Record<string, unknown>
  faqSchema: Record<string, unknown>
  breadcrumbSchema: Record<string, unknown>
}

export function PdfDetailClient({ pdf, relatedPdfs, productSchema, faqSchema, breadcrumbSchema }: PdfDetailClientProps) {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [existingPurchase, setExistingPurchase] = useState<{ token: string; title: string; date: string } | null>(null)

  // Check localStorage for existing purchase (client-only)
  useEffect(() => {
    try {
      const purchases = JSON.parse(localStorage.getItem('pdfwallah_purchases') || '{}')
      if (purchases[pdf.id]) {
        setExistingPurchase(purchases[pdf.id])
      }
    } catch {}
  }, [pdf.id])

  const isBestseller = pdf.salesCount > 20
  const formattedDate = new Date(pdf.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const displayMrp = pdf.mrp && pdf.mrp > pdf.price ? pdf.mrp : pdf.price * 2
  const discountPercent = Math.round(((displayMrp - pdf.price) / displayMrp) * 100)
  const hasPreview = !!(pdf.previewFileUrl || pdf.fullFileUrl || pdf.hasFile)

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Check out "${pdf.title}" on PDFWallah! ${window.location.href}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <Breadcrumbs
        items={[
          { label: pdf.class.name, href: `/class/${pdf.class.slug}` },
          { label: pdf.subject.name, href: `/class/${pdf.class.slug}/subject/${pdf.subject.slug}` },
          { label: pdf.title },
        ]}
      />

      {/* Title & Tags */}
      <div className="animate-fade-in-up">
        <h1 className="text-2xl sm:text-3xl font-bold">{pdf.title} — Download PDF</h1>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {pdf.noteType && (
            <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${getNoteTypeColor(pdf.noteType.name)}`}>
              {pdf.noteType.name}
            </span>
          )}
          {isBestseller && (
            <Badge className="bg-amber-500 text-white gap-1 text-xs">
              <Star className="w-3 h-3 fill-current" /> Bestseller
            </Badge>
          )}
          {pdf.featured && !isBestseller && (
            <Badge className="bg-emerald-600 text-white gap-1 text-xs">
              <BookOpen className="w-3 h-3" /> Featured
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">{pdf.class.name}</Badge>
          <Badge variant="outline" className="text-xs">{pdf.subject.name}</Badge>
          <Badge variant="outline" className="text-xs">{pdf.chapter.name}</Badge>
          <Badge variant="outline" className="text-xs">{pdf.topic.name}</Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* PDF Preview Section */}
        <div className="animate-fade-in-up" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <Card className="overflow-hidden border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-4 sm:p-6">
              {hasPreview ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="w-4 h-4 text-emerald-600" />
                      <span>Preview — First 2 pages with watermark</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{pdf.pageCount} pages total</Badge>
                  </div>
                  <FlipbookPreview pdfUrl={`/api/preview/${pdf.id}`} title={pdf.title} pageCount={pdf.pageCount} />
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="w-3 h-3" />
                    <span>Watermarked preview · Purchase for full PDF without watermark</span>
                  </div>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center justify-center py-16 space-y-4">
                  <div className="w-40 h-56 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-16 h-16 text-white/70" />
                  </div>
                  <p className="text-sm text-muted-foreground">Preview not available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info & Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Pages</p><p className="text-sm font-semibold mt-0.5 flex items-center justify-center gap-1"><FileText className="w-3.5 h-3.5 text-emerald-600" />{pdf.pageCount}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Sold</p><p className="text-sm font-semibold mt-0.5 flex items-center justify-center gap-1"><Download className="w-3.5 h-3.5 text-emerald-600" />{pdf.salesCount}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Subject</p><p className="text-sm font-semibold mt-0.5 flex items-center justify-center gap-1"><Layers className="w-3.5 h-3.5 text-emerald-600" />{pdf.subject.name}</p></CardContent></Card>
          <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Published</p><p className="text-sm font-semibold mt-0.5 flex items-center justify-center gap-1"><Calendar className="w-3.5 h-3.5 text-emerald-600" />{formattedDate}</p></CardContent></Card>
        </div>

        {/* Two Column: Description + Buy */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Description */}
          <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <div>
              <h2 className="text-lg font-semibold mb-2">About This Notes PDF</h2>
              <p className="text-muted-foreground leading-relaxed">
                {pdf.description || 'No description available for this note.'}
              </p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Class', value: pdf.class.name },
                { label: 'Subject', value: pdf.subject.name },
                { label: 'Chapter', value: pdf.chapter.name },
                { label: 'Topic', value: pdf.topic.name },
              ].map((item) => (
                <Card key={item.label}>
                  <CardContent className="p-3 text-center">
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium mt-0.5 line-clamp-1">{item.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions about PDF Download</h2>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((faq, idx) => (
                    <AccordionItem key={idx} value={`faq-${idx}`}>
                      <AccordionTrigger className="text-sm font-medium text-left">{faq.question}</AccordionTrigger>
                      <AccordionContent className="text-sm text-muted-foreground">{faq.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Price & Buy Card */}
          <div className="animate-fade-in-up" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 sticky top-24">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Price</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg text-muted-foreground line-through">₹{displayMrp}</span>
                      <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">₹{pdf.price}</span>
                      <Badge className="bg-orange-600 text-white font-bold text-xs">{discountPercent}% OFF</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Instant Download</p>
                    <p className="text-sm text-muted-foreground">PDF Format</p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4 text-emerald-600" /><span>Secure Payment via Razorpay</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Download className="w-4 h-4 text-emerald-600" /><span>Instant PDF Download</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /><span>Quality PDF Content</span>
                  </div>
                </div>

                {existingPurchase ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2 p-3 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Already Purchased</span>
                    </div>
                    <Button
                      onClick={() => {
                        const a = document.createElement('a')
                        a.href = `/api/download?token=${existingPurchase.token}`
                        a.download = 'PDFWallah_Notes.pdf'
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base gap-2"
                    >
                      <Download className="w-5 h-5" />Download PDF Again
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">Purchased on {new Date(existingPurchase.date).toLocaleDateString('en-IN')}</p>
                  </div>
                ) : (
                  <Button
                    onClick={() => setIsPaymentOpen(true)}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base gap-2"
                  >
                    <ShoppingBag className="w-5 h-5" />Buy Now - ₹{pdf.price}
                  </Button>
                )}

                <Button
                  onClick={handleWhatsAppShare}
                  variant="outline"
                  className="w-full mt-3 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 h-11 text-base gap-2"
                >
                  <MessageCircle className="w-5 h-5" />Share on WhatsApp
                </Button>

                <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />Secure payment via Razorpay
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Related PDFs */}
      {relatedPdfs.length > 0 && (
        <section className="space-y-4 mt-12">
          <h2 className="text-xl font-semibold">Related Notes PDF</h2>
          <PdfGrid pdfs={relatedPdfs} />
        </section>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false)
          try {
            const purchases = JSON.parse(localStorage.getItem('pdfwallah_purchases') || '{}')
            if (purchases[pdf.id]) {
              setExistingPurchase(purchases[pdf.id])
            }
          } catch {}
        }}
        pdf={pdf}
      />
    </div>
  )
}
