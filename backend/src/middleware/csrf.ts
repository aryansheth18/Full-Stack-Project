import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { AppError } from '../errors/AppError';

export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // If no csrfToken cookie exists, generate one
  let csrfToken = req.cookies?.csrfToken;
  if (!csrfToken) {
    csrfToken = crypto.randomBytes(32).toString('hex');
    res.cookie('csrfToken', csrfToken, {
      httpOnly: false, // Accessible by client JS to read and attach as header
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
  }

  // State-changing methods require matching header when cookie is present
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const headerToken = req.headers['x-csrf-token'];

    // Exempt initial signup and login requests if no cookies exist yet
    const isPublicAuth = req.path.includes('/auth/login') || req.path.includes('/auth/signup');

    if (!isPublicAuth && req.cookies?.refreshToken) {
      if (!headerToken || headerToken !== csrfToken) {
        return next(new AppError('CSRF token validation failed', 403, 'CSRF_INVALID'));
      }
    }
  }

  next();
};
