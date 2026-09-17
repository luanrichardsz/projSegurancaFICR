import { z } from 'zod';

export const createPaymentSchema = z.object({
  studentId: z.string().uuid('ID do atleta obrigatório'),
  amount: z.number().positive('O valor deve ser maior que zero'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento inválida (YYYY-MM-DD)'),
  competence: z.string().min(3, 'Competência obrigatória (ex: 09/2026)')
});

export const recordManualPaymentSchema = z.object({
  paymentMethod: z.enum(['PIX', 'DINHEIRO', 'CARTAO', 'TRANSFERENCIA']).default('PIX'),
  paidAt: z.string().optional()
});

export const generateBatchSchema = z.object({
  competence: z.string().min(3, 'Competência obrigatória (ex: 09/2026)'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento inválida (YYYY-MM-DD)'),
  amount: z.number().positive('O valor deve ser maior que zero').default(120.00)
});
