import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.ts';
import { studentService } from '../services/student.service.ts';
import { createStudentSchema } from '../validators/student.validator.ts';
import { ZodError } from 'zod';

export class StudentController {
  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      // Validar input com Zod
      const validatedData = createStudentSchema.parse(req.body);

      const newStudent = await studentService.createStudent(schoolId, validatedData, req.user!.uid);
      
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

      const students = await studentService.getStudentsBySchool(schoolId);
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
}

export const studentController = new StudentController();
