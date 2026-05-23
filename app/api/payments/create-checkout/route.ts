import { z } from 'zod'
import { ApiError, enforceRateLimit, enforceSameOrigin, jsonError, jsonOk, parseJsonBody, requireOwnership, requireUser } from '@/lib/api-security'

const checkoutSchema = z.object({
  courseId: z.string().min(1),
  userId: z.string().min(1),
  userEmail: z.string().email(),
  discountCode: z.string().trim().min(1).optional(),
})

const webhookSchema = z.object({
  sessionId: z.string().min(1),
  status: z.enum(['pending', 'completed', 'failed']),
  courseId: z.string().min(1),
  userId: z.string().min(1),
})

export async function POST(request: Request) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'payments_webhook', max: 40, windowMs: 60_000 })
    enforceSameOrigin(request)
    enforceRateLimit(request, { key: 'payments_checkout', max: 20, windowMs: 60_000 })
    const auth = requireUser(request)
    const payload = await parseJsonBody(request, checkoutSchema, 16 * 1024)
    requireOwnership(payload.userId, auth.userId)

    const idempotencyKey = request.headers.get('x-idempotency-key')
    if (!idempotencyKey) {
      throw new ApiError(400, 'MISSING_IDEMPOTENCY_KEY', 'x-idempotency-key header is required')
    }

    const sessionId = `cs_test_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    const amount = 9900
    const discount = payload.discountCode ? 0.2 : 0
    const finalAmount = Math.round(amount * (1 - discount))

    return jsonOk({
      session: {
        sessionId,
        checkoutUrl: `https://checkout.stripe.com/pay/${sessionId}`,
        courseId: payload.courseId,
        userId: payload.userId,
        amount: finalAmount / 100,
        currency: 'USD',
        originalAmount: amount / 100,
        discountApplied: discount * 100,
        status: 'pending',
      },
      message: 'Checkout session created. Complete payment to enroll.',
      idempotencyKey,
    }, 201, correlationId)
  } catch (error) {
    return jsonError(error, correlationId)
  }
}

export async function PUT(request: Request) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    const auth = requireUser(request)
    const payload = await parseJsonBody(request, webhookSchema, 16 * 1024)
    requireOwnership(payload.userId, auth.userId)

    return jsonOk({ message: 'Payment webhook processed', sessionId: payload.sessionId, status: payload.status }, 200, correlationId)
  } catch (error) {
    return jsonError(error, correlationId)
  }
}

export async function GET(request: Request) {
  const correlationId = request.headers.get('x-correlation-id') || crypto.randomUUID()
  try {
    const auth = requireUser(request)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    if (!userId) {
      throw new ApiError(400, 'MISSING_USER_ID', 'Missing userId parameter')
    }
    requireOwnership(userId, auth.userId)

    return jsonOk({ userId, payments: [], totalSpent: 0 }, 200, correlationId)
  } catch (error) {
    return jsonError(error, correlationId)
  }
}
