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
  ChevronRight,
  ShoppingBag,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { PdfGrid } from '@/components/pdf/pdf-grid'
import { PaymentModal } from '@/components/pdf/payment-modal'

interface PdfDetail {
  id: string
  title: string
  description: string
  price: number
  pageCount: number
  salesCount: number
  downloadCount: number
  featured: boolean
  thumbnailPath: string | null
  createdAt: string
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
  pageCount: number
  salesCount: number
  downloadCount: number
  featured: boolean
  thumbnailPath: string | null
  class: { name: string; slug: string }
  subject: { name: string; slug: string }
  chapter: { name: string; slug: string }
  topic: { name: string; slug: string }
}

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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
        <Link href="/" className="hover:text-emerald-600 transition-colors">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/class/${pdf.class.slug}`} className="hover:text-emerald-600 transition-colors">
          {pdf.class.name}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/class/${pdf.class.slug}/subject/${pdf.subject.slug}`} className="hover:text-emerald-600 transition-colors">
          {pdf.subject.name}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium line-clamp-1">{pdf.title}</span>
      </nav>

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
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                    ₹{pdf.price}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Instant Download</p>
                  <p className="text-sm text-muted-foreground">PDF Format</p>
                </div>
              </div>
              <Button
                onClick={() => setIsPaymentOpen(true)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base gap-2"
              >
                <ShoppingBag className="w-5 h-5" />
                Buy Now - ₹{pdf.price}
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
