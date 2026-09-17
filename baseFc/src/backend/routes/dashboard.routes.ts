import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller.ts';
import { requireAuth } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/rbac.middleware.ts';

const router = Router();

router.use(requireAuth);
router.get('/', requireRole(['GESTOR']), dashboardController.getMetrics);

export default router;
