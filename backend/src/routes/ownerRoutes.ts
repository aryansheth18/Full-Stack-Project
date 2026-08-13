import { Router } from 'express';
import { Role } from '@prisma/client';
import { StoreController } from '../controllers/storeController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireRole(Role.STORE_OWNER));

router.get('/dashboard', StoreController.getOwnerDashboard);

export default router;
