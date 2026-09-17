import { Request, Response, NextFunction } from 'express';
import { adminAuth, db } from '../config/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken & { role?: string; schoolId?: string; uid: string };
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
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Buscar perfil do usuário no Firestore (Role, School)
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    let customClaims = {};
    if (userDoc.exists) {
      customClaims = userDoc.data() || {};
    }

    req.user = { 
      ...decodedToken, 
      uid: decodedToken.uid,
      role: customClaims.role || 'RESPONSAVEL', 
      schoolId: customClaims.schoolId || null 
    };
    
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Não autorizado: Token inválido ou expirado.' });
  }
};
