import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.ts';
import { teacherService } from '../services/teacher.service.ts';
import { createTeacherSchema } from '../validators/teacher.validator.ts';
import { ZodError } from 'zod';

export class TeacherController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const teachers = await teacherService.listTeachers(schoolId);
      return res.json(teachers);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const validatedData = createTeacherSchema.parse(req.body);
      const newTeacher = await teacherService.createTeacher(schoolId, validatedData, req.user!.uid);
      return res.status(201).json(newTeacher);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues || (error as any).errors });
      }
      next(error);
    }
  }
}

export const teacherController = new TeacherController();
