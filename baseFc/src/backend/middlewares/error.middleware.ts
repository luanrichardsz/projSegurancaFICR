import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('[Global Error]:', err.message || err);

  if (err.statusCode && err.statusCode < 500) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }

  // Erros 500: Não expor stack trace ao cliente (Segurança - Disponibilidade/Confidencialidade)
  res.status(500).json({
    error: 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.',
  });
};
