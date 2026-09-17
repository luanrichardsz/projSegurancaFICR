import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.ts';
import { teacherService } from '../services/teacher.service.ts';
import { createTeacherSchema, updateTeacherSchema } from '../validators/teacher.validator.ts';
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
        const msg = error.issues && error.issues.length > 0 ? error.issues[0].message : 'Dados inválidos';
        return res.status(400).json({ error: msg, details: error.issues });
      }
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const teacherId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validatedData = updateTeacherSchema.parse(req.body);
      const updatedTeacher = await teacherService.updateTeacher(teacherId, schoolId, validatedData, req.user!.uid);
      return res.json(updatedTeacher);
    } catch (error) {
      if (error instanceof ZodError) {
        const msg = error.issues && error.issues.length > 0 ? error.issues[0].message : 'Dados inválidos';
        return res.status(400).json({ error: msg, details: error.issues });
      }
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const teacherId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await teacherService.deleteTeacher(teacherId, schoolId, req.user!.uid);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const teacherController = new TeacherController();
