import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { prisma } from './config/db.js';
import { httpLogger } from './config/logger.js';
import { openApiSpec } from './config/swagger.js';
import { csrfProtection } from './middleware/csrf.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import ownerRoutes from './routes/ownerRoutes.js';

import path from 'path';
import fs from 'fs';
import './types/express.js';

const app = express();

// Request logging middleware
app.use(httpLogger);

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'x-request-id']
  })
);

// Body parsers & Cookie parser
app.use(express.json());
app.use(cookieParser());

// Double-submit cookie CSRF protection
app.use(csrfProtection);

// Interactive OpenAPI / Swagger Documentation
if (env.NODE_ENV !== 'production') {
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
}

// Deep Health check endpoint (checks process liveness & PostgreSQL DB connectivity)
app.get('/health', async (_req: express.Request, res: express.Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      status: 'HEALTHY',
      database: 'CONNECTED',
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(503).json({
      status: 'UNHEALTHY',
      database: 'DISCONNECTED',
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/owner', ownerRoutes);

// Serve static frontend in production (Single Web Service mode)
const candidatePaths = [
  path.resolve(__dirname, '../../frontend/dist'),
  path.resolve(process.cwd(), '../frontend/dist'),
  path.resolve(process.cwd(), 'frontend/dist')
];
const frontendDist = candidatePaths.find((p) => fs.existsSync(p));
if (frontendDist) {
  app.use(express.static(frontendDist));
  app.get('*', (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
      return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Centralized error handler
app.use(errorHandler);

export default app;
