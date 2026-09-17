import { Router } from 'express';
import { auditController } from '../controllers/audit.controller.ts';
import { requireAuth } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/rbac.middleware.ts';

const router = Router();

router.use(requireAuth);
router.get('/', requireRole(['GESTOR']), auditController.list);

export default router;
