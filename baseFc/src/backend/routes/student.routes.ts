import { Router } from 'express';
import { studentController } from '../controllers/student.controller.ts';
import { requireAuth } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/rbac.middleware.ts';
import { checkStudentAccess } from '../middlewares/idor.middleware.ts';

const router = Router();

// Aplica autenticação em todas as rotas de alunos
router.use(requireAuth);

// Gestores e Professores podem listar
router.get('/', requireRole(['GESTOR', 'PROFESSOR']), studentController.list);

// Apenas Gestor pode cadastrar
router.post('/', requireRole(['GESTOR']), studentController.create);

// Obter detalhes e perfil 360 com proteção IDOR (Gestor, Professor da turma, ou Responsável do aluno)
router.get('/:id', checkStudentAccess, studentController.getOne);
router.get('/:id/profile', checkStudentAccess, studentController.getProfile);

// Apenas Gestor pode atualizar ou excluir
router.put('/:id', requireRole(['GESTOR']), studentController.update);
router.delete('/:id', requireRole(['GESTOR']), studentController.delete);

// Apenas Gestor pode reenviar convite ou link de acesso para o responsável
router.post('/:id/guardians/:guardianId/invite', requireRole(['GESTOR']), studentController.reinviteGuardian);
router.post('/:id/reinvite-guardian', requireRole(['GESTOR']), studentController.reinviteGuardian);

export default router;
