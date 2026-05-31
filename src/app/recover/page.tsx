'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  Mail,
  Phone,
  Search,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  Download,
  Shield,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RecoveredOrder {
  id: string
  pdfTitle: string
  amount: number
  createdAt: string
  hasDownloadLink: boolean
}

export default function RecoverPage() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    found: boolean
    message: string
    orders?: RecoveredOrder[]
    emailSent?: boolean
  } | null>(null)
  const [error, setError] = useState('')

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email && !phone) {
      setError('Please enter your email or phone number')
      return
    }
    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch('/api/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || undefined,
          phone: phone || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      setResult(data)
    } catch {
      setError('Failed to search. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] max-w-lg mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Back link */}
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center mb-3">
              <Download className="w-7 h-7 text-emerald-600" />
            </div>
            <CardTitle className="text-xl">Recover Download Links</CardTitle>
            <CardDescription>
              Lost your download link? Enter the email or phone you used during purchase and we&apos;ll send your links again.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRecover} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="text-center text-sm text-muted-foreground">— or —</div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" /> Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg text-sm bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Find My Purchases
                  </>
                )}
              </Button>
            </form>

            {/* Results */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-4"
              >
                {result.found ? (
                  <>
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                          {result.message}
                        </p>
                        {result.emailSent && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                            Check your inbox (and spam folder) for the download links.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Order list */}
                    {result.orders && result.orders.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">Your Purchases:</h4>
                        {result.orders.map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                          >
                            <div className="w-8 h-8 rounded bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center flex-shrink-0">
                              <FileText className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{order.pdfTitle}</p>
                              <p className="text-xs text-muted-foreground">
                                ₹{order.amount} · {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {order.hasDownloadLink && (
                              <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                                Link sent
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-900">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        No purchases found
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                        {result.message}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Info note */}
            <div className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              <p>
                For your security, download links are only sent to the email address used during purchase.
                Each link is valid for 24 hours and can be used once.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
