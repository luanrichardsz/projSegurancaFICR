import { z } from 'zod';

export const createClassSchema = z.object({
  name: z.string().min(2, 'Nome da turma obrigatório').max(100),
  category: z.string().min(2, 'Categoria obrigatória (ex: Sub-11, Sub-13)'),
  teacherId: z.string().uuid('ID do professor inválido').optional().nullable().or(z.literal('')),
  teacher_id: z.string().uuid('ID do professor inválido').optional().nullable().or(z.literal('')),
  daysOfWeek: z.array(z.string()).optional(),
  days_of_week: z.array(z.string()).optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horário de início inválido (HH:MM)').optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horário de início inválido (HH:MM)').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horário de término inválido (HH:MM)').optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horário de término inválido (HH:MM)').optional(),
  location: z.string().optional().default('Campo Principal'),
  capacity: z.number().int().min(1, 'Capacidade deve ser de no mínimo 1 aluno').max(100).default(25),
  status: z.enum(['ATIVO', 'INATIVO']).default('ATIVO')
}).refine(data => (data.daysOfWeek && data.daysOfWeek.length > 0) || (data.days_of_week && data.days_of_week.length > 0), {
  message: 'Informe pelo menos um dia de treino',
  path: ['daysOfWeek']
}).refine(data => data.startTime || data.start_time, {
  message: 'Horário de início obrigatório',
  path: ['startTime']
}).refine(data => data.endTime || data.end_time, {
  message: 'Horário de término obrigatório',
  path: ['endTime']
});


export const updateClassSchema = z.object({
  name: z.string().min(2, 'Nome da turma deve ter no mínimo 2 caracteres').max(100).optional(),
  category: z.string().min(2, 'Categoria obrigatória').optional(),
  teacherId: z.string().uuid('ID do professor inválido').nullable().optional().or(z.literal('')),
  teacher_id: z.string().uuid('ID do professor inválido').nullable().optional().or(z.literal('')),
  daysOfWeek: z.array(z.string()).min(1, 'Informe pelo menos um dia de treino').optional(),
  days_of_week: z.array(z.string()).min(1, 'Informe pelo menos um dia de treino').optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horário de início inválido (HH:MM)').optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horário de início inválido (HH:MM)').optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horário de término inválido (HH:MM)').optional(),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horário de término inválido (HH:MM)').optional(),
  location: z.string().max(100).optional(),
  capacity: z.number().int().min(1, 'Capacidade deve ser de no mínimo 1 aluno').max(100).optional(),
  status: z.enum(['ATIVO', 'INATIVO']).optional()
});

export const enrollStudentSchema = z.object({
  studentId: z.string().uuid('ID do aluno inválido').optional(),
  student_id: z.string().uuid('ID do aluno inválido').optional()
}).refine(data => data.studentId || data.student_id, {
  message: 'ID do aluno obrigatório'
});

