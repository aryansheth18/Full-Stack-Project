import { Router } from 'express';
import { Role } from '@prisma/client';
import { AdminController } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import {
  createUserSchema,
  createStoreSchema,
  queryParamsSchema
} from '../validators/schemas.js';

const router = Router();

router.use(authenticate, requireRole(Role.ADMIN));

router.get('/dashboard', AdminController.getDashboardStats);

router.post('/users', validateBody(createUserSchema), AdminController.createUser);
router.get('/users', validateQuery(queryParamsSchema), AdminController.getUsers);
router.get('/users/:id', AdminController.getUserById);
router.delete('/users/:id', AdminController.deleteUser);

router.post('/stores', validateBody(createStoreSchema), AdminController.createStore);
router.get('/stores', validateQuery(queryParamsSchema), AdminController.getStores);

export default router;
