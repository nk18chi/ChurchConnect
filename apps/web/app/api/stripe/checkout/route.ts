import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { auth } from '@repo/auth'

export const dynamic = 'force-dynamic'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-10-29.clover',
  })
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  try {
    // Get the current session
    const session = await auth()

    // Parse request body
    const body = await req.json()
    const { amount, type, churchId } = body

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount < 100) {
      return NextResponse.json(
        { error: 'Invalid amount. Minimum is ¥100.' },
        { status: 400 }
      )
    }

    // Validate type
    if (!type || !['ONE_TIME', 'MONTHLY'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid donation type.' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    let customerId: string | undefined

    if (session?.user?.email) {
      // Check if user already has a Stripe customer ID
      // In a real implementation, you'd fetch this from the database
      // For now, we'll create or retrieve the customer by email

      const customers = await stripe.customers.list({
        email: session.user.email,
        limit: 1,
      })

      if (customers.data.length > 0) {
        customerId = customers.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email: session.user.email,
          name: session.user.name || undefined,
        })
        customerId = customer.id

        // TODO: Save customer ID to user record in database
      }
    }

    // Prepare success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/donate/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/donate/cancel`

    // Create Stripe Checkout session
    let checkoutSession: Stripe.Checkout.Session

    if (type === 'MONTHLY') {
      // Create a subscription checkout session
      checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: !customerId && session?.user?.email ? session.user.email : undefined,
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'jpy',
              product_data: {
                name: 'Monthly Donation to ChurchConnect',
                description: 'Support ChurchConnect Japan platform',
              },
              recurring: {
                interval: 'month',
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          type: 'MONTHLY',
          churchId: churchId || '',
          userId: session?.user?.id || '',
        },
        subscription_data: {
          metadata: {
            type: 'MONTHLY',
            churchId: churchId || '',
            userId: session?.user?.id || '',
          },
        },
      })
    } else {
      // Create a one-time payment checkout session
      checkoutSession = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: !customerId && session?.user?.email ? session.user.email : undefined,
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'jpy',
              product_data: {
                name: 'One-time Donation to ChurchConnect',
                description: 'Support ChurchConnect Japan platform',
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          type: 'ONE_TIME',
          amount: amount.toString(),
          churchId: churchId || '',
          userId: session?.user?.id || '',
        },
      })
    }

    // Return the checkout session URL
    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
