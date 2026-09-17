import { Router } from 'express';
import { teacherController } from '../controllers/teacher.controller.ts';
import { requireAuth } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/rbac.middleware.ts';

const router = Router();

router.use(requireAuth);

router.get('/', requireRole(['GESTOR', 'PROFESSOR']), teacherController.list);
router.post('/', requireRole(['GESTOR']), teacherController.create);
router.put('/:id', requireRole(['GESTOR']), teacherController.update);
router.delete('/:id', requireRole(['GESTOR']), teacherController.delete);

export default router;
