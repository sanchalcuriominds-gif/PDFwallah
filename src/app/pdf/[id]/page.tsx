import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PdfDetailClient } from '@/components/pdf/pdf-detail-client'

const faqItems = [
  { question: 'How will I receive my notes?', answer: 'Instantly after payment. You\'ll get a download link right away.' },
  { question: 'Is the payment secure?', answer: 'Yes, 100% secure. We use Razorpay for all transactions.' },
  { question: 'Can I download multiple times?', answer: 'Yes, up to 3 times within 24 hours of purchase.' },
  { question: 'What if I lose my download link?', answer: 'Use \'Recover Download Links\' in the footer to get your link back.' },
  { question: 'Is there a refund policy?', answer: 'Due to the digital nature of the product, refunds are not available.' },
]

type Props = {
  params: Promise<{ id: string }>
}

export default async function PdfDetailPage({ params }: Props) {
  const { id } = await params

  // Direct DB queries — zero API round-trips!
  const [pdf, relatedData] = await Promise.all([
    db.pdf.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        mrp: true,
        pageCount: true,
        previewPageCount: true,
        salesCount: true,
        downloadCount: true,
        featured: true,
        published: true,
        thumbnailPath: true,
        previewFileUrl: true,
        fullFileUrl: true,
        pdfPath: true,
        noteTypeId: true,
        createdAt: true,
        class: { select: { name: true, slug: true } },
        subject: { select: { name: true, slug: true } },
        chapter: { select: { name: true, slug: true } },
        topic: { select: { name: true, slug: true } },
        noteType: { select: { name: true, slug: true } },
      },
    }),
    db.pdf.findMany({
      where: { published: true },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        mrp: true,
        pageCount: true,
        salesCount: true,
        downloadCount: true,
        featured: true,
        thumbnailPath: true,
        noteType: { select: { name: true, slug: true } },
        class: { select: { name: true, slug: true } },
        subject: { select: { name: true, slug: true } },
        chapter: { select: { name: true, slug: true } },
        topic: { select: { name: true, slug: true } },
      },
      orderBy: { salesCount: 'desc' },
      take: 5,
    }),
  ])

  if (!pdf) notFound()

  // Don't expose the full pdfPath publicly
  const safePdf = {
    ...pdf,
    pdfPath: undefined as string | undefined,
    hasFile: !!pdf.pdfPath,
  }

  // Filter out current PDF from related
  const relatedPdfs = relatedData.filter((p) => p.id !== id).slice(0, 4)

  // JSON-LD structured data (server-rendered for SEO)
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${pdf.title} ${pdf.noteType?.name || 'Notes'} PDF`,
    "description": pdf.description || `Download ${pdf.title} PDF for ${pdf.class.name} ${pdf.subject.name}. Instant download, no login required.`,
    "brand": { "@type": "Brand", "name": "PDFWallah" },
    "offers": {
      "@type": "Offer",
      "price": pdf.price,
      "priceCurrency": "INR",
      "availability": "https://schema.org/InStock",
      "seller": { "@type": "Organization", "name": "PDFWallah" },
    },
    ...(pdf.salesCount > 0 ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": pdf.salesCount,
      },
    } : {}),
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": { "@type": "Answer", "text": faq.answer },
    })),
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://pdfwallah.in" },
      { "@type": "ListItem", "position": 2, "name": pdf.class.name, "item": `https://pdfwallah.in/class/${pdf.class.slug}` },
      { "@type": "ListItem", "position": 3, "name": pdf.subject.name, "item": `https://pdfwallah.in/class/${pdf.class.slug}/subject/${pdf.subject.slug}` },
      { "@type": "ListItem", "position": 4, "name": pdf.title, "item": `https://pdfwallah.in/pdf/${pdf.id}` },
    ],
  }

  // Serialize dates for client component
  const serializedPdf = {
    ...safePdf,
    createdAt: pdf.createdAt instanceof Date ? pdf.createdAt.toISOString() : String(pdf.createdAt),
  }

  const serializedRelated = relatedPdfs.map((p) => ({
    ...p,
  }))

  return (
    <PdfDetailClient
      pdf={serializedPdf}
      relatedPdfs={serializedRelated}
      productSchema={productSchema}
      faqSchema={faqSchema}
      breadcrumbSchema={breadcrumbSchema}
    />
  )
}
