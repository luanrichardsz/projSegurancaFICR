import { supabaseAdmin } from '../config/supabase.ts';

export class StudentService {
  async createStudent(schoolId: string, studentData: any, createdBy: string, clientOrigin?: string) {
    // 0. Prevenção de Duplicidade Concorrente (Anti-duplo clique / Idempotência)
    const recentWindow = new Date(Date.now() - 15000).toISOString();
    const { data: recentDuplicate } = await supabaseAdmin
      .from('students')
      .select('id, name, created_at')
      .eq('school_id', schoolId)
      .ilike('name', studentData.name.trim())
      .eq('dob', studentData.dob)
      .gte('created_at', recentWindow)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (recentDuplicate) {
      console.warn(`[StudentService] Requisição duplicada bloqueada para "${studentData.name}". Retornando registro existente.`);
      return recentDuplicate;
    }

    // 1. Inserir Aluno
    const cleanStudentCpf = (studentData.cpf && studentData.cpf.trim()) ? studentData.cpf.replace(/\D/g, '') : '00000000000';
    const studentRecord = {
      school_id: schoolId,
      name: studentData.name.trim(),
      cpf: cleanStudentCpf,
      dob: studentData.dob,
      phone: studentData.phone ? studentData.phone.replace(/\D/g, '') : null,
      address: studentData.address ? studentData.address.trim() : null,
      allergies: studentData.allergies ? studentData.allergies.trim() : null,
      medical_restrictions: studentData.medicalRestrictions ? studentData.medicalRestrictions.trim() : null,
      medications: studentData.medications ? studentData.medications.trim() : null,
      category: studentData.category,
      position: studentData.position,
      dominant_foot: studentData.dominantFoot,
      shirt_number: studentData.shirtNumber,
      status: studentData.status || 'ATIVO',
      enrolled_at: new Date().toISOString()
    };

    const { data: newStudent, error } = await supabaseAdmin
      .from('students')
      .insert([studentRecord])
      .select()
      .single();

    if (error || !newStudent) {
      console.error('Erro ao cadastrar aluno no Supabase:', error);
      throw new Error(`Falha ao cadastrar aluno: ${error?.message}`);
    }

    // 2. Inserir Responsável (se fornecido)
    let guardianUserId: string | null = null;
    let inviteStatus: 'SENT' | 'EXISTS' | 'FAILED' | 'NONE' = 'NONE';
    const rawGuardianEmail = studentData.guardian?.email;
    const cleanGuardianEmail = rawGuardianEmail && typeof rawGuardianEmail === 'string' && rawGuardianEmail.trim()
      ? rawGuardianEmail.trim().toLowerCase()
      : null;

    if (studentData.guardian && studentData.guardian.name) {
      // 2.1 Se informou e-mail, verificar usuário existente ou enviar convite Supabase Auth
      if (cleanGuardianEmail) {
        try {
          const { data: existingUser } = await supabaseAdmin
            .from('users')
            .select('id, email, school_id')
            .eq('email', cleanGuardianEmail)
            .single();

          if (existingUser) {
            guardianUserId = existingUser.id;
            inviteStatus = 'EXISTS';
          } else {
            // Convidar novo usuário via Supabase Auth Admin
            // Determinar a URL do frontend para envio de convites e definição de senha
            const rawAppUrl = 
              process.env.APP_URL || 
              clientOrigin || 
              studentData.clientOrigin ||
              process.env.FRONTEND_URL || 
              process.env.VITE_APP_URL || 
              (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
              process.env.RENDER_EXTERNAL_URL ||
              (process.env.NODE_ENV === 'production' ? 'https://basefc.onrender.com' : 'http://localhost:5173');

            const appUrl = rawAppUrl.replace(/\/+$/, '');
            const { data: inviteData, error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(
              cleanGuardianEmail,
              {
                data: {
                  role: 'RESPONSAVEL',
                  schoolId: schoolId,
                  name: studentData.guardian.name.trim()
                },
                redirectTo: `${appUrl}/definir-senha`
              }
            );

            if (inviteErr) {
              console.warn('[Guardian Invite] Aviso ao enviar convite:', inviteErr.message);
              // Caso o usuário já exista no auth.users mas ainda não na tabela users:
              const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
              const matchedAuthUser = (authList?.users || []).find((u: any) => u.email?.toLowerCase() === cleanGuardianEmail);
              if (matchedAuthUser) {
                guardianUserId = matchedAuthUser.id;
                inviteStatus = 'EXISTS';
                // Garantir existência em public.users antes da FK em public.guardians
                await supabaseAdmin
                  .from('users')
                  .upsert({
                    id: matchedAuthUser.id,
                    email: cleanGuardianEmail,
                    role: 'RESPONSAVEL',
                    school_id: schoolId,
                    status: 'ATIVO'
                  }, { onConflict: 'id' });

                // Disparar redefinição com a URL correta caso já estivesse cadastrado
                try {
                  await supabaseAdmin.auth.resetPasswordForEmail(cleanGuardianEmail, {
                    redirectTo: `${appUrl}/definir-senha`
                  });
                } catch (rErr) {
                  console.warn('[Guardian Invite] Aviso ao enviar redefinição para usuário existente:', rErr);
                }
              } else {
                inviteStatus = 'FAILED';
              }
            } else if (inviteData?.user) {
              guardianUserId = inviteData.user.id;
              inviteStatus = 'SENT';
              await supabaseAdmin
                .from('users')
                .upsert({
                  id: inviteData.user.id,
                  email: cleanGuardianEmail,
                  role: 'RESPONSAVEL',
                  school_id: schoolId,
                  status: 'ATIVO'
                }, { onConflict: 'id' });
            }
          }
        } catch (authErr) {
          console.error('[Guardian Invite] Erro inesperado ao processar convite:', authErr);
          inviteStatus = 'FAILED';
        }
      }

      const cleanGuardianCpf = studentData.guardian.cpf ? studentData.guardian.cpf.replace(/\D/g, '') : null;
      const cleanGuardianPhone = studentData.guardian.phone ? studentData.guardian.phone.replace(/\D/g, '') : '';
      
      // Reutilizar responsável existente caso já cadastrado com o mesmo user_id ou telefone
      let guardianIdToLink: string | null = null;
      if (guardianUserId) {
        const { data: existingG } = await supabaseAdmin
          .from('guardians')
          .select('id')
          .eq('user_id', guardianUserId)
          .maybeSingle();

        if (existingG?.id) {
          guardianIdToLink = existingG.id;
          await supabaseAdmin
            .from('guardians')
            .update({
              name: studentData.guardian.name.trim(),
              phone: cleanGuardianPhone || undefined,
              cpf: cleanGuardianCpf || undefined
            })
            .eq('id', existingG.id);
        }
      }

      if (!guardianIdToLink) {
        const { data: newGuardian, error: insErr } = await supabaseAdmin
          .from('guardians')
          .insert([{
            school_id: schoolId,
            user_id: guardianUserId,
            name: studentData.guardian.name.trim(),
            cpf: cleanGuardianCpf || null,
            phone: cleanGuardianPhone,
          }])
          .select()
          .single();

        if (newGuardian) {
          guardianIdToLink = newGuardian.id;
        } else if (insErr && guardianUserId) {
          // Fallback defensivo: insere sem user_id caso haja restrição
          console.warn('[Guardian Insert] Tentando fallback:', insErr.message);
          const { data: fbG } = await supabaseAdmin
            .from('guardians')
            .insert([{
              school_id: schoolId,
              name: studentData.guardian.name.trim(),
              cpf: cleanGuardianCpf || null,
              phone: cleanGuardianPhone,
            }])
            .select()
            .single();
          if (fbG) guardianIdToLink = fbG.id;
        }
      }

      if (guardianIdToLink) {
        await supabaseAdmin.from('guardian_students').insert([{
          guardian_id: guardianIdToLink,
          student_id: newStudent.id
        }]);
      }
    }

    // 3. Inserir Contato de Emergência (se fornecido)
    if (studentData.emergencyContact && studentData.emergencyContact.name) {
      const cleanEmergPhone = studentData.emergencyContact.phone ? studentData.emergencyContact.phone.replace(/\D/g, '') : '';
      await supabaseAdmin.from('emergency_contacts').insert([{
        student_id: newStudent.id,
        name: studentData.emergencyContact.name.trim(),
        relationship: studentData.emergencyContact.relationship || 'Responsável',
        phone: cleanEmergPhone,
        is_main: true,
        authorized_pickup: studentData.emergencyContact.authorizedPickup ?? true,
        notes: studentData.emergencyContact.notes ? studentData.emergencyContact.notes.trim() : null
      }]);
    }

    // 4. Matricular em Turma (se fornecido)
    if (studentData.classId) {
      // Verificar capacidade máxima da turma
      const { data: targetClass } = await supabaseAdmin
        .from('classes')
        .select('capacity')
        .eq('id', studentData.classId)
        .single();

      const { count } = await supabaseAdmin
        .from('class_students')
        .select('*', { count: 'exact', head: true })
        .eq('class_id', studentData.classId);

      if (targetClass && count !== null && count >= targetClass.capacity) {
        throw new Error(`Turma cheia: limite de ${targetClass.capacity} atletas atingido.`);
      }

      await supabaseAdmin.from('class_students').insert([{
        class_id: studentData.classId,
        student_id: newStudent.id
      }]);
    }

    // 5. Registrar na Trilha de Auditoria (Integridade - CID)
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: createdBy,
      action: 'CADASTRAR_ALUNO',
      resource: `Aluno: ${newStudent.name}`,
      details: { 
        studentId: newStudent.id, 
        name: newStudent.name, 
        category: newStudent.category,
        shirtNumber: newStudent.shirt_number,
        guardianEmail: cleanGuardianEmail,
        guardianUserId,
        guardianInviteStatus: inviteStatus
      }
    }]);

    return {
      ...newStudent,
      schoolId: newStudent.school_id,
      dominantFoot: newStudent.dominant_foot,
      shirtNumber: newStudent.shirt_number,
      enrolledAt: newStudent.enrolled_at,
      guardianInvite: {
        email: cleanGuardianEmail,
        status: inviteStatus,
        userId: guardianUserId
      }
    };
  }

  async getStudentsBySchool(schoolId: string, filters?: { search?: string; category?: string; status?: string }) {
    let query = supabaseAdmin
      .from('students')
      .select(`
        *,
        class_students (
          class_id,
          classes (
            id,
            name,
            category
          )
        )
      `)
      .eq('school_id', schoolId)
      .order('name', { ascending: true });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar alunos no Supabase:', error);
      throw new Error('Falha ao listar alunos');
    }

    return (data || []).map(s => {
      const enrolledClasses = (s.class_students || []).map((cs: any) => cs.classes).filter(Boolean);
      return {
        ...s,
        schoolId: s.school_id,
        dominantFoot: s.dominant_foot,
        shirtNumber: s.shirt_number,
        enrolledAt: s.enrolled_at,
        classes: enrolledClasses,
        className: enrolledClasses.length > 0 ? enrolledClasses[0].name : 'Sem Turma'
      };
    });
  }

  async getStudentById(studentId: string) {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (error || !data) {
      throw new Error('Aluno não encontrado');
    }

    return {
      ...data,
      schoolId: data.school_id,
      dominantFoot: data.dominant_foot,
      shirtNumber: data.shirt_number,
      enrolledAt: data.enrolled_at
    };
  }

  async getStudentProfile(studentId: string) {
    // 1. Dados básicos
    const student = await this.getStudentById(studentId);

    // 2. Responsáveis
    const { data: guardianLinks } = await supabaseAdmin
      .from('guardian_students')
      .select(`
        guardians (
          *,
          users (
            id,
            email,
            role,
            status
          )
        )
      `)
      .eq('student_id', studentId);

    const guardians = (guardianLinks || []).map((gl: any) => {
      const g = gl.guardians;
      if (!g) return null;
      return {
        ...g,
        email: g.users?.email || null,
        hasPortalAccess: !!g.user_id,
        userStatus: g.users?.status || null
      };
    }).filter(Boolean);

    // 3. Contatos de Emergência
    const { data: emergencyContacts } = await supabaseAdmin
      .from('emergency_contacts')
      .select('*')
      .eq('student_id', studentId);

    // 4. Turmas
    const { data: classLinks } = await supabaseAdmin
      .from('class_students')
      .select('classes (*)')
      .eq('student_id', studentId);

    const classes = (classLinks || []).map((cl: any) => cl.classes).filter(Boolean);

    // 5. Mensalidades
    const { data: payments } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('student_id', studentId)
      .order('due_date', { ascending: false });

    // 6. Frequência
    const { data: attendanceRecords } = await supabaseAdmin
      .from('attendance')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false });

    const totalTrainings = attendanceRecords?.length || 0;
    const presences = attendanceRecords?.filter(a => a.status === 'PRESENTE').length || 0;
    const absences = attendanceRecords?.filter(a => a.status === 'AUSENTE').length || 0;
    const justified = attendanceRecords?.filter(a => a.status === 'JUSTIFICADO').length || 0;
    const attendanceRate = totalTrainings > 0 ? Math.round((presences / totalTrainings) * 100) : 100;

    return {
      student,
      guardians,
      emergencyContacts: emergencyContacts || [],
      classes,
      payments: payments || [],
      attendance: {
        totalTrainings,
        presences,
        absences,
        justified,
        attendanceRate,
        history: attendanceRecords || []
      }
    };
  }

  async updateStudent(studentId: string, schoolId: string, updateData: any, userId: string) {
    const dataToUpdate: any = {};
    if (updateData.name) dataToUpdate.name = updateData.name.trim();
    if (updateData.cpf !== undefined) dataToUpdate.cpf = updateData.cpf ? updateData.cpf.replace(/\D/g, '') : null;
    if (updateData.dob) dataToUpdate.dob = updateData.dob;
    if (updateData.phone !== undefined) dataToUpdate.phone = updateData.phone ? updateData.phone.replace(/\D/g, '') : null;
    if (updateData.address !== undefined) dataToUpdate.address = updateData.address ? updateData.address.trim() : null;
    if (updateData.allergies !== undefined) dataToUpdate.allergies = updateData.allergies ? updateData.allergies.trim() : null;

    const medRestrictions = updateData.medicalRestrictions !== undefined ? updateData.medicalRestrictions : updateData.medical_restrictions;
    if (medRestrictions !== undefined) dataToUpdate.medical_restrictions = medRestrictions ? medRestrictions.trim() : null;

    if (updateData.medications !== undefined) dataToUpdate.medications = updateData.medications ? updateData.medications.trim() : null;
    if (updateData.category) dataToUpdate.category = updateData.category;
    if (updateData.position) dataToUpdate.position = updateData.position;

    const domFoot = updateData.dominantFoot || updateData.dominant_foot;
    if (domFoot) dataToUpdate.dominant_foot = domFoot;

    const sNumber = updateData.shirtNumber !== undefined ? updateData.shirtNumber : updateData.shirt_number;
    if (sNumber !== undefined) dataToUpdate.shirt_number = Number(sNumber);

    if (updateData.status) dataToUpdate.status = updateData.status;

    let updated = null;
    if (Object.keys(dataToUpdate).length > 0) {
      const { data, error } = await supabaseAdmin
        .from('students')
        .update(dataToUpdate)
        .eq('id', studentId)
        .eq('school_id', schoolId)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar aluno:', error);
        throw new Error(`Falha ao atualizar aluno: ${error.message}`);
      }
      updated = data;
    } else {
      const { data } = await supabaseAdmin
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      updated = data;
    }

    // Atualizar Responsável se fornecido
    if (updateData.guardian && updateData.guardian.name) {
      const cleanGuardianCpf = updateData.guardian.cpf ? updateData.guardian.cpf.replace(/\D/g, '') : null;
      const cleanGuardianPhone = updateData.guardian.phone ? updateData.guardian.phone.replace(/\D/g, '') : '';
      const rawGuardianEmail = updateData.guardian.email;
      const cleanGuardianEmail = rawGuardianEmail && typeof rawGuardianEmail === 'string' && rawGuardianEmail.trim()
        ? rawGuardianEmail.trim().toLowerCase()
        : null;

      const { data: existingLink } = await supabaseAdmin
        .from('guardian_students')
        .select('guardian_id, guardians (id, user_id)')
        .eq('student_id', studentId)
        .maybeSingle();

      let targetGuardianId = existingLink?.guardian_id;

      // Se informou e-mail na edição e precisa vincular ou convidar usuário
      if (cleanGuardianEmail) {
        let guardianUserId: string | null = null;
        const { data: exUser } = await supabaseAdmin.from('users').select('id').eq('email', cleanGuardianEmail).maybeSingle();
        if (exUser) {
          guardianUserId = exUser.id;
        } else {
          const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
          const matched = (authList?.users || []).find((u: any) => u.email?.toLowerCase() === cleanGuardianEmail);
          if (matched) {
            guardianUserId = matched.id;
            await supabaseAdmin.from('users').upsert({
              id: matched.id,
              email: cleanGuardianEmail,
              role: 'RESPONSAVEL',
              school_id: schoolId,
              status: 'ATIVO'
            }, { onConflict: 'id' });
          } else {
            const rawAppUrl = process.env.APP_URL || process.env.FRONTEND_URL || (process.env.NODE_ENV === 'production' ? 'https://https-basefc-onrender-com.onrender.com' : 'http://localhost:5173');
            const appUrl = rawAppUrl.replace(/\/+$/, '');
            const { data: inv } = await supabaseAdmin.auth.admin.inviteUserByEmail(cleanGuardianEmail, {
              data: { role: 'RESPONSAVEL', schoolId, name: updateData.guardian.name.trim() },
              redirectTo: `${appUrl}/definir-senha`
            });
            if (inv?.user) {
              guardianUserId = inv.user.id;
              await supabaseAdmin.from('users').upsert({
                id: inv.user.id,
                email: cleanGuardianEmail,
                role: 'RESPONSAVEL',
                school_id: schoolId,
                status: 'ATIVO'
              }, { onConflict: 'id' });
            }
          }
        }

        if (targetGuardianId && guardianUserId) {
          await supabaseAdmin.from('guardians').update({ user_id: guardianUserId }).eq('id', targetGuardianId);
        }
      }

      if (targetGuardianId) {
        await supabaseAdmin
          .from('guardians')
          .update({
            name: updateData.guardian.name.trim(),
            cpf: cleanGuardianCpf || null,
            phone: cleanGuardianPhone
          })
          .eq('id', targetGuardianId);
      } else {
        const { data: newGuardian } = await supabaseAdmin
          .from('guardians')
          .insert([{
            school_id: schoolId,
            name: updateData.guardian.name.trim(),
            cpf: cleanGuardianCpf || null,
            phone: cleanGuardianPhone
          }])
          .select()
          .single();

        if (newGuardian) {
          await supabaseAdmin.from('guardian_students').insert([{
            guardian_id: newGuardian.id,
            student_id: studentId
          }]);
        }
      }
    }

    // Atualizar Contato de Emergência se fornecido
    if (updateData.emergencyContact && updateData.emergencyContact.name) {
      const cleanEmergPhone = updateData.emergencyContact.phone ? updateData.emergencyContact.phone.replace(/\D/g, '') : '';
      const { data: existingEmerg } = await supabaseAdmin
        .from('emergency_contacts')
        .select('id')
        .eq('student_id', studentId)
        .maybeSingle();

      if (existingEmerg?.id) {
        await supabaseAdmin
          .from('emergency_contacts')
          .update({
            name: updateData.emergencyContact.name.trim(),
            relationship: updateData.emergencyContact.relationship || 'Responsável',
            phone: cleanEmergPhone,
            authorized_pickup: updateData.emergencyContact.authorizedPickup ?? true,
            notes: updateData.emergencyContact.notes ? updateData.emergencyContact.notes.trim() : null
          })
          .eq('id', existingEmerg.id);
      } else {
        await supabaseAdmin.from('emergency_contacts').insert([{
          student_id: studentId,
          name: updateData.emergencyContact.name.trim(),
          relationship: updateData.emergencyContact.relationship || 'Responsável',
          phone: cleanEmergPhone,
          is_main: true,
          authorized_pickup: updateData.emergencyContact.authorizedPickup ?? true,
          notes: updateData.emergencyContact.notes ? updateData.emergencyContact.notes.trim() : null
        }]);
      }
    }

    // Auditoria
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: userId,
      action: 'ATUALIZAR_ALUNO',
      resource: `Aluno: ${updated?.name || studentId}`,
      details: { studentId, changes: dataToUpdate }
    }]);

    return updated;
  }

  async deleteStudent(studentId: string, schoolId: string, userId: string) {
    // Para segurança e integridade, inativamos o aluno
    const { data: inativado, error } = await supabaseAdmin
      .from('students')
      .update({ status: 'INATIVO' })
      .eq('id', studentId)
      .eq('school_id', schoolId)
      .select()
      .single();

    if (error) {
      throw new Error('Falha ao inativar aluno');
    }

    // Auditoria
    await supabaseAdmin.from('audit_logs').insert([{
      school_id: schoolId,
      user_id: userId,
      action: 'INATIVAR_ALUNO',
      resource: `Aluno: ${inativado.name}`,
      details: { studentId }
    }]);

    return { message: 'Aluno inativado com sucesso.' };
  }

  async reinviteGuardian(schoolId: string, studentId: string, guardianId?: string, clientOrigin?: string) {
    // 1. Obter o responsável através da tabela de vínculo guardian_students
    let linkQuery = supabaseAdmin
      .from('guardian_students')
      .select(`
        guardian_id,
        guardians (
          id,
          name,
          phone,
          user_id,
          users (
            id,
            email
          )
        )
      `)
      .eq('student_id', studentId);

    if (guardianId) {
      linkQuery = linkQuery.eq('guardian_id', guardianId);
    }

    const { data: links, error: lErr } = await linkQuery;
    if (lErr || !links || links.length === 0) {
      throw new Error('Responsável não encontrado para este atleta.');
    }

    const guardian: any = links[0].guardians;
    let guardianEmail = guardian?.users?.email;

    // Se o responsável ainda não tiver e-mail associado no user, tentar vincular por nome na base auth
    if (!guardianEmail && guardian?.name) {
      const { data: authList } = await supabaseAdmin.auth.admin.listUsers();
      const matched = (authList?.users || []).find((u: any) =>
        u.user_metadata?.name?.toLowerCase() === guardian.name.toLowerCase()
      );
      if (matched?.email) {
        guardianEmail = matched.email;
        await supabaseAdmin.from('users').upsert({
          id: matched.id,
          email: matched.email,
          role: 'RESPONSAVEL',
          school_id: schoolId,
          status: 'ATIVO'
        }, { onConflict: 'id' });
        await supabaseAdmin.from('guardians').update({ user_id: matched.id }).eq('id', guardian.id);
      }
    }

    if (!guardianEmail) {
      throw new Error('Este responsável não possui e-mail cadastrado para acesso ao portal. Edite o atleta para informar o e-mail.');
    }

    const rawAppUrl = 
      process.env.APP_URL || 
      clientOrigin || 
      process.env.FRONTEND_URL || 
      process.env.VITE_APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ||
      process.env.RENDER_EXTERNAL_URL ||
      (process.env.NODE_ENV === 'production' ? 'https://basefc.onrender.com' : 'http://localhost:5173');

    const appUrl = rawAppUrl.replace(/\/+$/, '');
    const redirectTo = `${appUrl}/definir-senha`;

    // Disparar e-mail de redefinição/definição de senha com a URL correta
    const { error: resetErr } = await supabaseAdmin.auth.resetPasswordForEmail(guardianEmail, {
      redirectTo
    });

    if (resetErr) {
      throw new Error(`Falha ao enviar convite: ${resetErr.message}`);
    }

    let directLink: string | null = null;
    try {
      const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: guardianEmail,
        options: { redirectTo }
      });
      if (linkData?.properties?.action_link) {
        directLink = linkData.properties.action_link;
      }
    } catch (ignore) {}

    return {
      success: true,
      email: guardianEmail,
      redirectTo,
      directLink,
      message: `Link seguro de acesso enviado com sucesso para ${guardianEmail}`
    };
  }
}

export const studentService = new StudentService();
