import { Router } from 'express';
import { DashboardController } from '../controllers/dashboardController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.use(authMiddleware);

// Rota: GET /dashboard/group/:groupId/summary?month=X&year=Y
router.get('/group/:groupId/summary', DashboardController.getSummary);

export { router as dashboardRoutes };
