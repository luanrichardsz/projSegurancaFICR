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
    } catch (error: any) {
      if (error instanceof ZodError) {
        const firstError = error.issues?.[0]?.message || 'Dados inválidos';
        return res.status(400).json({ error: firstError, details: error.issues });
      }
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  }

  async generateBatch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const validated = generateBatchSchema.parse(req.body);
      const dueDate = validated.dueDate || validated.due_date!;
      const amount = validated.amount || validated.default_amount || 120.00;
      
      let competence = validated.competence;
      if (!competence && validated.reference_month && validated.reference_year) {
        competence = `${String(validated.reference_month).padStart(2, '0')}/${validated.reference_year}`;
      }
      if (!competence) {
        competence = `${dueDate.slice(5, 7)}/${dueDate.slice(0, 4)}`;
      }

      const result = await paymentService.generateBatch(
        schoolId,
        competence,
        dueDate,
        amount,
        req.user!.uid
      );

      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ZodError) {
        const firstError = error.issues?.[0]?.message || 'Dados inválidos';
        return res.status(400).json({ error: firstError, details: error.issues });
      }
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  }

  async recordPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const paymentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validated = recordManualPaymentSchema.parse(req.body);
      const paymentMethod = validated.paymentMethod || validated.payment_method || 'PIX';
      const paidAt = validated.paidAt || validated.paid_at;
      const notes = validated.notes;

      const result = await paymentService.recordManualPayment(
        paymentId,
        paymentMethod,
        paidAt,
        req.user!.uid,
        schoolId,
        notes
      );

      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ZodError) {
        const firstError = error.issues?.[0]?.message || 'Dados inválidos';
        return res.status(400).json({ error: firstError, details: error.issues });
      }
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const paymentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await paymentService.deletePayment(paymentId, schoolId, req.user!.uid);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
