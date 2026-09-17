import { Router } from 'express';
import { classController } from '../controllers/class.controller.ts';
import { requireAuth } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/rbac.middleware.ts';

const router = Router();

router.use(requireAuth);

// Gestores e Professores podem listar turmas e ver detalhes
router.get('/', requireRole(['GESTOR', 'PROFESSOR']), classController.list);
router.get('/:id', requireRole(['GESTOR', 'PROFESSOR']), classController.getOne);

// Apenas Gestor pode criar turma e matricular/desmatricular alunos
router.post('/', requireRole(['GESTOR']), classController.create);
router.post('/:id/students', requireRole(['GESTOR']), classController.enrollStudent);
router.delete('/:id/students/:studentId', requireRole(['GESTOR']), classController.unenrollStudent);

export default router;
