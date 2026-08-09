import { Router } from 'express';
import { FixedExpenseController } from '../controllers/fixedExpenseController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', FixedExpenseController.createFixedExpense);
router.get('/group/:groupId', FixedExpenseController.listFixedExpenses);
router.post('/group/:groupId/generate-month', FixedExpenseController.generateMonth);

export { router as fixedExpenseRoutes };
