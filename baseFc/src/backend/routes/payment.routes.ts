import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.ts';
import { requireAuth } from '../middlewares/auth.middleware.ts';
import { requireRole } from '../middlewares/rbac.middleware.ts';

const router = Router();

router.use(requireAuth);

// Apenas Gestor pode gerenciar pagamentos e dar baixa manual
router.get('/', requireRole(['GESTOR']), paymentController.list);
router.post('/', requireRole(['GESTOR']), paymentController.create);
router.post('/batch', requireRole(['GESTOR']), paymentController.generateBatch);
router.post('/:id/pay', requireRole(['GESTOR']), paymentController.recordPayment);

export default router;
