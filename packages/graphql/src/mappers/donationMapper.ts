import { DonationState } from '@repo/domain'

/**
 * GraphQL Donation type
 */
export interface GraphQLDonation {
  id: string
  userId: string
  amount: number
  stripePaymentIntentId: string | null
  metadata: Record<string, string> | null
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED'
  createdAt: Date
  completedAt: Date | null
  failedAt: Date | null
  failureReason: string | null
  refundedAt: Date | null
  refundReason: string | null
  stripeRefundId: string | null
}

/**
 * Map domain DonationState to GraphQL Donation
 *
 * Flattens the discriminated union into a single type with nullable fields
 */
export function toGraphQLDonation(donation: DonationState): GraphQLDonation {
  const base = {
    id: String(donation.id),
    userId: donation.userId,
    amount: Number(donation.amount),
    stripePaymentIntentId: donation.stripePaymentIntentId,
    metadata: donation.metadata,
    createdAt: donation.createdAt,
  }

  // Map status and state-specific fields
  switch (donation.tag) {
    case 'Pending':
      return {
        ...base,
        status: 'PENDING' as const,
        completedAt: null,
        failedAt: null,
        failureReason: null,
        refundedAt: null,
        refundReason: null,
        stripeRefundId: null,
      }

    case 'Completed':
      return {
        ...base,
        status: 'COMPLETED' as const,
        completedAt: donation.completedAt,
        failedAt: null,
        failureReason: null,
        refundedAt: null,
        refundReason: null,
        stripeRefundId: null,
      }

    case 'Failed':
      return {
        ...base,
        status: 'FAILED' as const,
        completedAt: null,
        failedAt: donation.failedAt,
        failureReason: donation.failureReason,
        refundedAt: null,
        refundReason: null,
        stripeRefundId: null,
      }

    case 'Refunded':
      return {
        ...base,
        status: 'REFUNDED' as const,
        completedAt: donation.completedAt,
        failedAt: null,
        failureReason: null,
        refundedAt: donation.refundedAt,
        refundReason: donation.refundReason,
        stripeRefundId: donation.stripeRefundId,
      }
  }
}
