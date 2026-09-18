import { supabaseAdmin } from '../config/supabase.ts';

export class AuditService {
  async listLogs(schoolId: string, limit = 100) {
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (schoolId) {
      query = query.or(`school_id.eq.${schoolId},school_id.is.null`);
    }

    const { data: logs, error } = await query;

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

      // Fallback para auth.users se algum usuário não estiver na tabela users
      const missingIds = userIds.filter(id => !userMap.has(id));
      if (missingIds.length > 0) {
        try {
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
          (authUsers?.users || []).forEach((au: any) => {
            if (missingIds.includes(au.id) && !userMap.has(au.id)) {
              userMap.set(au.id, {
                id: au.id,
                email: au.email,
                role: au.user_metadata?.role || 'GESTOR'
              });
            }
          });
        } catch (authErr) {
          console.warn('[AuditService] Não foi possível consultar auth.admin:', authErr);
        }
      }
    }

    return (logs || []).map((l: any) => {
      const user = userMap.get(l.user_id);
      const email = user?.email || 'gestor@basefc.com';
      const role = user?.role || 'GESTOR';
      const timeVal = l.timestamp || l.created_at || new Date().toISOString();

      return {
        id: l.id,
        school_id: l.school_id,
        user_id: l.user_id,
        userId: l.user_id,
        userEmail: email,
        userRole: role,
        user: {
          email,
          role
        },
        action: l.action,
        resource: l.resource,
        details: l.details,
        timestamp: timeVal,
        created_at: timeVal
      };
    });
  }
}

export const auditService = new AuditService();
