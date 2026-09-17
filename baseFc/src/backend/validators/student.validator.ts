import { z } from 'zod';

export const createStudentSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  cpf: z.string().max(14).optional().or(z.literal('')),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida (YYYY-MM-DD)'),
  phone: z.string().max(15).optional().or(z.literal('')),
  address: z.string().max(150).optional().or(z.literal('')),
  category: z.string().min(2, 'Categoria obrigatória').max(50),
  position: z.string().min(2, 'Posição obrigatória').max(50),
  dominantFoot: z.enum(['DIREITO', 'ESQUERDO', 'AMBIDESTRO']),
  shirtNumber: z.number().int().min(1).max(99),
  status: z.enum(['ATIVO', 'INATIVO', 'TRANCADO']).default('ATIVO'),
  classId: z.string().uuid().optional().nullable().or(z.literal('')),
  allergies: z.string().max(200).optional().or(z.literal('')),
  medicalRestrictions: z.string().max(200).optional().or(z.literal('')),
  medications: z.string().max(200).optional().or(z.literal('')),
  // Responsável
  guardian: z.object({
    name: z.string().min(3, 'Nome do responsável obrigatório').max(100),
    cpf: z.string().max(14).optional().or(z.literal('')),
    phone: z.string().min(8, 'Telefone do responsável obrigatório').max(15),
    relationship: z.string().max(50).optional().default('Pai/Mãe')
  }).optional().nullable(),
  // Contato de Emergência
  emergencyContact: z.object({
    name: z.string().min(3, 'Nome do contato de emergência').max(100),
    relationship: z.string().max(50).optional().default('Familiar'),
    phone: z.string().min(8, 'Telefone de emergência').max(15),
    authorizedPickup: z.boolean().default(true),
    notes: z.string().max(200).optional().or(z.literal(''))
  }).optional().nullable()
});

export const updateStudentSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100).optional(),
  cpf: z.string().max(14).optional().nullable().or(z.literal('')),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de nascimento inválida (YYYY-MM-DD)').optional(),
  phone: z.string().max(15).optional().nullable().or(z.literal('')),
  address: z.string().max(150).optional().nullable().or(z.literal('')),
  category: z.string().min(2, 'Categoria obrigatória').max(50).optional(),
  position: z.string().min(2, 'Posição obrigatória').max(50).optional(),
  dominantFoot: z.enum(['DIREITO', 'ESQUERDO', 'AMBIDESTRO']).optional(),
  dominant_foot: z.enum(['DIREITO', 'ESQUERDO', 'AMBIDESTRO']).optional(),
  shirtNumber: z.number().int().min(1).max(99).optional(),
  shirt_number: z.number().int().min(1).max(99).optional(),
  status: z.enum(['ATIVO', 'INATIVO', 'TRANCADO']).optional(),
  classId: z.string().uuid().optional().nullable().or(z.literal('')),
  allergies: z.string().max(200).optional().nullable().or(z.literal('')),
  medicalRestrictions: z.string().max(200).optional().nullable().or(z.literal('')),
  medical_restrictions: z.string().max(200).optional().nullable().or(z.literal('')),
  medications: z.string().max(200).optional().nullable().or(z.literal('')),
  guardian: z.object({
    name: z.string().min(3, 'Nome do responsável obrigatório').max(100),
    cpf: z.string().max(14).optional().nullable().or(z.literal('')),
    phone: z.string().min(8, 'Telefone do responsável obrigatório').max(15),
    relationship: z.string().max(50).optional().default('Pai/Mãe')
  }).optional().nullable(),
  emergencyContact: z.object({
    name: z.string().min(3, 'Nome do contato de emergência').max(100),
    relationship: z.string().max(50).optional().default('Familiar'),
    phone: z.string().min(8, 'Telefone de emergência').max(15),
    authorizedPickup: z.boolean().default(true),
    notes: z.string().max(200).optional().nullable().or(z.literal(''))
  }).optional().nullable()
});

