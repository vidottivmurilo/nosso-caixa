import { Router } from 'express';
import { AuthController } from '../controllers/authController.js';

const authRoutes = Router();

authRoutes.post('/register', AuthController.register);
authRoutes.post('/login', AuthController.login);
authRoutes.post('/verify-email', AuthController.verifyEmail);
authRoutes.post('/resend-verification', AuthController.resendVerification);

export { authRoutes };
