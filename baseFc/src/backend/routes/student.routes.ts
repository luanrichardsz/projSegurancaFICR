import { Router } from 'express';
import { studentController } from '../controllers/student.controller.ts';
import { requireAuth } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/rbac.middleware.ts';
import { checkStudentAccess } from '../middlewares/idor.middleware.ts';

const router = Router();

// Aplica autenticação em todas as rotas de alunos
router.use(requireAuth);

router.post('/', requireRole(['GESTOR']), studentController.create);
router.get('/', requireRole(['GESTOR']), studentController.list);
router.get('/:id', checkStudentAccess, studentController.getOne);

export default router;
