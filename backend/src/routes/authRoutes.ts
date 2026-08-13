import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/authController';
import { validateBody } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { signupSchema, loginSchema, updatePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/schemas';

const router = Router();

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 auth attempts per 15 minutes
  message: {
    error: {
      message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
      code: 'TOO_MANY_REQUESTS'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/signup', authRateLimiter, validateBody(signupSchema), AuthController.signup);
router.post('/login', authRateLimiter, validateBody(loginSchema), AuthController.login);
router.post('/forgot-password', authRateLimiter, validateBody(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', authRateLimiter, validateBody(resetPasswordSchema), AuthController.resetPassword);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);
router.post('/logout-all', authenticate, AuthController.logoutAll);
router.get('/me', authenticate, AuthController.getProfile);
router.put('/update-password', authenticate, validateBody(updatePasswordSchema), AuthController.updatePassword);

export default router;
