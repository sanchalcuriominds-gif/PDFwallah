import Link from 'next/link'
import { BookOpen, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500 text-white">
                <BookOpen className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold">
                <span className="text-emerald-600 dark:text-emerald-400">Vedant</span>{' '}
                Academy
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Your trusted digital notes store. Quality study material for CBSE students, curated by experienced educators.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Quick Links</h4>
            <div className="flex flex-col gap-2">
              <Link href="/" className="text-sm text-foreground/80 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Home
              </Link>
              <Link href="/search" className="text-sm text-foreground/80 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Browse Notes
              </Link>
              <Link href="/search" className="text-sm text-foreground/80 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                Search
              </Link>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Support</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-foreground/80">
                Email: support@vedantacademy.com
              </span>
              <span className="text-sm text-foreground/80">
                Secure payments via Razorpay
              </span>
              <span className="text-sm text-foreground/80">
                Instant PDF downloads
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
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
