'use client'

import Link from 'next/link'
import { BookOpen, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'

interface ClassCardProps {
  classData: {
    id: string
    name: string
    slug: string
    _count: {
      subjects: number
      pdfs: number
    }
  }
  index?: number
}

const classGradients: Record<string, string> = {
  'class-9': 'from-emerald-400 to-green-500',
  'class-10': 'from-teal-400 to-emerald-500',
  'class-11': 'from-green-400 to-teal-500',
  'class-12': 'from-cyan-400 to-emerald-500',
}

const classIcons: Record<string, string> = {
  'class-9': '9',
  'class-10': '10',
  'class-11': '11',
  'class-12': '12',
}

export function ClassCard({ classData, index = 0 }: ClassCardProps) {
  const gradient = classGradients[classData.slug] || 'from-emerald-400 to-teal-500'
  const icon = classIcons[classData.slug] || classData.name.replace('Class ', '')

  return (
    <Link href={`/class/${classData.slug}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <Card className="overflow-hidden group cursor-pointer border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
          <div className={`h-32 bg-gradient-to-br ${gradient} flex items-center justify-center relative`}>
            <span className="text-5xl font-bold text-white/90">{icon}</span>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
          </div>
          <CardContent className="p-4 space-y-2">
            <h3 className="font-semibold text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {classData.name}
            </h3>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {classData._count.subjects} Subjects
              </span>
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {classData._count.pdfs} Notes
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  )
}
