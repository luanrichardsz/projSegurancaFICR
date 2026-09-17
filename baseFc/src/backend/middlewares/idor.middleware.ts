import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware.ts';
import { supabaseAdmin } from '../config/supabase.ts';

export const checkStudentAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const studentId = req.params.id;
  const user = req.user;

  if (!user || !studentId) {
    return res.status(403).json({ error: 'Acesso negado.' });
  }

  try {
    const { data: student, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error || !student) {
      return res.status(404).json({ error: 'Aluno não encontrado.' });
    }

    // Regra: Gestores só acessam alunos de sua própria escola
    if (user.role === 'GESTOR') {
      if (student.school_id !== user.schoolId) {
        return res.status(403).json({ error: 'Acesso negado: Aluno pertence a outra instituição.' });
      }
      return next();
    }

    // Regra: Professor só acessa se o aluno estiver em uma de suas turmas
    if (user.role === 'PROFESSOR') {
      if (student.school_id !== user.schoolId) {
        return res.status(403).json({ error: 'Acesso negado.' });
      }

      const { data: teacherClasses } = await supabaseAdmin
        .from('classes')
        .select('id, class_students!inner(student_id)')
        .eq('teacher_id', user.uid)
        .eq('class_students.student_id', studentId);

      if (!teacherClasses || teacherClasses.length === 0) {
        return res.status(403).json({ error: 'Acesso negado: Este aluno não pertence a nenhuma de suas turmas.' });
      }
      return next();
    }

    // Regra: Responsável só acessa seus próprios filhos
    if (user.role === 'RESPONSAVEL') {
      const { data: guardianLinks } = await supabaseAdmin
        .from('guardians')
        .select('id, guardian_students!inner(student_id)')
        .eq('user_id', user.uid)
        .eq('guardian_students.student_id', studentId);

      if (!guardianLinks || guardianLinks.length === 0) {
        return res.status(403).json({ error: 'Acesso negado: Você só pode acessar dados de alunos vinculados à sua conta.' });
      }
      return next();
    }

    return res.status(403).json({ error: 'Acesso negado.' });
  } catch (error) {
    next(error);
  }
};
