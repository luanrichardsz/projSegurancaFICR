import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.ts';
import { studentService } from '../services/student.service.ts';
import { createStudentSchema, updateStudentSchema } from '../validators/student.validator.ts';
import { ZodError } from 'zod';

export class StudentController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const originHeader = req.get('origin') || (req.get('referer') ? new URL(req.get('referer')!).origin : undefined);
      const clientOrigin = (req.body && req.body.clientOrigin) || originHeader;

      const validatedData = createStudentSchema.parse(req.body);
      const newStudent = await studentService.createStudent(schoolId, validatedData, req.user!.uid, clientOrigin);
      
      return res.status(201).json(newStudent);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues || (error as any).errors });
      }
      next(error);
    }
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const { search, category, status } = req.query;
      const students = await studentService.getStudentsBySchool(schoolId, {
        search: search as string,
        category: category as string,
        status: status as string,
      });
      return res.json(students);
    } catch (error) {
      next(error);
    }
  }

  async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const student = await studentService.getStudentById(id);
      return res.json(student);
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const profile = await studentService.getStudentProfile(id);
      return res.json(profile);
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const validatedData = updateStudentSchema.parse(req.body);
      const updated = await studentService.updateStudent(id, schoolId, validatedData, req.user!.uid);
      return res.json(updated);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues || (error as any).errors });
      }
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const result = await studentService.deleteStudent(id, schoolId, req.user!.uid);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async reinviteGuardian(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const studentId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const guardianId = Array.isArray(req.params.guardianId) ? req.params.guardianId[0] : req.params.guardianId;

      const originHeader = req.get('origin') || (req.get('referer') ? new URL(req.get('referer')!).origin : undefined);
      const clientOrigin = (req.body && req.body.clientOrigin) || originHeader;

      const result = await studentService.reinviteGuardian(schoolId, studentId, guardianId, clientOrigin);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const studentController = new StudentController();
