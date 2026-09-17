import { Router } from 'express';
import { classController } from '../controllers/class.controller.ts';
import { requireAuth } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/rbac.middleware.ts';

const router = Router();

router.use(requireAuth);

// Gestores e Professores podem listar turmas e ver detalhes
router.get('/', requireRole(['GESTOR', 'PROFESSOR']), classController.list);
router.get('/:id', requireRole(['GESTOR', 'PROFESSOR']), classController.getOne);
router.get('/:id/students', requireRole(['GESTOR', 'PROFESSOR']), classController.getStudents);

// Gestor pode criar, editar e excluir turmas (incluindo definir professor)
router.post('/', requireRole(['GESTOR']), classController.create);
router.put('/:id', requireRole(['GESTOR']), classController.update);
router.delete('/:id', requireRole(['GESTOR']), classController.delete);

// Matricular / Desmatricular alunos
router.post('/:id/students', requireRole(['GESTOR']), classController.enrollStudent);
router.post('/:id/enroll', requireRole(['GESTOR']), classController.enrollStudent);
router.delete('/:id/students/:studentId', requireRole(['GESTOR']), classController.unenrollStudent);
router.delete('/:id/enroll/:studentId', requireRole(['GESTOR']), classController.unenrollStudent);

export default router;

