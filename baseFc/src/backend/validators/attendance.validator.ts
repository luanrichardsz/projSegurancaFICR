import { z } from 'zod';

const normalizeStatus = (val: any) => {
  if (typeof val !== 'string') return val;
  const upper = val.toUpperCase().trim();
  if (upper === 'FALTA' || upper === 'AUSENTE') return 'AUSENTE';
  if (upper === 'FALTA_JUSTIFICADA' || upper === 'JUSTIFICADO' || upper === 'JUSTIFICADA') return 'JUSTIFICADO';
  if (upper === 'PRESENTE') return 'PRESENTE';
  return upper;
};

const attendeeSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== 'object') return val;
  return {
    studentId: val.studentId || val.student_id,
    status: normalizeStatus(val.status)
  };
}, z.object({
  studentId: z.string().uuid('ID do aluno inválido'),
  status: z.enum(['PRESENTE', 'AUSENTE', 'JUSTIFICADO'])
}));

export const recordAttendanceSchema = z.preprocess((val: any) => {
  if (!val || typeof val !== 'object') return val;
  return {
    classId: val.classId || val.class_id,
    date: val.date || val.session_date || val.sessionDate,
    attendees: val.attendees || val.records || []
  };
}, z.object({
  classId: z.string().uuid('ID da turma inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (YYYY-MM-DD)'),
  attendees: z.array(attendeeSchema).min(1, 'Informe a lista de frequência de pelo menos um atleta')
}));
