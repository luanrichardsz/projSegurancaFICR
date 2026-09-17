import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.ts';
import { attendanceService } from '../services/attendance.service.ts';
import { recordAttendanceSchema } from '../validators/attendance.validator.ts';
import { ZodError } from 'zod';

export class AttendanceController {
  async getClassAttendance(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const classId = Array.isArray(req.params.classId) ? req.params.classId[0] : req.params.classId;
      const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

      const result = await attendanceService.getClassAttendance(classId, date, req.user?.schoolId);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async record(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const validated = recordAttendanceSchema.parse(req.body);
      const result = await attendanceService.saveAttendance(
        validated.classId,
        validated.date,
        validated.attendees,
        req.user!.uid,
        schoolId
      );

      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.issues || (error as any).errors });
      }
      next(error);
    }
  }
}

export const attendanceController = new AttendanceController();
