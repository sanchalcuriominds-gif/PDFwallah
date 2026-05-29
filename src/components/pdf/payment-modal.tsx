'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [scriptReady, setScriptReady] = useState(false)

  // 🔑 Preload Razorpay script as soon as the modal opens
  // so it's ready by the time user fills in details and clicks Pay
  useEffect(() => {
    if (isOpen && !window.Razorpay) {
      loadRazorpayScript().then((ok) => setScriptReady(ok))
    } else if (window.Razorpay) {
      setScriptReady(true)
    }
  }, [isOpen])

  const handlePayment = async () => {
    if (!pdf) return

    setState('processing')
    setErrorMessage('')

    try {
      // Step 1: Load Razorpay script + Create order IN PARALLEL
      // This cuts the wait time from ~15s (sequential) to ~5s (parallel)
      const [scriptLoaded, orderRes] = await Promise.all([
        loadRazorpayScript(),
        fetch('/api/orders/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pdfId: pdf.id,
            buyerEmail: buyerEmail || undefined,
            buyerPhone: buyerPhone || undefined,
          }),
        }),
      ])

      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay. Please check your internet connection and try again.')
      }

      const orderData = await orderRes.json()

      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to create order')
      }

      // Step 2: Open Razorpay checkout modal (opens instantly now!)
      const paymentResult = await new Promise<{ razorpayPaymentId: string; razorpayOrderId: string; razorpaySignature: string }>(
        (resolve, reject) => {
          const options = {
            key: orderData.keyId,
            amount: orderData.amount * 100, // amount in paise
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
            // Retry settings — allow user to retry if UPI app fails
            retry: {
              enabled: true,
              max_count: 3,
            },
            // Timer to auto-close checkout if user doesn't act
            timeout: 600, // 10 minutes
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
            // Provide more helpful error messages for common issues
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
    setState('form')
    setBuyerEmail('')
    setBuyerPhone('')
    setBuyerName('')
    setErrorMessage('')
    setDownloadToken('')
    onClose()
  }

  if (!pdf) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
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
          </div>
        )}

        {/* Success State */}
        {state === 'success' && (
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold">Payment Successful!</p>
              <p className="text-sm text-muted-foreground">Your notes are ready to download</p>
              {buyerEmail && (
                <p className="text-xs text-muted-foreground">Receipt sent to {buyerEmail}</p>
              )}
            </div>
            <Button
              onClick={() => {
                window.open(`/api/download?token=${downloadToken}`, '_blank')
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
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
