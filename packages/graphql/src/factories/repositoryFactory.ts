import { PrismaClient } from '@repo/database'
import {
  PrismaChurchRepository,
  PrismaReviewRepository,
  PrismaDonationRepository,
} from '@repo/infrastructure'

/**
 * Factory for creating repository instances
 * Allows for easy mocking in tests
 */
export class RepositoryFactory {
  constructor(private readonly prisma: PrismaClient) {}

  createChurchRepository() {
    return new PrismaChurchRepository(this.prisma)
  }

  createReviewRepository() {
    return new PrismaReviewRepository(this.prisma)
  }

  createDonationRepository() {
    return new PrismaDonationRepository(this.prisma)
  }
}

/**
 * Singleton instance using the global prisma client
 */
let repositoryFactory: RepositoryFactory | null = null

export function getRepositoryFactory(prisma: PrismaClient): RepositoryFactory {
  if (!repositoryFactory) {
    repositoryFactory = new RepositoryFactory(prisma)
  }
  return repositoryFactory
}
