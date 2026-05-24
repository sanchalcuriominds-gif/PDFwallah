// Razorpay integration - REAL implementation using Razorpay Node.js SDK
import Razorpay from 'razorpay';
import crypto from 'crypto';

// Lazy-initialize Razorpay instance (avoids build-time crashes if env vars missing)
let _razorpayInstance: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (!_razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret || keyId === 'rzp_test_placeholder' || keySecret === 'placeholder_secret') {
      throw new Error('Razorpay API keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
    }

    _razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return _razorpayInstance;
}

// Get the public key ID for frontend Razorpay checkout
export function getRazorpayKeyId(): string {
  return process.env.RAZORPAY_KEY_ID || '';
}

export interface RazorpayOrderOptions {
  amount: number; // in paise
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

// Create a REAL Razorpay order using the Razorpay API
export async function createRazorpayOrder(options: RazorpayOrderOptions): Promise<RazorpayOrderResult> {
  const instance = getRazorpayInstance();

  const order = await instance.orders.create({
    amount: options.amount,
    currency: options.currency,
    receipt: options.receipt,
    notes: options.notes,
  });

  return {
    id: order.id,
    entity: order.entity,
    amount: order.amount,
    currency: order.currency,
    receipt: order.receipt || options.receipt,
    status: order.status,
  };
}

// Verify Razorpay payment signature using HMAC-SHA256 (timing-safe)
export function verifyRazorpayPayment(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    console.error('RAZORPAY_KEY_SECRET not set - cannot verify payment');
    return false;
  }

  // Create the expected signature: HMAC-SHA256(orderId + '|' + paymentId, keySecret)
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  // Timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(signature, 'hex')
    );
  } catch {
    // If signature format is invalid (different lengths etc.)
    return false;
  }
}

export function amountToPaise(amount: number): number {
  return Math.round(amount * 100);
}

export function paiseToAmount(paise: number): number {
  return paise / 100;
}
