import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.ts';
import { auditService } from '../services/audit.service.ts';

export class AuditController {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const schoolId = req.user?.schoolId || '00000000-0000-0000-0000-000000000001';
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const logs = await auditService.listLogs(schoolId, limit);
      return res.json(logs);
    } catch (error) {
      next(error);
    }
  }
}

export const auditController = new AuditController();
