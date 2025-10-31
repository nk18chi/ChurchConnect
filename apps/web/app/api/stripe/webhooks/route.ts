import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@repo/database'
import { sendDonationReceipt } from '@repo/email'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: NextRequest) {
  try {
    // Get the raw body
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Handle one-time payment
        if (session.mode === 'payment') {
          await handleOneTimePayment(session)
        }

        // Handle subscription
        if (session.mode === 'subscription') {
          await handleSubscriptionCreated(session)
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        // Handle recurring subscription payment
        if (invoice.subscription) {
          await handleRecurringPayment(invoice)
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription

        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        await handleSubscriptionCanceled(subscription)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        await handlePaymentFailed(paymentIntent)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Handle one-time payment completion
async function handleOneTimePayment(session: Stripe.Checkout.Session) {
  const { metadata, amount_total, customer, payment_intent, customer_details } = session

  if (!amount_total || !payment_intent) {
    console.error('Missing required session data for one-time payment')
    return
  }

  const userId = metadata?.userId || null
  const churchId = metadata?.churchId || null

  // Update or create the donation record
  try {
    const donation = await prisma.platformDonation.create({
      data: {
        donorId: userId,
        churchId: churchId,
        stripePaymentId: payment_intent as string,
        amount: amount_total,
        currency: 'jpy',
        type: 'ONE_TIME',
        status: 'COMPLETED',
      },
    })

    console.log(`One-time donation recorded: ${payment_intent}`)

    // Send email receipt
    if (customer_details?.email) {
      try {
        await sendDonationReceipt({
          to: customer_details.email,
          donorName: customer_details.name || 'Supporter',
          amount: amount_total,
          currency: 'JPY',
          type: 'ONE_TIME',
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          receiptNumber: `CC-${donation.id.slice(-8).toUpperCase()}`,
          paymentMethod: session.payment_method_types?.[0]
        })

        console.log(`One-time donation receipt sent to: ${customer_details.email}`)
      } catch (emailError) {
        // Log error but don't fail the webhook
        console.error('Error sending donation receipt email:', emailError)
      }
    }
  } catch (error) {
    console.error('Error recording one-time donation:', error)
  }

  // Update user's Stripe customer ID if needed
  if (userId && customer && typeof customer === 'string') {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer },
      })
    } catch (error) {
      console.error('Error updating user Stripe customer ID:', error)
    }
  }
}

// Handle subscription creation
async function handleSubscriptionCreated(session: Stripe.Checkout.Session) {
  const { metadata, customer, subscription: subscriptionId, customer_details } = session

  if (!subscriptionId || typeof subscriptionId !== 'string') {
    console.error('Missing subscription ID')
    return
  }

  // Retrieve the full subscription object
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  const userId = metadata?.userId || null
  const churchId = metadata?.churchId || null
  const amount = subscription.items.data[0]?.price.unit_amount || 0

  // Create subscription record
  try {
    const subscriptionRecord = await prisma.platformDonationSubscription.create({
      data: {
        donorId: userId,
        stripeSubscriptionId: subscriptionId,
        amount,
        status: 'ACTIVE',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: false,
      },
    })

    console.log(`Subscription created: ${subscriptionId}`)

    // Send subscription confirmation email
    if (customer_details?.email) {
      try {
        await sendDonationReceipt({
          to: customer_details.email,
          donorName: customer_details.name || 'Supporter',
          amount: amount,
          currency: 'JPY',
          type: 'MONTHLY',
          date: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          receiptNumber: `CC-SUB-${subscriptionRecord.id.slice(-8).toUpperCase()}`,
          paymentMethod: session.payment_method_types?.[0]
        })

        console.log(`Subscription confirmation sent to: ${customer_details.email}`)
      } catch (emailError) {
        // Log error but don't fail the webhook
        console.error('Error sending subscription confirmation email:', emailError)
      }
    }
  } catch (error) {
    console.error('Error creating subscription record:', error)
  }

  // Update user's Stripe customer ID if needed
  if (userId && customer && typeof customer === 'string') {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer },
      })
    } catch (error) {
      console.error('Error updating user Stripe customer ID:', error)
    }
  }
}

// Handle recurring subscription payment
async function handleRecurringPayment(invoice: Stripe.Invoice) {
  const { subscription: subscriptionId, amount_paid, payment_intent, customer, customer_email, customer_name, created, number } = invoice

  if (!subscriptionId || typeof subscriptionId !== 'string' || !payment_intent) {
    console.error('Missing required invoice data')
    return
  }

  // Get the subscription record
  const subscription = await prisma.platformDonationSubscription.findUnique({
    where: { stripeSubscriptionId: subscriptionId },
  })

  if (!subscription) {
    console.error(`Subscription not found: ${subscriptionId}`)
    return
  }

  // Create donation record for this payment
  try {
    const donation = await prisma.platformDonation.create({
      data: {
        donorId: subscription.donorId,
        churchId: null, // Subscriptions don't have churchId in this implementation
        stripePaymentId: payment_intent as string,
        amount: amount_paid,
        currency: 'jpy',
        type: 'MONTHLY',
        status: 'COMPLETED',
        subscriptionId: subscription.id,
      },
    })

    console.log(`Recurring payment recorded: ${payment_intent}`)

    // Send monthly receipt email
    if (customer_email) {
      try {
        await sendDonationReceipt({
          to: customer_email,
          donorName: customer_name || 'Supporter',
          amount: amount_paid,
          currency: 'JPY',
          type: 'MONTHLY',
          date: new Date(created * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          receiptNumber: number || `CC-${donation.id.slice(-8).toUpperCase()}`,
        })

        console.log(`Monthly donation receipt sent to: ${customer_email}`)
      } catch (emailError) {
        // Log error but don't fail the webhook
        console.error('Error sending monthly donation receipt email:', emailError)
      }
    }
  } catch (error) {
    console.error('Error recording recurring payment:', error)
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    await prisma.platformDonationSubscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status === 'active' ? 'ACTIVE' :
                subscription.status === 'canceled' ? 'CANCELED' :
                subscription.status === 'past_due' ? 'PAST_DUE' :
                subscription.status === 'unpaid' ? 'UNPAID' : 'ACTIVE',
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    })

    console.log(`Subscription updated: ${subscription.id}`)
  } catch (error) {
    console.error('Error updating subscription:', error)
  }
}

// Handle subscription cancellation
async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  try {
    const subscriptionRecord = await prisma.platformDonationSubscription.update({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: true,
      },
    })

    console.log(`Subscription canceled: ${subscription.id}`)

    // TODO: Send cancellation confirmation email
    // This requires creating a subscription cancellation email template
    // For now, we log the cancellation. Future implementation should:
    // 1. Retrieve customer email from Stripe
    // 2. Create a subscription cancellation email template
    // 3. Send confirmation with cancellation details and final billing date

    // Example future implementation:
    // if (customer_email) {
    //   await sendSubscriptionCancellationEmail({
    //     to: customer_email,
    //     donorName: customer_name,
    //     amount: subscriptionRecord.amount,
    //     finalBillingDate: new Date(subscription.current_period_end * 1000)
    //   })
    // }

  } catch (error) {
    console.error('Error canceling subscription:', error)
  }
}

// Handle payment failures
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Try to find and update the donation record
    const donation = await prisma.platformDonation.findUnique({
      where: { stripePaymentId: paymentIntent.id },
    })

    if (donation) {
      await prisma.platformDonation.update({
        where: { stripePaymentId: paymentIntent.id },
        data: { status: 'FAILED' },
      })

      console.log(`Payment failed: ${paymentIntent.id}`)
    }
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}
