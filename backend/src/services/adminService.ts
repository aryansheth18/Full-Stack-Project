import { prisma } from '../config/db';

export class AdminService {
  static async getDashboardStats() {
    const [totalUsers, totalStores, totalRatings] = await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.rating.count()
    ]);

    return {
      totalUsers,
      totalStores,
      totalRatings
    };
  }
}
