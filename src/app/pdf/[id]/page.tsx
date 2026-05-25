'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { PdfGrid } from '@/components/pdf/pdf-grid'
import { PdfDetailSkeleton } from '@/components/pdf/pdf-detail-skeleton'
import { PaymentModal } from '@/components/pdf/payment-modal'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'

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
  thumbnailPath: string | null
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
  {
    question: 'How will I receive my notes?',
    answer: 'Instantly after payment. You\'ll get a download link right away.',
  },
  {
    question: 'Is the payment secure?',
    answer: 'Yes, 100% secure. We use Razorpay for all transactions.',
  },
  {
    question: 'Can I download multiple times?',
    answer: 'Yes, up to 3 times within 24 hours of purchase.',
  },
  {
    question: 'What if I lose my download link?',
    answer: 'Use \'Recover Download Links\' in the footer to get your link back.',
  },
  {
    question: 'Is there a refund policy?',
    answer: 'Due to the digital nature of the product, refunds are not available.',
  },
]

export default function PdfDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [pdf, setPdf] = useState<PdfDetail | null>(null)
  const [relatedPdfs, setRelatedPdfs] = useState<RelatedPdf[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)

  useEffect(() => {
    async function fetchPdf() {
      try {
        const [pdfRes, relatedRes] = await Promise.all([
          fetch(`/api/pdfs/${id}`),
          fetch(`/api/pdfs?limit=4&sort=popular`),
        ])

        const pdfData = await pdfRes.json()
        const relatedData = await relatedRes.json()

        setPdf(pdfData)
        setRelatedPdfs(
          (relatedData.pdfs || []).filter((p: RelatedPdf) => p.id !== id).slice(0, 4)
        )
      } catch (error) {
        console.error('Error fetching PDF:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPdf()
  }, [id])

  if (isLoading) {
    return <PdfDetailSkeleton />
  }

  if (!pdf) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold">Note not found</h1>
        <p className="text-muted-foreground mt-2">The requested note could not be found.</p>
        <Link href="/search">
          <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white">
            Browse Notes
          </Button>
        </Link>
      </div>
    )
  }

  const isBestseller = pdf.salesCount > 20
  const formattedDate = new Date(pdf.createdAt).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const displayMrp = pdf.mrp && pdf.mrp > pdf.price ? pdf.mrp : pdf.price * 2
  const discountPercent = Math.round(((displayMrp - pdf.price) / displayMrp) * 100)

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Check out "${pdf.title}" on Vedant Academy! ${window.location.href}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: pdf.class.name, href: `/class/${pdf.class.slug}` },
          { label: pdf.subject.name, href: `/class/${pdf.class.slug}/subject/${pdf.subject.slug}` },
          { label: pdf.title },
        ]}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left - Preview */}
        <motion.div
          className="lg:col-span-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="overflow-hidden">
            <div className="aspect-[3/4] bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center relative">
              <FileText className="w-24 h-24 text-white/70" />
              {isBestseller && (
                <Badge className="absolute top-4 left-4 bg-amber-500 text-white gap-1">
                  <Star className="w-3 h-3 fill-current" /> Bestseller
                </Badge>
              )}
              {pdf.featured && !isBestseller && (
                <Badge className="absolute top-4 left-4 bg-emerald-600 text-white gap-1">
                  <BookOpen className="w-3 h-3" /> Featured
                </Badge>
              )}
            </div>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <span>{pdf.pageCount} pages</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>{pdf.salesCount} sold</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <span>{pdf.subject.name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>{formattedDate}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right - Details */}
        <motion.div
          className="lg:col-span-2 space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{pdf.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {pdf.noteType && (
                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${getNoteTypeColor(pdf.noteType.name)}`}>
                  {pdf.noteType.name}
                </span>
              )}
              <Badge variant="outline" className="text-xs">
                {pdf.class.name}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {pdf.subject.name}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {pdf.chapter.name}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {pdf.topic.name}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground leading-relaxed">
              {pdf.description || 'No description available for this note.'}
            </p>
          </div>

          <Separator />

          {/* Price & Buy */}
          <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Price</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg text-muted-foreground line-through">₹{displayMrp}</span>
                    <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">₹{pdf.price}</span>
                    <Badge className="bg-orange-600 text-white font-bold text-xs">
                      {discountPercent}% OFF
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Instant Download</p>
                  <p className="text-sm text-muted-foreground">PDF Format</p>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Instant Download</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Quality Content</span>
                </div>
              </div>

              <Button
                onClick={() => setIsPaymentOpen(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                Buy Now - ₹{pdf.price}
              </Button>

              <Button
                onClick={handleWhatsAppShare}
                variant="outline"
                className="w-full mt-3 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 h-11 text-base gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Share on WhatsApp
              </Button>

              <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
                <Shield className="w-3 h-3" />
                Secure payment via Razorpay
              </div>
            </CardContent>
          </Card>

          {/* Info cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

          {/* FAQ Section */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="w-full">
                {faqItems.map((faq, idx) => (
                  <AccordionItem key={idx} value={`faq-${idx}`}>
                    <AccordionTrigger className="text-sm font-medium text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Related PDFs */}
      {relatedPdfs.length > 0 && (
        <section className="space-y-4 mt-12">
          <h2 className="text-xl font-semibold">Related Notes</h2>
          <PdfGrid pdfs={relatedPdfs} />
        </section>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        pdf={pdf}
      />
    </div>
  )
}
