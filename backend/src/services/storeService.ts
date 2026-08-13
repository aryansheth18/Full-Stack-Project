import { Role } from '@prisma/client';
import { prisma } from '../config/db';
import { AppError } from '../errors/AppError';
import { CreateStoreInput, QueryParamsInput } from '../validators/schemas';
import { AuditService } from './auditService';

export class StoreService {
  static async createStore(adminId: string, input: CreateStoreInput) {
    const owner = await prisma.user.findUnique({
      where: { id: input.ownerId }
    });

    if (!owner) {
      throw new AppError('Store owner user not found', 404, 'OWNER_NOT_FOUND', {
        ownerId: ['Specified store owner user does not exist']
      });
    }

    const existingStore = await prisma.store.findUnique({
      where: { email: input.email }
    });

    if (existingStore) {
      throw new AppError('Store with this email already exists', 400, 'STORE_EMAIL_EXISTS', {
        email: ['A store with this email address already exists']
      });
    }

    // Ensure owner role is set to STORE_OWNER
    if (owner.role !== Role.STORE_OWNER) {
      await prisma.user.update({
        where: { id: owner.id },
        data: { role: Role.STORE_OWNER }
      });

      await AuditService.logAction(adminId, 'ROLE_CHANGE', 'USER', owner.id, {
        previousRole: owner.role,
        newRole: Role.STORE_OWNER
      });
    }

    const store = await prisma.store.create({
      data: {
        name: input.name,
        email: input.email,
        address: input.address,
        ownerId: input.ownerId
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Audit log entry
    await AuditService.logAction(adminId, 'CREATE_STORE', 'STORE', store.id, {
      name: store.name,
      email: store.email,
      ownerId: store.ownerId
    });

    return {
      id: store.id,
      name: store.name,
      email: store.email,
      address: store.address,
      owner: store.owner,
      createdAt: store.createdAt
    };
  }

  static async getAdminStores(params: QueryParamsInput) {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    const stores = await prisma.store.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        ratings: { select: { ratingValue: true } }
      }
    });

    const formattedStores = stores.map((s) => {
      const ratingCount = s.ratings.length;
      const overallRating =
        ratingCount > 0
          ? Number((s.ratings.reduce((sum, r) => sum + r.ratingValue, 0) / ratingCount).toFixed(2))
          : 0;

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        address: s.address,
        owner: s.owner,
        overallRating,
        totalRatings: ratingCount,
        createdAt: s.createdAt
      };
    });

    if (sortBy === 'overallRating' || sortBy === 'rating') {
      formattedStores.sort((a, b) =>
        order === 'asc' ? a.overallRating - b.overallRating : b.overallRating - a.overallRating
      );
    } else {
      const key = ['name', 'email', 'address', 'createdAt'].includes(sortBy)
        ? (sortBy as keyof (typeof formattedStores)[0])
        : 'createdAt';
      formattedStores.sort((a, b) => {
        const valA = a[key] ?? '';
        const valB = b[key] ?? '';
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const paginatedStores = formattedStores.slice(skip, skip + limit);

    return {
      data: paginatedStores,
      meta: {
        total: formattedStores.length,
        page,
        limit,
        totalPages: Math.ceil(formattedStores.length / limit)
      }
    };
  }

  static async getUserStores(userId: string, params: QueryParamsInput) {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', search } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    const stores = await prisma.store.findMany({
      where,
      include: {
        ratings: { select: { userId: true, ratingValue: true } }
      }
    });

    const formattedStores = stores.map((s) => {
      const totalCount = s.ratings.length;
      const overallRating =
        totalCount > 0
          ? Number((s.ratings.reduce((acc, r) => acc + r.ratingValue, 0) / totalCount).toFixed(2))
          : 0;

      const userRatingObj = s.ratings.find((r) => r.userId === userId);

      return {
        id: s.id,
        name: s.name,
        address: s.address,
        overallRating,
        totalRatings: totalCount,
        myRating: userRatingObj ? userRatingObj.ratingValue : null,
        createdAt: s.createdAt
      };
    });

    if (sortBy === 'overallRating' || sortBy === 'rating') {
      formattedStores.sort((a, b) =>
        order === 'asc' ? a.overallRating - b.overallRating : b.overallRating - a.overallRating
      );
    } else {
      const key = ['name', 'address', 'createdAt'].includes(sortBy)
        ? (sortBy as keyof (typeof formattedStores)[0])
        : 'createdAt';
      formattedStores.sort((a, b) => {
        const valA = a[key] ?? '';
        const valB = b[key] ?? '';
        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const paginated = formattedStores.slice(skip, skip + limit);

    return {
      data: paginated,
      meta: {
        total: formattedStores.length,
        page,
        limit,
        totalPages: Math.ceil(formattedStores.length / limit)
      }
    };
  }

  static async getOwnerDashboard(ownerUserId: string) {
    const store = await prisma.store.findFirst({
      where: { ownerId: ownerUserId },
      include: {
        ratings: {
          include: {
            user: {
              select: { id: true, name: true, email: true, address: true }
            }
          },
          orderBy: { updatedAt: 'desc' }
        }
      }
    });

    if (!store) {
      throw new AppError('No store associated with this store owner account', 404, 'STORE_NOT_FOUND');
    }

    const totalRatings = store.ratings.length;
    const averageRating =
      totalRatings > 0
        ? Number((store.ratings.reduce((acc, r) => acc + r.ratingValue, 0) / totalRatings).toFixed(2))
        : 0;

    const userRatingsList = store.ratings.map((r) => ({
      ratingId: r.id,
      ratingValue: r.ratingValue,
      updatedAt: r.updatedAt,
      user: {
        id: r.user.id,
        name: r.user.name,
        email: r.user.email,
        address: r.user.address
      }
    }));

    return {
      store: {
        id: store.id,
        name: store.name,
        email: store.email,
        address: store.address
      },
      averageRating,
      totalRatings,
      ratings: userRatingsList
    };
  }
}
