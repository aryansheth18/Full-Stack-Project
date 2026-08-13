import { Role } from '@prisma/client';
import { prisma } from '../config/db.js';
import { AppError } from '../errors/AppError.js';
import { AuthService } from './authService.js';
import { SignupInput, CreateUserInput, UpdatePasswordInput, QueryParamsInput } from '../validators/schemas.js';
import { AuditService } from './auditService.js';

export class UserService {
  static async signup(input: SignupInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existingUser) {
      throw new AppError('An account with this email already exists', 400, 'EMAIL_EXISTS', {
        email: ['An account with this email address already exists']
      });
    }

    const authResult = await AuthService.login(input.email, input.password).catch(async () => {
      // If login fails (user doesn't exist), create user
      const passwordHash = await AuthService.hashPassword(input.password);
      const user = await prisma.user.create({
        data: {
          name: input.name,
          email: input.email,
          address: input.address,
          passwordHash,
          role: Role.USER
        }
      });

      const accessToken = AuthService.generateAccessToken(user.id, user.role);
      const refreshToken = await AuthService.createRefreshToken(user.id);

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          address: user.address,
          role: user.role
        },
        accessToken,
        refreshToken
      };
    });

    return authResult;
  }

  static async createUser(adminId: string, input: CreateUserInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 400, 'EMAIL_EXISTS', {
        email: ['A user with this email address already exists']
      });
    }

    const passwordHash = await AuthService.hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        address: input.address,
        passwordHash,
        role: input.role
      }
    });

    // Write audit log entry
    await AuditService.logAction(adminId, 'CREATE_USER', 'USER', user.id, {
      name: user.name,
      email: user.email,
      role: user.role
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt
    };
  }

  static async updatePassword(userId: string, input: UpdatePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const isMatch = await AuthService.comparePassword(input.currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_CURRENT_PASSWORD', {
        currentPassword: ['Current password is incorrect']
      });
    }

    const newHash = await AuthService.hashPassword(input.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash }
    });

    // Invalidate all active refresh tokens for the user on password change
    await AuthService.revokeAllUserTokens(userId);

    return { message: 'Password updated successfully' };
  }

  static async getUsers(params: QueryParamsInput) {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', search, role } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    const validSortFields = ['name', 'email', 'address', 'role', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: order },
        select: {
          id: true,
          name: true,
          email: true,
          address: true,
          role: true,
          createdAt: true
        }
      }),
      prisma.user.count({ where })
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        address: true,
        role: true,
        createdAt: true,
        ownedStores: {
          select: {
            id: true,
            name: true,
            email: true,
            address: true,
            ratings: {
              select: {
                ratingValue: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    let storeDetail = null;
    if (user.role === Role.STORE_OWNER && user.ownedStores.length > 0) {
      const store = user.ownedStores[0];
      const totalRatings = store.ratings.length;
      const avgRating =
        totalRatings > 0
          ? Number((store.ratings.reduce((acc: number, r: { ratingValue: number }) => acc + r.ratingValue, 0) / totalRatings).toFixed(2))
          : 0;

      storeDetail = {
        storeId: store.id,
        storeName: store.name,
        storeAddress: store.address,
        averageRating: avgRating,
        totalRatingsSubmitted: totalRatings
      };
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      storeDetail
    };
  }

  static async deleteUser(adminId: string, targetUserId: string) {
    if (adminId === targetUserId) {
      throw new AppError('Admin cannot delete their own account', 400, 'CANNOT_DELETE_SELF');
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    await prisma.user.delete({
      where: { id: targetUserId }
    });

    await AuditService.logAction(adminId, 'DELETE_USER', 'USER', targetUserId, {
      name: user.name,
      email: user.email,
      role: user.role
    });

    return { message: 'User deleted successfully' };
  }
}
