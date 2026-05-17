'use client'

import { useState } from 'react'
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
  const [errorMessage, setErrorMessage] = useState('')
  const [downloadToken, setDownloadToken] = useState('')

  const handlePayment = async () => {
    if (!pdf) return

    setState('processing')
    setErrorMessage('')

    try {
      // Create Razorpay order
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
        throw new Error(orderData.error || 'Failed to create order')
      }

      // Simulate Razorpay payment for demo
      // In production, this would open the Razorpay checkout modal
      const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(7)}`
      const mockSignature = `sig_${Date.now()}`

      // Verify payment
      const verifyRes = await fetch('/api/orders/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.orderId,
          razorpayOrderId: orderData.razorpayOrderId,
          razorpayPaymentId: mockPaymentId,
          razorpaySignature: mockSignature,
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
              <Label htmlFor="email">Email (optional)</Label>
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
            <p className="text-sm text-muted-foreground">Processing your payment...</p>
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
