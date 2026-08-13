import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { env } from '../config/env';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  const requestId = (req as any).id || (req.headers['x-request-id'] as string);
  if (requestId) {
    res.setHeader('x-request-id', requestId);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code,
        ...(requestId ? { requestId } : {}),
        ...(err.fields ? { fields: err.fields } : {})
      }
    });
  }

  // Log unexpected internal errors
  console.error('Unhandled internal server error:', err);

  const responseMessage =
    env.NODE_ENV === 'production'
      ? 'An internal server error occurred. Please try again later.'
      : err.message || 'Internal Server Error';

  return res.status(500).json({
    error: {
      message: responseMessage,
      code: 'INTERNAL_SERVER_ERROR',
      ...(requestId ? { requestId } : {})
    }
  });
};
