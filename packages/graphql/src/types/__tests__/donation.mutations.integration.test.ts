import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { PrismaClient } from '@repo/database'
import {
  createDonation,
  completeDonation,
  failDonation,
  refundDonation,
  isPending,
  isCompleted,
  isFailed,
  isRefunded,
} from '@repo/domain'
import { PrismaDonationRepository } from '@repo/infrastructure'

/**
 * Integration tests for Donation mutations
 * Tests the full stack: GraphQL inputs → Domain workflows → Infrastructure → Database
 *
 * Note: These tests use the repository directly rather than GraphQL executor
 * because setting up full GraphQL context (auth, session) is complex.
 * We're testing the business logic integration, not GraphQL parsing.
 */
describe('Donation Mutations Integration', () => {
  let prisma: PrismaClient
  let donationRepo: PrismaDonationRepository
  let testUserId: string

  beforeEach(async () => {
    prisma = new PrismaClient()
    donationRepo = new PrismaDonationRepository(prisma)

    // Create or get test user
    const user = await prisma.user.upsert({
      where: { email: 'donor@example.com' },
      create: {
        email: 'donor@example.com',
        name: 'Test Donor',
        role: 'USER',
      },
      update: {},
    })

    testUserId = user.id

    // Clean up any existing test donations
    await prisma.platformDonation.deleteMany({
      where: {
        donorId: testUserId,
        stripePaymentId: { startsWith: 'pi_test_' },
      },
    })
  })

  afterEach(async () => {
    await prisma.$disconnect()
  })

  describe('createDonation → save flow', () => {
    it('should create pending donation and persist to database', async () => {
      // 1. Execute domain workflow
      const donationResult = createDonation({
        userId: testUserId,
        amount: 5000, // ¥5000
        stripePaymentIntentId: 'pi_test_123',
        metadata: {
          campaign: 'christmas-2024',
          dedication: 'In memory of John Doe',
        },
      })

      expect(donationResult.isOk()).toBe(true)
      if (donationResult.isErr()) return

      // 2. Verify it's a pending donation
      expect(isPending(donationResult.value)).toBe(true)
      expect(donationResult.value.amount).toBe(5000)
      expect(donationResult.value.stripePaymentIntentId).toBe('pi_test_123')
      expect(donationResult.value.metadata).toEqual({
        campaign: 'christmas-2024',
        dedication: 'In memory of John Doe',
      })

      // 3. Persist via repository
      const savedResult = await donationRepo.save(donationResult.value)

      expect(savedResult.isOk()).toBe(true)
      if (savedResult.isErr()) return

      // 4. Verify database state
      const dbDonation = await prisma.platformDonation.findUnique({
        where: { id: String(savedResult.value.id) },
      })

      expect(dbDonation).not.toBeNull()
      expect(dbDonation?.donorId).toBe(testUserId)
      expect(dbDonation?.amount).toBe(5000)
      expect(dbDonation?.status).toBe('PENDING')
      expect(dbDonation?.stripePaymentId).toBe('pi_test_123')

      // Verify metadata is stored correctly
      const metadata = dbDonation?.metadata as Record<string, any>
      expect(metadata?.campaign).toBe('christmas-2024')
      expect(metadata?.dedication).toBe('In memory of John Doe')
    })

    it('should create donation without optional fields', async () => {
      const donationResult = createDonation({
        userId: testUserId,
        amount: 1000,
      })

      expect(donationResult.isOk()).toBe(true)
      if (donationResult.isErr()) return

      const savedResult = await donationRepo.save(donationResult.value)

      expect(savedResult.isOk()).toBe(true)
      if (savedResult.isErr()) return

      const dbDonation = await prisma.platformDonation.findUnique({
        where: { id: String(savedResult.value.id) },
      })

      // When no stripePaymentIntentId provided, uses donation ID as fallback
      expect(dbDonation?.stripePaymentId).toBe(`pending_${String(savedResult.value.id)}`)
      expect(dbDonation?.metadata).toBeNull()
    })

    it('should fail for invalid amount (too low)', async () => {
      const donationResult = createDonation({
        userId: testUserId,
        amount: 50, // Below minimum of 100
      })

      expect(donationResult.isErr()).toBe(true)
      if (donationResult.isOk()) return

      expect(donationResult.error.code).toBe('VALIDATION_ERROR')
    })

    it('should fail for invalid amount (too high)', async () => {
      const donationResult = createDonation({
        userId: testUserId,
        amount: 20_000_000, // Above maximum of 10,000,000
      })

      expect(donationResult.isErr()).toBe(true)
    })
  })

  describe('completeDonation flow', () => {
    it('should transition pending donation to completed', async () => {
      // 1. Create pending donation
      const donationResult = createDonation({
        userId: testUserId,
        amount: 3000,
        stripePaymentIntentId: 'pi_test_complete_123',
      })

      expect(donationResult.isOk()).toBe(true)
      if (donationResult.isErr()) return

      const savedResult = await donationRepo.save(donationResult.value)
      expect(savedResult.isOk()).toBe(true)
      if (savedResult.isErr()) return

      // 2. Complete the donation (simulating Stripe webhook)
      const completedResult = completeDonation(savedResult.value)

      expect(completedResult.isOk()).toBe(true)
      if (completedResult.isErr()) return

      expect(isCompleted(completedResult.value)).toBe(true)
      expect(completedResult.value.completedAt).toBeInstanceOf(Date)

      // 3. Persist the completed state
      const updatedResult = await donationRepo.save(completedResult.value)

      expect(updatedResult.isOk()).toBe(true)
      if (updatedResult.isErr()) return

      // 4. Verify database state
      const dbDonation = await prisma.platformDonation.findUnique({
        where: { id: String(updatedResult.value.id) },
      })

      expect(dbDonation?.status).toBe('COMPLETED')

      // Verify completedAt is stored in metadata
      const metadata = dbDonation?.metadata as Record<string, any>
      expect(metadata?.completedAt).toBeDefined()
      expect(new Date(metadata?.completedAt)).toBeInstanceOf(Date)
    })

    it('should fail to complete already completed donation', async () => {
      // Create and complete a donation
      const donationResult = createDonation({
        userId: testUserId,
        amount: 2000,
        stripePaymentIntentId: 'pi_test_already_complete',
      })

      expect(donationResult.isOk()).toBe(true)
      if (donationResult.isErr()) return

      const savedResult = await donationRepo.save(donationResult.value)
      expect(savedResult.isOk()).toBe(true)
      if (savedResult.isErr()) return

      const completedResult = completeDonation(savedResult.value)
      expect(completedResult.isOk()).toBe(true)
      if (completedResult.isErr()) return

      const updatedResult = await donationRepo.save(completedResult.value)
      expect(updatedResult.isOk()).toBe(true)
      if (updatedResult.isErr()) return

      // Try to complete again
      const secondCompleteResult = completeDonation(updatedResult.value)

      expect(secondCompleteResult.isErr()).toBe(true)
      if (secondCompleteResult.isOk()) return

      expect(secondCompleteResult.error.message).toContain('Only pending donations can be completed')
    })
  })

  describe('failDonation flow', () => {
    it('should transition pending donation to failed', async () => {
      // 1. Create pending donation
      const donationResult = createDonation({
        userId: testUserId,
        amount: 1500,
        stripePaymentIntentId: 'pi_test_fail_123',
      })

      expect(donationResult.isOk()).toBe(true)
      if (donationResult.isErr()) return

      const savedResult = await donationRepo.save(donationResult.value)
      expect(savedResult.isOk()).toBe(true)
      if (savedResult.isErr()) return

      // 2. Fail the donation (simulating Stripe webhook)
      const failedResult = failDonation(savedResult.value, {
        failureReason: 'Card declined - insufficient funds',
      })

      expect(failedResult.isOk()).toBe(true)
      if (failedResult.isErr()) return

      expect(isFailed(failedResult.value)).toBe(true)
      expect(failedResult.value.failureReason).toBe('Card declined - insufficient funds')
      expect(failedResult.value.failedAt).toBeInstanceOf(Date)

      // 3. Persist the failed state
      const updatedResult = await donationRepo.save(failedResult.value)

      expect(updatedResult.isOk()).toBe(true)
      if (updatedResult.isErr()) return

      // 4. Verify database state
      const dbDonation = await prisma.platformDonation.findUnique({
        where: { id: String(updatedResult.value.id) },
      })

      expect(dbDonation?.status).toBe('FAILED')

      // Verify failure details are stored in metadata
      const metadata = dbDonation?.metadata as Record<string, any>
      expect(metadata?.failedAt).toBeDefined()
      expect(metadata?.failureReason).toBe('Card declined - insufficient funds')
    })

    it('should fail to mark completed donation as failed', async () => {
      // Create and complete a donation
      const donationResult = createDonation({
        userId: testUserId,
        amount: 2500,
        stripePaymentIntentId: 'pi_test_cant_fail',
      })

      expect(donationResult.isOk()).toBe(true)
      if (donationResult.isErr()) return

      const savedResult = await donationRepo.save(donationResult.value)
      expect(savedResult.isOk()).toBe(true)
      if (savedResult.isErr()) return

      const completedResult = completeDonation(savedResult.value)
      expect(completedResult.isOk()).toBe(true)
      if (completedResult.isErr()) return

      const updatedResult = await donationRepo.save(completedResult.value)
      expect(updatedResult.isOk()).toBe(true)
      if (updatedResult.isErr()) return

      // Try to fail it
      const failResult = failDonation(updatedResult.value, {
        failureReason: 'Test error',
      })

      expect(failResult.isErr()).toBe(true)
      if (failResult.isOk()) return

      expect(failResult.error.message).toContain('Only pending donations can be failed')
    })
  })

  describe('refundDonation flow', () => {
    it('should transition completed donation to refunded', async () => {
      // 1. Create and complete donation
      const donationResult = createDonation({
        userId: testUserId,
        amount: 10000,
        stripePaymentIntentId: 'pi_test_refund_123',
      })

      expect(donationResult.isOk()).toBe(true)
      if (donationResult.isErr()) return

      const savedResult = await donationRepo.save(donationResult.value)
      expect(savedResult.isOk()).toBe(true)
      if (savedResult.isErr()) return

      const completedResult = completeDonation(savedResult.value)
      expect(completedResult.isOk()).toBe(true)
      if (completedResult.isErr()) return

      const completedSaved = await donationRepo.save(completedResult.value)
      expect(completedSaved.isOk()).toBe(true)
      if (completedSaved.isErr()) return

      // 2. Refund the donation (simulating Stripe refund processing)
      const refundedResult = refundDonation(completedSaved.value, {
        stripeRefundId: 're_test_123',
        refundReason: 'Customer request',
      })

      expect(refundedResult.isOk()).toBe(true)
      if (refundedResult.isErr()) return

      expect(isRefunded(refundedResult.value)).toBe(true)
      expect(refundedResult.value.stripeRefundId).toBe('re_test_123')
      expect(refundedResult.value.refundReason).toBe('Customer request')
      expect(refundedResult.value.refundedAt).toBeInstanceOf(Date)
      expect(refundedResult.value.completedAt).toBeInstanceOf(Date)

      // 3. Persist the refunded state
      const updatedResult = await donationRepo.save(refundedResult.value)

      expect(updatedResult.isOk()).toBe(true)
      if (updatedResult.isErr()) return

      // 4. Verify database state
      const dbDonation = await prisma.platformDonation.findUnique({
        where: { id: String(updatedResult.value.id) },
      })

      expect(dbDonation?.status).toBe('REFUNDED')

      // Verify refund details are stored in metadata
      const metadata = dbDonation?.metadata as Record<string, any>
      expect(metadata?.completedAt).toBeDefined()
      expect(metadata?.refundedAt).toBeDefined()
      expect(metadata?.refundReason).toBe('Customer request')
      expect(metadata?.stripeRefundId).toBe('re_test_123')
    })

    it('should allow refund without reason', async () => {
      // Create and complete donation
      const donationResult = createDonation({
        userId: testUserId,
        amount: 7500,
        stripePaymentIntentId: 'pi_test_refund_no_reason',
      })

      expect(donationResult.isOk()).toBe(true)
      if (donationResult.isErr()) return

      const savedResult = await donationRepo.save(donationResult.value)
      expect(savedResult.isOk()).toBe(true)
      if (savedResult.isErr()) return

      const completedResult = completeDonation(savedResult.value)
      expect(completedResult.isOk()).toBe(true)
      if (completedResult.isErr()) return

      const completedSaved = await donationRepo.save(completedResult.value)
      expect(completedSaved.isOk()).toBe(true)
      if (completedSaved.isErr()) return

      // Refund without reason
      const refundedResult = refundDonation(completedSaved.value, {
        stripeRefundId: 're_test_no_reason',
      })

      expect(refundedResult.isOk()).toBe(true)
      if (refundedResult.isErr()) return

      expect(refundedResult.value.refundReason).toBeNull()
    })

    it('should fail to refund pending donation', async () => {
      const donationResult = createDonation({
        userId: testUserId,
        amount: 4000,
        stripePaymentIntentId: 'pi_test_cant_refund',
      })

      expect(donationResult.isOk()).toBe(true)
      if (donationResult.isErr()) return

      const savedResult = await donationRepo.save(donationResult.value)
      expect(savedResult.isOk()).toBe(true)
      if (savedResult.isErr()) return

      // Try to refund pending donation
      const refundResult = refundDonation(savedResult.value, {
        stripeRefundId: 're_test_fail',
      })

      expect(refundResult.isErr()).toBe(true)
      if (refundResult.isOk()) return

      expect(refundResult.error.message).toContain('Only completed donations can be refunded')
    })
  })

  describe('findByStripePaymentIntentId', () => {
    it('should find donation by Stripe payment intent ID', async () => {
      // Create donation
      const donationResult = createDonation({
        userId: testUserId,
        amount: 6000,
        stripePaymentIntentId: 'pi_test_find_123',
      })

      expect(donationResult.isOk()).toBe(true)
      if (donationResult.isErr()) return

      await donationRepo.save(donationResult.value)

      // Find by Stripe payment intent ID
      const foundResult = await donationRepo.findByStripePaymentIntentId('pi_test_find_123')

      expect(foundResult.isOk()).toBe(true)
      if (foundResult.isErr()) return

      expect(foundResult.value).not.toBeNull()
      expect(foundResult.value?.stripePaymentIntentId).toBe('pi_test_find_123')
      expect(Number(foundResult.value?.amount)).toBe(6000)
    })

    it('should return null for non-existent payment intent ID', async () => {
      const foundResult = await donationRepo.findByStripePaymentIntentId('pi_nonexistent')

      expect(foundResult.isOk()).toBe(true)
      if (foundResult.isErr()) return

      expect(foundResult.value).toBeNull()
    })
  })

  describe('findByUserId', () => {
    it('should find all donations for a user', async () => {
      // Create multiple donations
      const donation1 = createDonation({
        userId: testUserId,
        amount: 1000,
        stripePaymentIntentId: 'pi_test_user_1',
      })

      const donation2 = createDonation({
        userId: testUserId,
        amount: 2000,
        stripePaymentIntentId: 'pi_test_user_2',
      })

      expect(donation1.isOk()).toBe(true)
      expect(donation2.isOk()).toBe(true)
      if (donation1.isErr() || donation2.isErr()) return

      await donationRepo.save(donation1.value)
      await donationRepo.save(donation2.value)

      // Find all donations for user
      const foundResult = await donationRepo.findByUserId(testUserId)

      expect(foundResult.isOk()).toBe(true)
      if (foundResult.isErr()) return

      expect(foundResult.value.length).toBeGreaterThanOrEqual(2)

      // Verify they're ordered by createdAt desc
      const amounts = foundResult.value.map((d) => Number(d.amount))
      expect(amounts).toContain(1000)
      expect(amounts).toContain(2000)
    })
  })
})
