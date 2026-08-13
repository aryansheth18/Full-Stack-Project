import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/db';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';
import { Role } from '@prisma/client';
import { AccountLockoutService } from './accountLockoutService';
import { logAuthFailure } from '../config/logger';

export interface TokenPayload {
  userId: string;
  role: Role;
}

export class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static async login(email: string, pass: string) {
    // Check account lockout status first
    AccountLockoutService.checkLockout(email);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      AccountLockoutService.recordFailedAttempt(email);
      logAuthFailure('INVALID_CREDENTIALS', { email });
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await this.comparePassword(pass, user.passwordHash);
    if (!isMatch) {
      AccountLockoutService.recordFailedAttempt(email);
      logAuthFailure('INVALID_CREDENTIALS', { email });
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    // Reset attempts on clean authentication
    AccountLockoutService.resetAttempts(email);

    const accessToken = this.generateAccessToken(user.id, user.role);
    const refreshToken = await this.createRefreshToken(user.id);

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
  }

  static async refreshTokens(rawRefreshToken: string) {
    const hashed = this.hashToken(rawRefreshToken);

    const storedToken = await prisma.refreshToken.findFirst({
      where: { tokenHash: hashed, revoked: false },
      include: { user: true }
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { revoked: true }
        });
      }
      logAuthFailure('INVALID_REFRESH_TOKEN', { tokenHash: hashed });
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Revoke old token (Rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true }
    });

    const newAccessToken = this.generateAccessToken(storedToken.user.id, storedToken.user.role);
    const newRefreshToken = await this.createRefreshToken(storedToken.user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: {
        id: storedToken.user.id,
        name: storedToken.user.name,
        email: storedToken.user.email,
        role: storedToken.user.role
      }
    };
  }

  static async requestPasswordReset(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return generic message to prevent email enumeration attacks
      return { message: 'If that email address exists in our system, a password reset token has been generated.' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });

    return {
      message: 'If that email address exists in our system, a password reset token has been generated.',
      // Returned for dev testing convenience
      resetToken: rawToken,
      expiresAt
    };
  }

  static async resetPasswordWithToken(email: string, rawToken: string, newPass: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError('Invalid or expired password reset token', 400, 'INVALID_RESET_TOKEN');
    }

    const tokenHash = this.hashToken(rawToken);
    const storedResetToken = await prisma.passwordResetToken.findFirst({
      where: {
        userId: user.id,
        tokenHash,
        used: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!storedResetToken) {
      throw new AppError('Invalid or expired password reset token', 400, 'INVALID_RESET_TOKEN');
    }

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: storedResetToken.id },
      data: { used: true }
    });

    // Hash new password and update user record
    const newHash = await this.hashPassword(newPass);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });

    // Revoke all active refresh tokens for security
    await this.revokeAllUserTokens(user.id);
    AccountLockoutService.resetAttempts(email);

    return { message: 'Password has been reset successfully. Please log in with your new password.' };
  }

  static async logout(rawRefreshToken: string) {
    if (!rawRefreshToken) return;
    const hashed = this.hashToken(rawRefreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashed },
      data: { revoked: true }
    });
  }

  static async logoutAll(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true }
    });
  }

  static async revokeAllUserTokens(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true }
    });
  }

  static generateAccessToken(userId: string, role: Role): string {
    return jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: '15m' });
  }

  static async createRefreshToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const hashed = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashed,
        expiresAt
      }
    });

    return rawToken;
  }

  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
