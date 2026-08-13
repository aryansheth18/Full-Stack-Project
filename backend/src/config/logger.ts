import pino from 'pino';
import pinoHttp from 'pino-http';
import crypto from 'crypto';
import { env } from './env';

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : 'info',
  formatters: {
    level: (label) => ({ level: label })
  },
  base: undefined,
  timestamp: pino.stdTimeFunctions.isoTime
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => {
    const existingId = req.headers['x-request-id'];
    if (existingId && typeof existingId === 'string') {
      return existingId;
    }
    return crypto.randomUUID();
  },
  customSuccessMessage: (req, res) => {
    return `${req.method} ${req.url} completed with status ${res.statusCode}`;
  },
  customErrorMessage: (req, res, err) => {
    return `${req.method} ${req.url} failed with status ${res.statusCode}: ${err.message}`;
  }
});

export const logAuthFailure = (reason: string, details: Record<string, any>) => {
  logger.warn({
    event: 'AUTH_FAILURE',
    reason,
    timestamp: new Date().toISOString(),
    ...details
  });
};

export const logRbacDenial = (role: string, path: string, details: Record<string, any>) => {
  logger.warn({
    event: 'RBAC_ACCESS_DENIED',
    userRole: role,
    attemptedPath: path,
    timestamp: new Date().toISOString(),
    ...details
  });
};
