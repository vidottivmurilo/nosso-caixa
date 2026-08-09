import { Router } from 'express';
import { AiController } from '../controllers/aiController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas as rotas de IA requerem autenticação
router.use(authMiddleware);

router.post('/parse-transaction', AiController.parseTransaction);

export { router as aiRoutes };
