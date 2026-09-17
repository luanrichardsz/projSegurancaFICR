import { Router } from 'express';
import { attendanceController } from '../controllers/attendance.controller.ts';
import { requireAuth } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/rbac.middleware.ts';

const router = Router();

router.use(requireAuth);

// Gestores e Professores podem consultar chamada e registrar frequência
router.get('/class/:classId', requireRole(['GESTOR', 'PROFESSOR']), attendanceController.getClassAttendance);
router.post('/', requireRole(['GESTOR', 'PROFESSOR']), attendanceController.record);

export default router;
