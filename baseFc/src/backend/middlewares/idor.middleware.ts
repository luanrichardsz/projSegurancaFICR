import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware.ts';
import { db } from '../config/firebase-admin.ts';

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
    const studentDoc = await db.collection('students').doc(studentId).get();
    if (!studentDoc.exists) {
      return res.status(404).json({ error: 'Aluno não encontrado.' });
    }
    const studentData = studentDoc.data();

    // Regra: Gestores só acessam alunos de sua própria escola
    if (user.role === 'GESTOR') {
      if (studentData?.schoolId !== user.schoolId) {
        return res.status(403).json({ error: 'Acesso negado: Aluno pertence a outra instituição.' });
      }
      return next();
    }

    // Regra: Professor só acessa se o aluno estiver em uma de suas turmas
    if (user.role === 'PROFESSOR') {
      if (studentData?.schoolId !== user.schoolId) return res.status(403).json({ error: 'Acesso negado.' });
      
      const teacherClasses = await db.collection('classes')
        .where('teacherId', '==', user.uid)
        .where('studentIds', 'array-contains', studentId)
        .get();
        
      if (teacherClasses.empty) {
         return res.status(403).json({ error: 'Acesso negado: Este aluno não pertence a nenhuma de suas turmas.' });
      }
      return next();
    }

    // Regra: Responsável só acessa seus próprios filhos
    if (user.role === 'RESPONSAVEL') {
      const guardianDoc = await db.collection('guardians').where('userId', '==', user.uid).get();
      if (guardianDoc.empty) {
        return res.status(403).json({ error: 'Acesso negado: Vínculo de responsável não encontrado.' });
      }
      const guardianData = guardianDoc.docs[0].data();
      const linkedStudents = guardianData.studentIds || [];
      
      if (!linkedStudents.includes(studentId)) {
        return res.status(403).json({ error: 'Acesso negado: Você só pode acessar dados de alunos vinculados à sua conta.' });
      }
      return next();
    }

    return res.status(403).json({ error: 'Acesso negado.' });
  } catch (error) {
    next(error);
  }
};
