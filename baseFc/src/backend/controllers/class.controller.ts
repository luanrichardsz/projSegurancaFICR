import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.ts';
import { classService } from '../services/class.service.ts';
import { createClassSchema, enrollStudentSchema } from '../validators/class.validator.ts';
import { ZodError } from 'zod';

export class ClassController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const classes = await classService.listClasses(schoolId);
      return res.json(classes);
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const classData = await classService.getClassById(id);
      return res.json(classData);
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const validatedData = createClassSchema.parse(req.body);
      const newClass = await classService.createClass(schoolId, validatedData, req.user!.uid);
      return res.status(201).json(newClass);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues || (error as any).errors });
      }
      next(error);
    }
  }

  async enrollStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const classId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { studentId } = enrollStudentSchema.parse(req.body);

      const result = await classService.enrollStudent(classId, studentId, schoolId, req.user!.uid);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues || (error as any).errors });
      }
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  }

  async unenrollStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const classId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const studentId = Array.isArray(req.params.studentId) ? req.params.studentId[0] : req.params.studentId;

      const result = await classService.unenrollStudent(classId, studentId, schoolId, req.user!.uid);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const classController = new ClassController();
