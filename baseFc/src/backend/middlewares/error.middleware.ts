import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[Global Error]:', err.message || err);

  // Não expor stack trace
  res.status(500).json({
    error: 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.',
  });
};
