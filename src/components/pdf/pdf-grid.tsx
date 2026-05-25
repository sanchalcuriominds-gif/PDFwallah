'use client'

import { motion } from 'framer-motion'
import { PdfCard } from './pdf-card'

interface PdfGridProps {
  pdfs: Array<{
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
  }>
}

export function PdfGrid({ pdfs }: PdfGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {pdfs.map((pdf, index) => (
        <motion.div
          key={pdf.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <PdfCard pdf={pdf} index={index} />
        </motion.div>
      ))}
    </div>
  )
}
