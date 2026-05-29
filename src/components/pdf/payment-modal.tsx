'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  CreditCard,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Shield,
} from 'lucide-react'

// Extend Window to include Razorpay
declare global {
  interface Window {
    Razorpay: any
  }
}

// Load Razorpay checkout script dynamically
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    // Check if script tag already exists (being loaded)
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(true))
      existing.addEventListener('error', () => resolve(false))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  pdf: {
    id: string
    title: string
    description: string
    price: number
    pageCount: number
    class: { name: string }
    subject: { name: string }
  } | null
}

type PaymentState = 'form' | 'processing' | 'success' | 'error'

export function PaymentModal({ isOpen, onClose, pdf }: PaymentModalProps) {
  const [state, setState] = useState<PaymentState>('form')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [downloadToken, setDownloadToken] = useState('')

  // 🔑 Preload Razorpay script on PAGE LOAD (not just modal open)
  // This way the script is already cached when user clicks Buy Now
  useEffect(() => {
    loadRazorpayScript()
  }, [])

  // Also save purchase to localStorage when successful
  useEffect(() => {
    if (state === 'success' && pdf && downloadToken) {
      try {
        const purchases = JSON.parse(localStorage.getItem('pdfwallah_purchases') || '{}')
        purchases[pdf.id] = {
          token: downloadToken,
          title: pdf.title,
          date: new Date().toISOString(),
        }
        localStorage.setItem('pdfwallah_purchases', JSON.stringify(purchases))
      } catch {}
    }
  }, [state, downloadToken, pdf])

  const handlePayment = async () => {
    if (!pdf) return

    setState('processing')
    setErrorMessage('')

    try {
      // Step 1: Create order on our server first
      const orderRes = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfId: pdf.id,
          buyerEmail: buyerEmail || undefined,
          buyerPhone: buyerPhone || undefined,
        }),
      })

      const orderData = await orderRes.json()

      if (!orderRes.ok) {
        // If already purchased, show download directly
        if (orderData.alreadyPurchased && orderData.downloadToken) {
          setDownloadToken(orderData.downloadToken)
          setState('success')
          return
        }
        throw new Error(orderData.error || 'Failed to create order')
      }

      // Validate the order data before opening Razorpay
      if (!orderData.razorpayOrderId || !orderData.keyId) {
        console.error('Invalid order data:', orderData)
        throw new Error('Invalid order data. Please try again.')
      }

      // Step 2: Make sure Razorpay script is loaded
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay. Please check your internet connection and try again.')
      }

      console.log('Opening Razorpay with order:', orderData.razorpayOrderId, 'key:', orderData.keyId)

      // Step 2: Open Razorpay checkout modal
      const paymentResult = await new Promise<{ razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string }>(
        (resolve, reject) => {
          const options = {
            key: orderData.keyId,
            // ⚠️ Do NOT pass 'amount' here — Razorpay already knows the
            // amount from the order_id. Passing it separately can cause
            // floating-point mismatches (e.g. 9.99*100 = 998.9999 ≠ 999)
            // which triggers "Something went wrong" in checkout.
            currency: orderData.currency,
            name: 'PDFWallah',
            description: pdf.title,
            image: '/logo.png',
            order_id: orderData.razorpayOrderId,
            prefill: {
              name: buyerName || '',
              email: buyerEmail || '',
              contact: buyerPhone || '',
            },
            theme: {
              color: '#059669', // emerald-600
            },
            handler: function (response: any) {
              resolve({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                razorpaySignature: response.razorpay_signature,
              })
            },
            modal: {
              ondismiss: function () {
                reject(new Error('Payment cancelled by user'))
              },
            },
          }

          const rzp = new window.Razorpay(options)
          rzp.on('payment.failed', function (response: any) {
            const desc = response.error.description || 'Payment failed'
            let userMessage = desc
            if (desc.includes('website does not match')) {
              userMessage = 'Payment is being set up. Please try again in a few minutes or use a different payment method (Card/Net Banking).'
            } else if (desc.includes('payment_method_not_enabled')) {
              userMessage = 'This payment method is not available. Please try a different payment method.'
            }
            reject(new Error(userMessage))
          })
          rzp.open()
        }
      )

      // Step 3: Verify payment on our server
      const verifyRes = await fetch('/api/orders/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          razorpayOrderId: paymentResult.razorpayOrderId,
          razorpayPaymentId: paymentResult.razorpayPaymentId,
          razorpaySignature: paymentResult.razorpaySignature,
        }),
      })

      const verifyData = await verifyRes.json()

      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed')
      }

      setDownloadToken(verifyData.downloadToken)
      setState('success')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed. Please try again.')
      setState('error')
    }
  }

  const handleClose = () => {
    // 🛡️ CRITICAL: Don't allow closing during processing or success
    // Razorpay's overlay dismissal was triggering Dialog's onOpenChange
    // and wiping the success state before the user could download
    if (state === 'processing') return

    // On success, allow close but DON'T reset the state yet
    // so the parent page can still access the download token
    if (state === 'success') {
      onClose()
      return
    }

    setState('form')
    setBuyerEmail('')
    setBuyerPhone('')
    setBuyerName('')
    setErrorMessage('')
    setDownloadToken('')
    onClose()
  }

  // Handle Dialog's onOpenChange — prevent unwanted closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // If dialog is trying to close, only allow it if not processing
      if (state === 'processing') return
      handleClose()
    }
  }

  if (!pdf) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        // Prevent clicking outside to close during processing/success
        onPointerDownOutside={(e) => {
          if (state === 'processing' || state === 'success') {
            e.preventDefault()
          }
        }}
        // Prevent Escape key closing during processing
        onEscapeKeyDown={(e) => {
          if (state === 'processing') {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            {state === 'success' ? 'Payment Successful!' : 'Purchase Notes'}
          </DialogTitle>
          <DialogDescription>
            {state === 'success'
              ? 'Your notes are ready to download'
              : 'Complete your purchase to download the notes'}
          </DialogDescription>
        </DialogHeader>

        {/* PDF Info */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm line-clamp-2">{pdf.title}</p>
              <p className="text-xs text-muted-foreground">
                {pdf.class.name} · {pdf.subject.name} · {pdf.pageCount} pages
              </p>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total</span>
            <Badge className="bg-emerald-600 text-white text-base px-3 py-1">
              ₹{pdf.price}
            </Badge>
          </div>
        </div>

        {/* Form State */}
        {state === 'form' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name (optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="Your name"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (for receipt)</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={buyerEmail}
                onChange={(e) => setBuyerEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone (optional)</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 9876543210"
                value={buyerPhone}
                onChange={(e) => setBuyerPhone(e.target.value)}
              />
            </div>
            <Button
              onClick={handlePayment}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Pay ₹{pdf.price} with Razorpay
            </Button>
            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              Secure payment powered by Razorpay
            </div>
          </div>
        )}

        {/* Processing State */}
        {state === 'processing' && (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            <p className="text-sm text-muted-foreground">Opening Razorpay checkout...</p>
            <p className="text-xs text-muted-foreground">If the checkout doesn't open, please wait a moment</p>
          </div>
        )}

        {/* Success State */}
        {state === 'success' && (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-lg">Payment Successful!</p>
              <p className="text-sm text-muted-foreground">Your notes are ready to download</p>
              {buyerEmail && (
                <p className="text-xs text-muted-foreground">Receipt sent to {buyerEmail}</p>
              )}
            </div>
            <Button
              onClick={() => {
                window.open(`/api/download?token=${downloadToken}`, '_blank')
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-12 text-base px-8"
            >
              <Download className="w-5 h-5 mr-2" />
              Download PDF
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Download link valid for 24 hours · Up to 3 downloads
            </p>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold">Payment Failed</p>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setState('form')}
            >
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
