import { Router } from 'express';
import { SavingsController } from '../controllers/savingsController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.put('/group/:groupId', SavingsController.updateSavings);
router.get('/group/:groupId', SavingsController.getSavings);

export { router as savingsRoutes };
