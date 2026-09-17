import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.ts';
import { paymentService } from '../services/payment.service.ts';
import { createPaymentSchema, recordManualPaymentSchema, generateBatchSchema } from '../validators/payment.validator.ts';
import { ZodError } from 'zod';

export class PaymentController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const { status, studentId, competence } = req.query;
      const payments = await paymentService.listPayments(schoolId, {
        status: status as string,
        studentId: studentId as string,
        competence: competence as string,
      });

      return res.json(payments);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const validated = createPaymentSchema.parse(req.body);
      const newPayment = await paymentService.createPayment(schoolId, validated, req.user!.uid);
      return res.status(201).json(newPayment);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues || (error as any).errors });
      }
      next(error);
    }
  }

  async generateBatch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const validated = generateBatchSchema.parse(req.body);
      const result = await paymentService.generateBatch(
        schoolId,
        validated.competence,
        validated.dueDate,
        validated.amount,
        req.user!.uid
      );

      return res.status(201).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues || (error as any).errors });
      }
      next(error);
    }
  }

  async recordPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const paymentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { paymentMethod, paidAt } = recordManualPaymentSchema.parse(req.body);

      const result = await paymentService.recordManualPayment(
        paymentId,
        paymentMethod,
        paidAt,
        req.user!.uid,
        schoolId
      );

      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues || (error as any).errors });
      }
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
