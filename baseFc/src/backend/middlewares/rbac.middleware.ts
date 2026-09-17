import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware.ts';

export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({ error: 'Acesso negado: Perfil não identificado.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado: Você não possui permissão para realizar esta ação.' });
    }

    next();
  };
};
