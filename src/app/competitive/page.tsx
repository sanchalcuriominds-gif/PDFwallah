'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Trophy,
  Search,
  ArrowRight,
  Atom,
  Stethoscope,
  GraduationCap,
  Landmark,
  Train,
  Sparkles,
  FileText,
  Clock,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { PdfGrid } from '@/components/pdf/pdf-grid'
import { PdfCardSkeleton } from '@/components/pdf/pdf-card-skeleton'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'

interface PdfData {
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

const examCategories = [
  {
    name: 'JEE',
    subtitle: 'Joint Entrance Examination',
    description: 'Engineering entrance exam for IITs, NITs & other top colleges. Physics, Chemistry & Mathematics.',
    icon: Atom,
    bgFrom: 'from-orange-500',
    bgTo: 'to-amber-500',
    lightBg: 'bg-orange-50 dark:bg-orange-950/30',
    textColor: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-orange-200 dark:border-orange-800',
    status: 'coming_soon' as const,
  },
  {
    name: 'NEET',
    subtitle: 'National Eligibility cum Entrance Test',
    description: 'Medical entrance exam for MBBS, BDS & AYUSH courses. Physics, Chemistry & Biology.',
    icon: Stethoscope,
    bgFrom: 'from-red-500',
    bgTo: 'to-rose-500',
    lightBg: 'bg-red-50 dark:bg-red-950/30',
    textColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-800',
    status: 'coming_soon' as const,
  },
  {
    name: 'CUET',
    subtitle: 'Common University Entrance Test',
    description: 'Central university entrance exam for UG admissions across India.',
    icon: GraduationCap,
    bgFrom: 'from-blue-500',
    bgTo: 'to-indigo-500',
    lightBg: 'bg-blue-50 dark:bg-blue-950/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-800',
    status: 'coming_soon' as const,
  },
  {
    name: 'REET',
    subtitle: 'Rajasthan Eligibility Examination for Teachers',
    description: 'Teacher eligibility exam for Rajasthan. Level 1 & Level 2 preparation material.',
    icon: GraduationCap,
    bgFrom: 'from-purple-500',
    bgTo: 'to-violet-500',
    lightBg: 'bg-purple-50 dark:bg-purple-950/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-200 dark:border-purple-800',
    status: 'coming_soon' as const,
  },
  {
    name: 'SSC',
    subtitle: 'Staff Selection Commission',
    description: 'Government job exams — CGL, CHSL, MTS & more. Reasoning, GK, Maths & English.',
    icon: Landmark,
    bgFrom: 'from-amber-500',
    bgTo: 'to-yellow-500',
    lightBg: 'bg-amber-50 dark:bg-amber-950/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-200 dark:border-amber-800',
    status: 'coming_soon' as const,
  },
  {
    name: 'Railway',
    subtitle: 'Railway Recruitment Board',
    description: 'RRB NTPC, Group D, ALP & other railway exam preparation material.',
    icon: Train,
    bgFrom: 'from-teal-500',
    bgTo: 'to-cyan-500',
    lightBg: 'bg-teal-50 dark:bg-teal-950/30',
    textColor: 'text-teal-600 dark:text-teal-400',
    borderColor: 'border-teal-200 dark:border-teal-800',
    status: 'coming_soon' as const,
  },
  {
    name: 'Rajasthan Exams',
    subtitle: 'Rajasthan State Level Exams',
    description: 'RAS, Rajasthan Patwari, LDC & other state-level exam preparation.',
    icon: Landmark,
    bgFrom: 'from-pink-500',
    bgTo: 'to-rose-500',
    lightBg: 'bg-pink-50 dark:bg-pink-950/30',
    textColor: 'text-pink-600 dark:text-pink-400',
    borderColor: 'border-pink-200 dark:border-pink-800',
    status: 'coming_soon' as const,
  },
]

export default function CompetitivePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [featuredPdfs, setFeaturedPdfs] = useState<PdfData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/pdfs?featured=true&limit=4')
        const data = await res.json()
        setFeaturedPdfs(data.pdfs || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`
    }
  }

  return (
    <div className="space-y-0 pb-8">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Breadcrumbs items={[{ label: 'Competitive Exams' }]} />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-pink-950/30" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200/30 dark:bg-indigo-800/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-200/30 dark:bg-purple-800/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <motion.div
            className="text-center space-y-5 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-sm font-medium"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Trophy className="w-4 h-4" />
              Competitive Exam Hub
            </motion.div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Competitive Exam{' '}
              <span className="text-indigo-600 dark:text-indigo-400">Preparation</span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              JEE, NEET, CUET, REET, SSC, Railway & more — get the best study material to crack your dream exam
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto pt-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search competitive exam notes..."
                    className="pl-10 h-11 bg-background border-border/50 focus:border-indigo-400 focus:ring-indigo-400/20"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  className="h-11 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            {/* Quick Exam Pills */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-2 pt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {['JEE', 'NEET', 'CUET', 'REET', 'SSC', 'Railway'].map((pill) => (
                <button
                  key={pill}
                  onClick={() => setSearchQuery(pill)}
                  className="px-3 py-1.5 text-sm rounded-full bg-white/50 dark:bg-white/10 border border-border/50 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-900 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  {pill}
                </button>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Exam Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold">Browse by Exam</h2>
            <p className="text-muted-foreground text-sm mt-1">Select your target exam and start preparing</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {examCategories.map((exam, index) => (
              <motion.div
                key={exam.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -4 }}
              >
                <Card className={`h-full overflow-hidden hover:border-emerald-200 dark:hover:border-emerald-800 transition-all ${exam.borderColor}`}>
                  {/* Header */}
                  <div className={`bg-gradient-to-r ${exam.bgFrom} ${exam.bgTo} p-5 relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
                    <div className="relative flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm">
                        <exam.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{exam.name}</h3>
                        <p className="text-xs text-white/80">{exam.subtitle}</p>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-5 space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{exam.description}</p>
                    <div className="flex items-center justify-between">
                      {exam.status === 'coming_soon' ? (
                        <Badge variant="secondary" className="gap-1">
                          <Clock className="w-3 h-3" />
                          Coming Soon
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <FileText className="w-3 h-3" />
                          Notes Available
                        </Badge>
                      )}
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Featured Notes */}
      {!isLoading && featuredPdfs.length > 0 ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-600" />
                  Featured Notes
                </h2>
                <p className="text-muted-foreground text-sm mt-1">Popular notes you might find useful</p>
              </div>
              <Link href="/search?featured=true">
                <Button variant="ghost" className="gap-1 text-indigo-600 dark:text-indigo-400">
                  View all <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <PdfGrid pdfs={featuredPdfs} />
          </motion.div>
        </section>
      ) : isLoading ? (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-indigo-600" />
                Featured Notes
              </h2>
              <p className="text-muted-foreground text-sm mt-1">Popular notes you might find useful</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[0, 1, 2, 3].map((i) => (
              <PdfCardSkeleton key={i} />
            ))}
          </div>
        </section>
      ) : null}

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <motion.div
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 p-8 sm:p-12 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
          </div>
          <div className="relative text-center space-y-4 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold">New Exam Content Coming Soon!</h2>
            <p className="text-indigo-100">
              We&apos;re working hard to bring you the best preparation material for JEE, NEET, CUET, REET & more. Stay tuned!
            </p>
            <p className="text-sm text-indigo-200">
              In the meantime, check out our school notes for foundational concepts.
            </p>
            <Link href="/school">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 gap-2 h-12 px-8">
                <GraduationCap className="w-5 h-5" />
                Browse School Notes
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}
