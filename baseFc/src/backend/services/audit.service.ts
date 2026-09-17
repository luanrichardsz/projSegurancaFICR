import { supabaseAdmin } from '../config/supabase.ts';

export class AuditService {
  async listLogs(schoolId: string, limit = 50) {
    const { data: logs, error } = await supabaseAdmin
      .from('audit_logs')
      .select('*')
      .eq('school_id', schoolId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Erro ao listar logs de auditoria:', error);
      throw new Error('Falha ao listar logs de auditoria');
    }

    // Buscar os emails dos usuários correspondentes
    const userIds = [...new Set((logs || []).map((l: any) => l.user_id).filter(Boolean))];
    const userMap = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, email, role')
        .in('id', userIds);

      (users || []).forEach((u: any) => userMap.set(u.id, u));
    }

    return (logs || []).map((l: any) => {
      const user = userMap.get(l.user_id);
      return {
        id: l.id,
        userId: l.user_id,
        userEmail: user?.email || 'gestor@basefc.com',
        userRole: user?.role || 'GESTOR',
        action: l.action,
        resource: l.resource,
        details: l.details,
        timestamp: l.timestamp
      };
    });
  }
}

export const auditService = new AuditService();
