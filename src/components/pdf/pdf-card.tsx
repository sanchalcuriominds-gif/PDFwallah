'use client'

import Link from 'next/link'
import { FileText, Download, Star, BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'

interface PdfCardProps {
  pdf: {
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
  index?: number
}

const gradients = [
  'from-emerald-400 to-teal-500',
  'from-green-400 to-emerald-500',
  'from-teal-400 to-cyan-500',
  'from-emerald-500 to-green-600',
  'from-cyan-400 to-teal-500',
]

export function PdfCard({ pdf, index = 0 }: PdfCardProps) {
  const gradientIndex = index % gradients.length
  const isBestseller = pdf.salesCount > 20

  return (
    <Link href={`/pdf/${pdf.id}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.01 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <Card className="overflow-hidden h-full group cursor-pointer border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
          {/* Thumbnail */}
          <div className="relative aspect-[4/3] overflow-hidden">
            <div className={`w-full h-full bg-gradient-to-br ${gradients[gradientIndex]} flex items-center justify-center`}>
              <FileText className="w-16 h-16 text-white/80" />
            </div>

            {/* Price badge */}
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/90 dark:bg-black/70 text-foreground font-bold shadow-md backdrop-blur-sm">
                ₹{pdf.price}
              </Badge>
            </div>

            {/* Bestseller badge */}
            {isBestseller && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-amber-500 text-white font-semibold shadow-md gap-1">
                  <Star className="w-3 h-3 fill-current" />
                  Bestseller
                </Badge>
              </div>
            )}

            {/* Featured badge */}
            {pdf.featured && !isBestseller && (
              <div className="absolute top-3 left-3">
                <Badge className="bg-emerald-600 text-white font-semibold shadow-md gap-1">
                  <BookOpen className="w-3 h-3" />
                  Featured
                </Badge>
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </div>

          {/* Content */}
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {pdf.title}
            </h3>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground/70">{pdf.class.name}</span>
              <span>·</span>
              <span>{pdf.subject.name}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {pdf.pageCount} pages
              </span>
              {pdf.salesCount > 0 && (
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {pdf.salesCount} sold
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  )
}
