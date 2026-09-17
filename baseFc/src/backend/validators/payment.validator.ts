import { z } from 'zod';

export const createPaymentSchema = z.object({
  studentId: z.string().uuid('ID do atleta inválido').optional(),
  student_id: z.string().uuid('ID do atleta inválido').optional(),
  amount: z.coerce.number().positive('O valor deve ser maior que zero'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento inválida (YYYY-MM-DD)').optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento inválida (YYYY-MM-DD)').optional(),
  competence: z.string().min(3, 'Competência obrigatória (ex: 09/2026)').optional(),
  reference_month: z.coerce.number().int().min(1).max(12).optional(),
  reference_year: z.coerce.number().int().min(2020).max(2050).optional()
}).refine(data => Boolean(data.studentId || data.student_id), {
  message: 'ID do atleta obrigatório',
  path: ['studentId']
}).refine(data => Boolean(data.dueDate || data.due_date), {
  message: 'Data de vencimento obrigatória',
  path: ['dueDate']
});

export const recordManualPaymentSchema = z.object({
  paymentMethod: z.enum(['PIX', 'DINHEIRO', 'CARTAO', 'TRANSFERENCIA']).optional(),
  payment_method: z.enum(['PIX', 'DINHEIRO', 'CARTAO', 'TRANSFERENCIA']).optional(),
  paidAt: z.string().optional(),
  paid_at: z.string().optional(),
  notes: z.string().max(255).optional()
});

export const generateBatchSchema = z.object({
  competence: z.string().min(3, 'Competência obrigatória (ex: 09/2026)').optional(),
  reference_month: z.coerce.number().int().min(1).max(12).optional(),
  reference_year: z.coerce.number().int().min(2020).max(2050).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento inválida (YYYY-MM-DD)').optional(),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento inválida (YYYY-MM-DD)').optional(),
  amount: z.coerce.number().positive('O valor deve ser maior que zero').optional(),
  default_amount: z.coerce.number().positive('O valor deve ser maior que zero').optional()
}).refine(data => Boolean(data.dueDate || data.due_date), {
  message: 'Data de vencimento obrigatória',
  path: ['dueDate']
});
