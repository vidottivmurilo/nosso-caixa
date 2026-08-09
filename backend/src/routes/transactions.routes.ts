import { Router } from 'express';
import { TransactionController } from '../controllers/transactionController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// Todas as rotas de transação requerem autenticação
router.use(authMiddleware);

router.post('/', TransactionController.createTransaction);
router.get('/group/:groupId', TransactionController.listTransactions);
router.delete('/:id', TransactionController.deleteTransaction);

export { router as transactionRoutes };
