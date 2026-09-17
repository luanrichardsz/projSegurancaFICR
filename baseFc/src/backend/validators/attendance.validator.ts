import { z } from 'zod';

export const recordAttendanceSchema = z.object({
  classId: z.string().uuid('ID da turma inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  attendees: z.array(z.object({
    studentId: z.string().uuid('ID do aluno inválido'),
    status: z.enum(['PRESENTE', 'AUSENTE', 'JUSTIFICADO'])
  })).min(1, 'Informe a lista de frequência de pelo menos um atleta')
});
