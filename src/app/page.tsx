'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  BookOpen,
  ArrowRight,
  Sparkles,
  TrendingUp,
  FileText,
  GraduationCap,
  Star,
  Shield,
  Zap,
  IndianRupee,
  Clock,
  Calculator,
  PenTool,
  BookMarked,
  ClipboardList,
  Notebook,
  Trophy,
  Train,
  Landmark,
  Atom,
  Stethoscope,
  GraduationCap as Cuets,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { SearchBar } from '@/components/pdf/search-bar'
import { PdfGrid } from '@/components/pdf/pdf-grid'
import { PdfCardSkeleton } from '@/components/pdf/pdf-card-skeleton'
import { ClassCard } from '@/components/pdf/class-card'

interface ClassData {
  id: string
  name: string
  slug: string
  type?: string
  _count: { subjects: number; pdfs: number }
}

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
  createdAt: string
}

const competitiveExams = [
  { name: 'JEE', subtitle: 'Joint Entrance Exam', icon: Atom, color: 'orange', bgFrom: 'from-orange-500', bgTo: 'to-amber-500', lightBg: 'bg-orange-50 dark:bg-orange-950/30', textColor: 'text-orange-600 dark:text-orange-400' },
  { name: 'NEET', subtitle: 'Medical Entrance', icon: Stethoscope, color: 'red', bgFrom: 'from-red-500', bgTo: 'to-rose-500', lightBg: 'bg-red-50 dark:bg-red-950/30', textColor: 'text-red-600 dark:text-red-400' },
  { name: 'CUET', subtitle: 'Central University', icon: Cuets, color: 'blue', bgFrom: 'from-blue-500', bgTo: 'to-indigo-500', lightBg: 'bg-blue-50 dark:bg-blue-950/30', textColor: 'text-blue-600 dark:text-blue-400' },
  { name: 'REET', subtitle: 'Teacher Eligibility', icon: GraduationCap, color: 'purple', bgFrom: 'from-purple-500', bgTo: 'to-violet-500', lightBg: 'bg-purple-50 dark:bg-purple-950/30', textColor: 'text-purple-600 dark:text-purple-400' },
  { name: 'SSC', subtitle: 'Staff Selection', icon: Landmark, color: 'amber', bgFrom: 'from-amber-500', bgTo: 'to-yellow-500', lightBg: 'bg-amber-50 dark:bg-amber-950/30', textColor: 'text-amber-600 dark:text-amber-400' },
  { name: 'Railway', subtitle: 'Railway Recruitment', icon: Train, color: 'teal', bgFrom: 'from-teal-500', bgTo: 'to-cyan-500', lightBg: 'bg-teal-50 dark:bg-teal-950/30', textColor: 'text-teal-600 dark:text-teal-400' },
  { name: 'Rajasthan', subtitle: 'State Exams', icon: Landmark, color: 'pink', bgFrom: 'from-pink-500', bgTo: 'to-rose-500', lightBg: 'bg-pink-50 dark:bg-pink-950/30', textColor: 'text-pink-600 dark:text-pink-400' },
]

const quickCategories = [
  { name: 'Formula Sheets', icon: Calculator, count: '50+', color: 'text-emerald-600 dark:text-emerald-400' },
  { name: 'Handwritten Notes', icon: PenTool, count: '200+', color: 'text-teal-600 dark:text-teal-400' },
  { name: 'PYQs', icon: ClipboardList, count: '100+', color: 'text-orange-600 dark:text-orange-400' },
  { name: 'Test Papers', icon: Notebook, count: '80+', color: 'text-purple-600 dark:text-purple-400' },
  { name: 'Short Notes', icon: BookMarked, count: '150+', color: 'text-blue-600 dark:text-blue-400' },
  { name: 'NCERT Solutions', icon: BookOpen, count: '120+', color: 'text-cyan-600 dark:text-cyan-400' },
]

const quickPills = ['Class 9', 'Class 10', 'Class 11', 'Class 12', 'JEE', 'NEET', 'CUET']

const testimonials = [
  { name: "Priya", class: "Class 10", quote: "These notes helped me score 95% in my board exams!", rating: 5 },
  { name: "Arjun", class: "Class 12", quote: "Best handwritten notes I've found online. Worth every rupee!", rating: 5 },
  { name: "Rohit", class: "JEE Aspirant", quote: "The PYQs section is gold. Cleared JEE with these!", rating: 5 },
  { name: "Sneha", class: "NEET Aspirant", quote: "Simple, clean, and to the point. No unnecessary stuff.", rating: 5 },
  { name: "Vikram", class: "Class 11", quote: "Finally found a site that doesn't look like it's from 2005!", rating: 4 },
  { name: "Ananya", class: "Class 9", quote: "Affordable and quality content. Highly recommend!", rating: 5 },
]

export default function HomePage() {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [competitiveClasses, setCompetitiveClasses] = useState<ClassData[]>([])
  const [featuredPdfs, setFeaturedPdfs] = useState<PdfData[]>([])
  const [popularPdfs, setPopularPdfs] = useState<PdfData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Seed database if empty
        await fetch('/api/seed', { method: 'POST' }).catch(() => {})

        const [classesRes, competitiveRes, featuredRes, popularRes] = await Promise.all([
          fetch('/api/classes?type=school'),
          fetch('/api/classes?type=competitive'),
          fetch('/api/pdfs?featured=true&limit=4'),
          fetch('/api/pdfs?sort=popular&limit=4'),
        ])

        const classesData = await classesRes.json()
        const competitiveData = await competitiveRes.json()
        const featuredData = await featuredRes.json()
        const popularData = await popularRes.json()

        setClasses(classesData)
        setCompetitiveClasses(competitiveData)
        setFeaturedPdfs(featuredData.pdfs || [])
        setPopularPdfs(popularData.pdfs || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  }

  const getPillLink = (pill: string) => {
    if (pill.startsWith('Class ')) {
      const slug = 'class-' + pill.replace('Class ', '')
      return `/class/${slug}`
    }
    return '/competitive'
  }

  return (
    <div className="space-y-0 pb-8">
      {/* ====== A. HERO SECTION ====== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-green-950/30" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/30 dark:bg-emerald-800/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-teal-200/30 dark:bg-teal-800/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
          <motion.div
            className="text-center space-y-5 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Trust badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 text-sm font-medium"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Sparkles className="w-4 h-4" />
              Trusted by 1000+ students across India
            </motion.div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight">
              Free Study Material for{' '}
              <span className="text-emerald-600 dark:text-emerald-400">School & Competitive Exams</span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Notes, PYQs, PDFs, Formula Sheets & more — Download instantly and ace your exams
            </p>

            {/* Large Search Bar */}
            <div className="max-w-2xl mx-auto pt-2">
              <SearchBar placeholder="Search notes, subjects, exams, topics..." />
            </div>

            {/* Quick Category Pills */}
            <motion.div
              className="flex flex-wrap items-center justify-center gap-2 pt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              {quickPills.map((pill) => (
                <Link key={pill} href={getPillLink(pill)}>
                  <Badge
                    variant="secondary"
                    className="px-3 py-1.5 text-sm cursor-pointer hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900 dark:hover:text-emerald-300 transition-colors"
                  >
                    {pill}
                  </Badge>
                </Link>
              ))}
            </motion.div>
          </motion.div>

          {/* Animated Stats Bar */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-14 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {[
              { label: 'Notes Available', value: '500+', icon: FileText },
              { label: 'Students', value: '1000+', icon: GraduationCap },
              { label: 'Subjects', value: '15+', icon: BookOpen },
              { label: 'Rating', value: '4.8★', icon: Star },
            ].map((stat) => (
              <div key={stat.label} className="text-center space-y-1 px-2">
                <stat.icon className="w-5 h-5 mx-auto text-emerald-600 dark:text-emerald-400" />
                <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====== B. MAIN CATEGORY GRID ====== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <motion.div {...fadeInUp}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Zone 1 - School Notes */}
            <Card className="overflow-hidden border-emerald-200/50 dark:border-emerald-800/50">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 sm:p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/4" />
                <div className="relative">
                  <Badge className="bg-white/20 text-white border-white/30 mb-3">
                    <GraduationCap className="w-3 h-3 mr-1" />
                    School
                  </Badge>
                  <h2 className="text-2xl sm:text-3xl font-bold">School Notes</h2>
                  <p className="text-emerald-100 mt-1 text-sm sm:text-base">Class 9 - 12 CBSE Notes</p>
                </div>
              </div>
              <CardContent className="p-4 sm:p-6">
                {!isLoading && classes.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {classes.map((cls) => (
                      <Link key={cls.id} href={`/class/${cls.slug}`}>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/80 dark:hover:bg-emerald-950/40 transition-colors group">
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 text-white font-bold text-sm flex-shrink-0">
                            {cls.name.replace('Class ', '')}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{cls.name}</p>
                            <p className="text-xs text-muted-foreground">{cls._count.subjects} Subjects · {cls._count.pdfs} Notes</p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {[9, 10, 11, 12].map((num) => (
                      <div key={num} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 animate-pulse">
                        <div className="w-10 h-10 rounded-lg bg-muted" />
                        <div className="space-y-1.5">
                          <div className="h-3 w-16 bg-muted rounded" />
                          <div className="h-2 w-20 bg-muted rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <Link href="/school" className="block mt-4">
                  <Button variant="ghost" className="w-full gap-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
                    Browse School Notes <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Zone 2 - Competitive Exams */}
            <Card className="overflow-hidden border-indigo-200/50 dark:border-indigo-800/50">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 sm:p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full blur-xl translate-y-1/2 -translate-x-1/4" />
                <div className="relative">
                  <Badge className="bg-white/20 text-white border-white/30 mb-3">
                    <Trophy className="w-3 h-3 mr-1" />
                    Competitive
                  </Badge>
                  <h2 className="text-2xl sm:text-3xl font-bold">Competitive Exams</h2>
                  <p className="text-indigo-100 mt-1 text-sm sm:text-base">JEE, NEET, CUET, REET & more</p>
                </div>
              </div>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-3">
                  {competitiveExams.map((exam) => {
                    const matchedClass = competitiveClasses.find(
                      (cls) => cls.name.toLowerCase().includes(exam.name.toLowerCase())
                    )
                    const href = matchedClass ? `/class/${matchedClass.slug}` : '/competitive'
                    return (
                      <Link key={exam.name} href={href}>
                        <div className={`flex items-center gap-3 p-3 rounded-xl ${exam.lightBg} hover:opacity-80 transition-opacity group`}>
                          <div className={`flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${exam.bgFrom} ${exam.bgTo} text-white flex-shrink-0`}>
                            <exam.icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className={`font-medium text-sm ${exam.textColor}`}>{exam.name}</p>
                            <p className="text-xs text-muted-foreground">{exam.subtitle}</p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
                <Link href="/competitive" className="block mt-4">
                  <Button variant="ghost" className="w-full gap-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40">
                    Browse Competitive Exams <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </section>

      {/* ====== C. POPULAR CATEGORIES (Horizontal Scrollable) ====== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <motion.div {...fadeInUp}>
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Popular Categories</h2>
            <p className="text-muted-foreground text-sm mt-1">Browse by category to find exactly what you need</p>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x snap-mandatory">
            {quickCategories.map((cat) => (
              <Link key={cat.name} href="/search">
                <motion.div
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  className="snap-start"
                >
                  <Card className="w-40 sm:w-48 flex-shrink-0 cursor-pointer hover:border-emerald-200 dark:hover:border-emerald-800 transition-colors">
                    <CardContent className="p-4 text-center space-y-3">
                      <div className="mx-auto w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
                        <cat.icon className={`w-6 h-6 ${cat.color}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{cat.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{cat.count} Notes</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ====== D. FEATURED NOTES ====== */}
      {!isLoading && featuredPdfs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.div {...fadeInUp}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-emerald-600" />
                  Featured Notes
                </h2>
                <p className="text-muted-foreground text-sm mt-1">Handpicked by our educators</p>
              </div>
              <Link href="/search?featured=true">
                <Button variant="ghost" className="gap-1 text-emerald-600 dark:text-emerald-400">
                  View all <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <PdfGrid pdfs={featuredPdfs} />
          </motion.div>
        </section>
      )}

      {/* ====== E. POPULAR NOTES ====== */}
      {!isLoading && popularPdfs.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.div {...fadeInUp}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                  Most Popular
                </h2>
                <p className="text-muted-foreground text-sm mt-1">Top picks by students</p>
              </div>
              <Link href="/search?sort=popular">
                <Button variant="ghost" className="gap-1 text-emerald-600 dark:text-emerald-400">
                  View all <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
            <PdfGrid pdfs={popularPdfs} />
          </motion.div>
        </section>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-12">
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-emerald-600" />
                  Featured Notes
                </h2>
                <p className="text-muted-foreground text-sm mt-1">Handpicked by our educators</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[0, 1, 2, 3].map((i) => (
                <PdfCardSkeleton key={i} />
              ))}
            </div>
          </section>
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                  Most Popular
                </h2>
                <p className="text-muted-foreground text-sm mt-1">Top picks by students</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[0, 1, 2, 3].map((i) => (
                <PdfCardSkeleton key={i} />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ====== F. WHY CHOOSE US ====== */}
      {!isLoading && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.div {...fadeInUp}>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">Why Students Choose Us</h2>
              <p className="text-muted-foreground text-sm mt-1">Everything you need to excel in your exams</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                {
                  icon: Sparkles,
                  title: 'Quality Content',
                  description: 'Curated by experienced educators with years of teaching expertise',
                  color: 'text-emerald-600 dark:text-emerald-400',
                  bg: 'bg-emerald-50 dark:bg-emerald-950/30',
                },
                {
                  icon: Zap,
                  title: 'Instant Download',
                  description: 'Get your notes in seconds — no waiting, no delays',
                  color: 'text-amber-600 dark:text-amber-400',
                  bg: 'bg-amber-50 dark:bg-amber-950/30',
                },
                {
                  icon: IndianRupee,
                  title: 'Affordable Prices',
                  description: 'Starting from just ₹10 — quality education accessible to all',
                  color: 'text-teal-600 dark:text-teal-400',
                  bg: 'bg-teal-50 dark:bg-teal-950/30',
                },
                {
                  icon: Shield,
                  title: 'Secure Payments',
                  description: 'Razorpay secured transactions — your data is always safe',
                  color: 'text-blue-600 dark:text-blue-400',
                  bg: 'bg-blue-50 dark:bg-blue-950/30',
                },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent className="p-6 text-center space-y-3">
                      <div className={`mx-auto w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center`}>
                        <item.icon className={`w-6 h-6 ${item.color}`} />
                      </div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Testimonials */}
      {!isLoading && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          <motion.div {...fadeInUp}>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold">What Students Say</h2>
              <p className="text-muted-foreground text-sm mt-1">Trusted by students across India</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testimonials.map((testimonial, idx) => (
                <motion.div
                  key={testimonial.name}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full hover:shadow-md transition-shadow">
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < testimonial.rating ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                      <div>
                        <p className="font-semibold text-sm">{testimonial.name}</p>
                        <p className="text-xs text-muted-foreground">{testimonial.class}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* ====== G. CTA SECTION ====== */}
      {!isLoading && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <motion.div
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 p-8 sm:p-12 text-white"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
            </div>
            <div className="relative text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold">Start Your Exam Preparation Today</h2>
              <p className="text-emerald-100">
                Join 1000+ students who trust PDFWallah for their exam preparation. Access notes, PYQs, and study material instantly.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link href="/search">
                  <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 gap-2 h-12 px-8">
                    <BookOpen className="w-5 h-5" />
                    Explore All Notes
                  </Button>
                </Link>
                <Link href="/competitive">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2 h-12 px-8">
                    <Trophy className="w-5 h-5" />
                    Competitive Exams
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      )}
    </div>
  )
}
