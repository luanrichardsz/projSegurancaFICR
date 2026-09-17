import { z } from 'zod';

export const createStudentSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  cpf: z.string().optional().or(z.literal('')),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida (YYYY-MM-DD)'),
  category: z.string().min(2, 'Categoria obrigatória'),
  position: z.string().min(2, 'Posição obrigatória'),
  dominantFoot: z.enum(['DIREITO', 'ESQUERDO', 'AMBIDESTRO']),
  shirtNumber: z.number().int().min(1).max(99),
  status: z.enum(['ATIVO', 'INATIVO', 'TRANCADO']).default('ATIVO'),
  classId: z.string().uuid().optional().nullable(),
  // Responsável
  guardian: z.object({
    name: z.string().min(3, 'Nome do responsável obrigatório'),
    cpf: z.string().optional().or(z.literal('')),
    phone: z.string().min(8, 'Telefone do responsável obrigatório'),
    relationship: z.string().optional().default('Pai/Mãe')
  }).optional().nullable(),
  // Contato de Emergência
  emergencyContact: z.object({
    name: z.string().min(3, 'Nome do contato de emergência'),
    relationship: z.string().optional().default('Familiar'),
    phone: z.string().min(8, 'Telefone de emergência'),
    authorizedPickup: z.boolean().default(true),
    notes: z.string().optional()
  }).optional().nullable()
});

export const updateStudentSchema = createStudentSchema.partial();
