import { z } from 'zod';

export const createStudentSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  cpf: z.string().regex(/^\d{11}$/, 'CPF deve conter apenas 11 números'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida (YYYY-MM-DD)'),
  category: z.string().min(2),
  position: z.string().min(2),
  dominantFoot: z.enum(['DIREITO', 'ESQUERDO', 'AMBIDESTRO']),
  shirtNumber: z.number().int().min(1).max(99),
  status: z.enum(['ATIVO', 'INATIVO', 'TRANCADO']).default('ATIVO')
});

export const updateStudentSchema = createStudentSchema.partial();
