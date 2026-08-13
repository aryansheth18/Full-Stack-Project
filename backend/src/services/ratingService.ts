import { prisma } from '../config/db';
import { AppError } from '../errors/AppError';
import { RatingInput } from '../validators/schemas';

export class RatingService {
  static async submitOrUpdateRating(userId: string, storeId: string, input: RatingInput) {
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      throw new AppError('Store not found', 404, 'STORE_NOT_FOUND');
    }

    const rating = await prisma.rating.upsert({
      where: {
        userId_storeId: {
          userId,
          storeId
        }
      },
      update: {
        ratingValue: input.ratingValue
      },
      create: {
        userId,
        storeId,
        ratingValue: input.ratingValue
      }
    });

    // Recompute overall store average rating
    const storeRatings = await prisma.rating.findMany({
      where: { storeId },
      select: { ratingValue: true }
    });

    const totalRatings = storeRatings.length;
    const overallRating =
      totalRatings > 0
        ? Number((storeRatings.reduce((sum, r) => sum + r.ratingValue, 0) / totalRatings).toFixed(2))
        : 0;

    return {
      rating: {
        id: rating.id,
        storeId: rating.storeId,
        userId: rating.userId,
        ratingValue: rating.ratingValue,
        updatedAt: rating.updatedAt
      },
      storeOverallRating: overallRating,
      totalRatingsCount: totalRatings
    };
  }
}
