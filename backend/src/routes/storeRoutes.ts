import { Router } from 'express';
import { Role } from '@prisma/client';
import { StoreController } from '../controllers/storeController';
import { authenticate, requireRole } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import { ratingSchema, queryParamsSchema } from '../validators/schemas';

const router = Router();

router.use(authenticate);

router.get('/', validateQuery(queryParamsSchema), StoreController.getUserStores);
router.post(
  '/:id/rating',
  requireRole(Role.USER, Role.ADMIN),
  validateBody(ratingSchema),
  StoreController.submitRating
);

export default router;
