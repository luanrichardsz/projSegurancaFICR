import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.ts';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
  uid: string;
  email?: string;
  role: string;
  schoolId: string | null;
  rawUser?: User;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado: Token não fornecido.' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Não autorizado: Token inválido ou expirado.' });
    }

    // Buscar perfil do usuário no banco (Role, School)
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role, school_id')
      .eq('id', user.id)
      .single();

    req.user = {
      uid: user.id,
      email: user.email,
      role: profile?.role || user.user_metadata?.role || 'RESPONSAVEL',
      schoolId: profile?.school_id || user.user_metadata?.schoolId || '00000000-0000-0000-0000-000000000001',
      rawUser: user,
    };

    next();
  } catch (error) {
    console.error('Erro ao verificar token do Supabase:', error);
    return res.status(401).json({ error: 'Não autorizado: Falha na validação do token.' });
  }
};
