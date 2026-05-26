import { z } from 'zod'
import { ApiError, enforceRateLimit, enforceSameOrigin, jsonError, jsonOk, parseJsonBody, requireOwnership, requireUser } from '@/lib/api-security'
import Stripe from 'stripe'
import { courseService } from '@/lib/course-service'

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

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      throw new ApiError(503, 'PAYMENTS_UNCONFIGURED', 'Stripe is not configured on this deployment')
    }

    const db = courseService.getCourseDatabase()
    if (!db) {
      throw new ApiError(500, 'DATABASE_UNAVAILABLE', 'Database connection failed')
    }

    const course = await courseService.getCourse(db as any, payload.courseId)
    const stripe = new Stripe(stripeSecretKey)
    const amount = Math.max(0, Math.round(Number(course.price || 0) * 100))
    const discount = payload.discountCode ? 0.2 : 0
    const finalAmount = Math.round(amount * (1 - discount))
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        customer_email: payload.userEmail,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: course.title,
                description: course.description,
              },
              unit_amount: finalAmount,
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/courses/${payload.courseId}?checkout=success`,
        cancel_url: `${baseUrl}/courses/${payload.courseId}?checkout=cancelled`,
        metadata: {
          courseId: payload.courseId,
          userId: payload.userId,
          discountCode: payload.discountCode || '',
          idempotencyKey,
        },
      },
      {
        idempotencyKey,
      },
    )

    return jsonOk({
      session: {
        sessionId: session.id,
        checkoutUrl: session.url,
        courseId: payload.courseId,
        userId: payload.userId,
        amount: finalAmount / 100,
        currency: 'USD',
        originalAmount: amount / 100,
        discountApplied: discount * 100,
        status: session.status || 'open',
      },
      message: 'Checkout session created.',
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
