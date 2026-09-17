import { z } from 'zod';

export const createTeacherSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100),
  email: z.string().email('E-mail inválido').optional().nullable().or(z.literal('')),
  phone: z.string().max(15).optional().nullable().or(z.literal('')),
  cref: z.string().max(20).optional().nullable().or(z.literal('')),
  specialties: z.array(z.string()).optional().default([]),
  status: z.enum(['ATIVO', 'INATIVO']).default('ATIVO')
});

export const updateTeacherSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100).optional(),
  email: z.string().email('E-mail inválido').optional().nullable().or(z.literal('')),
  phone: z.string().max(15).optional().nullable().or(z.literal('')),
  cref: z.string().max(20).optional().nullable().or(z.literal('')),
  specialties: z.array(z.string()).optional(),
  status: z.enum(['ATIVO', 'INATIVO']).optional()
});
