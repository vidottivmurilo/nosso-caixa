import { Router } from 'express';
import { InstallmentController } from '../controllers/installmentController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas as rotas de parcelamento requerem autenticação
router.use(authMiddleware);

router.post('/', InstallmentController.createInstallment);

export { router as installmentRoutes };
