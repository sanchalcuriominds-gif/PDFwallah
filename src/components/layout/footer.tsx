import Link from 'next/link'
import { BookOpen, Heart, Shield, Zap, Mail, Headphones, RotateCcw, Lock } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold">
                <span className="text-emerald-600 dark:text-emerald-400">Vedant</span>{' '}
                Academy
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
              Your trusted destination for quality study material. Notes, PYQs, PDFs & study material for school and competitive exams — curated by experienced educators.
            </p>
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-2 pt-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 rounded-md px-2 py-1 border">
                <Shield className="w-3 h-3 text-emerald-600" />
                Razorpay Secured
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 rounded-md px-2 py-1 border">
                <Zap className="w-3 h-3 text-emerald-600" />
                Instant Download
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-background/80 rounded-md px-2 py-1 border">
                <Headphones className="w-3 h-3 text-emerald-600" />
                24/7 Support
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">Quick Links</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Home
              </Link>
              <Link href="/school" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                School Notes
              </Link>
              <Link href="/competitive" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Competitive Exams
              </Link>
              <Link href="/search" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Search Notes
              </Link>
              <Link href="/request" className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Request Notes
              </Link>
            </div>
          </div>

          {/* Exam Prep */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">Exam Prep</h4>
            <div className="flex flex-col gap-2.5">
              <Link href="/competitive" className="text-sm text-muted-foreground hover:text-orange-600 dark:hover:text-orange-400 transition-colors">
                JEE
              </Link>
              <Link href="/competitive" className="text-sm text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors">
                NEET
              </Link>
              <Link href="/competitive" className="text-sm text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                CUET
              </Link>
              <Link href="/competitive" className="text-sm text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                REET
              </Link>
              <Link href="/competitive" className="text-sm text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                SSC
              </Link>
              <Link href="/competitive" className="text-sm text-muted-foreground hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
                Railway
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-foreground">Support</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-emerald-600" />
                support@vedantacademy.com
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="w-4 h-4 text-emerald-600" />
                Secure payments via Razorpay
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="w-4 h-4 text-emerald-600" />
                Instant PDF downloads
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                Recover download links
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Vedant Academy. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for students
          </p>
        </div>
      </div>
    </footer>
  )
}
