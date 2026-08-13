import { AppError } from '../errors/AppError';
import { logAuthFailure } from '../config/logger';

interface FailureRecord {
  count: number;
  lockUntil: number | null;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

const failureMap = new Map<string, FailureRecord>();

export class AccountLockoutService {
  static checkLockout(email: string): void {
    const record = failureMap.get(email.toLowerCase());
    if (!record) return;

    if (record.lockUntil && Date.now() < record.lockUntil) {
      const remainingSeconds = Math.ceil((record.lockUntil - Date.now()) / 1000);
      logAuthFailure('ACCOUNT_LOCKED', { email, remainingSeconds });
      throw new AppError(
        `Account locked due to 5 failed login attempts. Try again in ${remainingSeconds} seconds.`,
        429,
        'ACCOUNT_LOCKED'
      );
    }

    if (record.lockUntil && Date.now() >= record.lockUntil) {
      // Lock expired, reset
      failureMap.delete(email.toLowerCase());
    }
  }

  static recordFailedAttempt(email: string): void {
    const key = email.toLowerCase();
    const record = failureMap.get(key) || { count: 0, lockUntil: null };
    record.count += 1;

    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.lockUntil = Date.now() + LOCK_TIME_MS;
      logAuthFailure('MAX_FAILED_ATTEMPTS_EXCEEDED', { email, count: record.count });
    }

    failureMap.set(key, record);
  }

  static resetAttempts(email: string): void {
    failureMap.delete(email.toLowerCase());
  }
}
