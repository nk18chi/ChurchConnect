import { Prisma } from '@prisma/client'
import {
  DonationState,
  DonationId,
  Amount,
  PendingDonation,
  CompletedDonation,
  FailedDonation,
  RefundedDonation,
} from '@repo/domain'
import { Result, ok, err } from 'neverthrow'
import { ValidationError } from '@repo/domain'

/**
 * Extended Prisma Donation type with all potential fields
 * The schema stores state-specific data in JSON metadata field
 */
type PrismaDonationWithMetadata = {
  id: string
  donorId: string | null
  churchId: string | null
  stripePaymentId: string
  amount: number
  currency: string
  type: string
  status: string
  subscriptionId: string | null
  createdAt: Date
  // State-specific metadata stored as JSON
  // Structure: { completedAt?, failedAt?, failureReason?, refundedAt?, refundReason?, stripeRefundId?, ...customMetadata }
  metadata?: Record<string, any> | null
}

/**
 * Maps between domain DonationState and Prisma PlatformDonation model
 *
 * Challenges:
 * - Prisma schema has simple status enum, domain has discriminated union with state-specific properties
 * - State-specific timestamps and data need to be stored somewhere (using metadata JSON field)
 * - Prisma uses stripePaymentId, domain uses stripePaymentIntentId
 */
export class DonationMapper {
  /**
   * Convert Prisma donation to domain DonationState
   */
  static toDomain(
    prisma: Prisma.PlatformDonationGetPayload<object>
  ): Result<DonationState, ValidationError> {
    // Parse ID
    const donationIdResult = DonationId.create(prisma.id)
    if (donationIdResult.isErr()) {
      return err(donationIdResult.error)
    }

    // Parse amount
    const amountResult = Amount.create(prisma.amount)
    if (amountResult.isErr()) {
      return err(amountResult.error)
    }

    // Extract metadata - parse JSON if stored as string, otherwise use as-is
    const metadata = prisma.metadata as Record<string, any> | null

    // Extract custom metadata (everything except state-specific fields)
    const stateFields = new Set([
      'completedAt',
      'failedAt',
      'failureReason',
      'refundedAt',
      'refundReason',
      'stripeRefundId',
    ])
    const customMetadata = metadata
      ? Object.fromEntries(Object.entries(metadata).filter(([key]) => !stateFields.has(key)))
      : null

    const hasCustomMetadata = customMetadata && Object.keys(customMetadata).length > 0

    // Base properties common to all states
    const base = {
      id: donationIdResult.value,
      userId: prisma.donorId ?? 'anonymous',
      amount: amountResult.value,
      stripePaymentIntentId: prisma.stripePaymentId,
      metadata: hasCustomMetadata ? customMetadata : null,
      createdAt: prisma.createdAt,
    }

    // Map based on status
    switch (prisma.status) {
      case 'PENDING': {
        const donation: PendingDonation = {
          ...base,
          tag: 'Pending',
        }
        return ok(donation)
      }

      case 'COMPLETED': {
        const completedAt = metadata?.completedAt ? new Date(metadata.completedAt) : prisma.createdAt
        const donation: CompletedDonation = {
          ...base,
          tag: 'Completed',
          completedAt,
        }
        return ok(donation)
      }

      case 'FAILED': {
        const failedAt = metadata?.failedAt ? new Date(metadata.failedAt) : prisma.createdAt
        const failureReason = metadata?.failureReason ?? 'Unknown error'
        const donation: FailedDonation = {
          ...base,
          tag: 'Failed',
          failedAt,
          failureReason,
        }
        return ok(donation)
      }

      case 'REFUNDED': {
        const completedAt = metadata?.completedAt ? new Date(metadata.completedAt) : prisma.createdAt
        const refundedAt = metadata?.refundedAt ? new Date(metadata.refundedAt) : prisma.createdAt
        const stripeRefundId = metadata?.stripeRefundId ?? 'unknown'
        const donation: RefundedDonation = {
          ...base,
          tag: 'Refunded',
          completedAt,
          refundedAt,
          refundReason: metadata?.refundReason ?? null,
          stripeRefundId,
        }
        return ok(donation)
      }

      default:
        return err(new ValidationError(`Unknown donation status: ${prisma.status}`))
    }
  }

  /**
   * Convert domain DonationState to Prisma data for create/update
   */
  static toPrisma(donation: DonationState): Prisma.PlatformDonationUncheckedCreateInput {
    // Build metadata with state-specific fields + custom metadata
    const stateMetadata: Record<string, any> = {}

    if (donation.tag === 'Completed') {
      stateMetadata.completedAt = donation.completedAt.toISOString()
    } else if (donation.tag === 'Failed') {
      stateMetadata.failedAt = donation.failedAt.toISOString()
      stateMetadata.failureReason = donation.failureReason
    } else if (donation.tag === 'Refunded') {
      stateMetadata.completedAt = donation.completedAt.toISOString()
      stateMetadata.refundedAt = donation.refundedAt.toISOString()
      stateMetadata.refundReason = donation.refundReason
      stateMetadata.stripeRefundId = donation.stripeRefundId
    }

    // Merge with custom metadata
    const metadata = {
      ...stateMetadata,
      ...(donation.metadata ?? {}),
    }

    return {
      id: String(donation.id),
      donorId: donation.userId,
      stripePaymentId: donation.stripePaymentIntentId ?? '',
      amount: Number(donation.amount),
      currency: 'jpy',
      type: 'ONE_TIME', // MVP: all donations are one-time
      status: donation.tag.toUpperCase() as 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED',
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
      createdAt: donation.createdAt,
    }
  }
}
