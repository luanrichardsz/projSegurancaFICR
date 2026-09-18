import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.ts';
import { dashboardService } from '../services/dashboard.service.ts';

export class DashboardController {
  async getMetrics(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (req.user?.role === 'RESPONSAVEL') {
        const guardianData = await dashboardService.getGuardianDashboard(req.user.uid);
        return res.json(guardianData);
      }

      const schoolId = req.user?.schoolId;
      if (!schoolId) return res.status(400).json({ error: 'Escola não identificada.' });

      const metrics = await dashboardService.getMetrics(schoolId);
      return res.json(metrics);
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
