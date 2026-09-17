import { z } from 'zod';

export const createClassSchema = z.object({
  name: z.string().min(2, 'Nome da turma obrigatório').max(100),
  category: z.string().min(2, 'Categoria obrigatória (ex: Sub-11, Sub-13)'),
  teacherId: z.string().uuid().optional().nullable(),
  daysOfWeek: z.array(z.string()).min(1, 'Informe pelo menos um dia de treino'),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horário de início inválido (HH:MM)'),
  endTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Horário de término inválido (HH:MM)'),
  location: z.string().optional().default('Campo Principal'),
  capacity: z.number().int().min(1, 'Capacidade deve ser de no mínimo 1 aluno').max(100).default(25),
  status: z.enum(['ATIVO', 'INATIVO']).default('ATIVO')
});

export const enrollStudentSchema = z.object({
  studentId: z.string().uuid('ID do aluno inválido')
});
