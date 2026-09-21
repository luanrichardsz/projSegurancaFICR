import {
  MockStudent, MockTeacher, MockClass, MockPayment, MockAttendance, MockAuditLog,
  INITIAL_STUDENTS, INITIAL_TEACHERS, INITIAL_CLASSES, INITIAL_PAYMENTS, INITIAL_ATTENDANCE, INITIAL_AUDIT_LOGS
} from './mockData.ts';

const DEMO_STORAGE_KEY = 'basefc_demo_session';
const DEMO_DATA_KEY = 'basefc_demo_data_v2';

interface DemoDataStore {
  students: MockStudent[];
  teachers: MockTeacher[];
  classes: MockClass[];
  payments: MockPayment[];
  attendance: MockAttendance[];
  auditLogs: MockAuditLog[];
}

// Fallback em memória se sessionStorage falhar
let memoryStore: DemoDataStore | null = null;

function getInitialStore(): DemoDataStore {
  return {
    students: JSON.parse(JSON.stringify(INITIAL_STUDENTS)),
    teachers: JSON.parse(JSON.stringify(INITIAL_TEACHERS)),
    classes: JSON.parse(JSON.stringify(INITIAL_CLASSES)),
    payments: JSON.parse(JSON.stringify(INITIAL_PAYMENTS)),
    attendance: JSON.parse(JSON.stringify(INITIAL_ATTENDANCE)),
    auditLogs: JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS))
  };
}

export function isDemoSession(): boolean {
  try {
    const session = sessionStorage.getItem(DEMO_STORAGE_KEY) || localStorage.getItem(DEMO_STORAGE_KEY);
    return !!session;
  } catch {
    return !!memoryStore;
  }
}

export function getDemoSession(): { active: boolean; role: 'GESTOR' | 'PROFESSOR' | 'RESPONSAVEL'; email: string; name: string } | null {
  try {
    const raw = sessionStorage.getItem(DEMO_STORAGE_KEY) || localStorage.getItem(DEMO_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setDemoSession(role: 'GESTOR' | 'PROFESSOR' | 'RESPONSAVEL' = 'GESTOR'): void {
  const profileMap = {
    GESTOR: {
      role: 'GESTOR' as const,
      email: 'carlos.diretor@basefc.com',
      name: 'Prof. Carlos Eduardo (Coordenador Geral)'
    },
    PROFESSOR: {
      role: 'PROFESSOR' as const,
      email: 'roberto.tecnico@basefc.com',
      name: 'Técnico Roberto Costa (Comissão Técnica)'
    },
    RESPONSAVEL: {
      role: 'RESPONSAVEL' as const,
      email: 'ana.souza@email.com',
      name: 'Ana Paula Souza (Responsável)'
    }
  };

  const info = {
    active: true,
    ...profileMap[role]
  };

  try {
    sessionStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(info));
    if (!sessionStorage.getItem(DEMO_DATA_KEY)) {
      sessionStorage.setItem(DEMO_DATA_KEY, JSON.stringify(getInitialStore()));
    }
  } catch (err) {
    console.warn('Falha no sessionStorage:', err);
  }

  if (!memoryStore) {
    memoryStore = getInitialStore();
  }
}

export function clearDemoSession(): void {
  try {
    sessionStorage.removeItem(DEMO_STORAGE_KEY);
    localStorage.removeItem(DEMO_STORAGE_KEY);
  } catch (err) {
    console.warn('Erro ao limpar sessão demo:', err);
  }
}

export function resetDemoData(): void {
  const fresh = getInitialStore();
  try {
    sessionStorage.setItem(DEMO_DATA_KEY, JSON.stringify(fresh));
  } catch {
    memoryStore = fresh;
  }
}

function loadDataStore(): DemoDataStore {
  try {
    const raw = sessionStorage.getItem(DEMO_DATA_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  if (!memoryStore) {
    memoryStore = getInitialStore();
  }
  return memoryStore;
}

function saveDataStore(store: DemoDataStore): void {
  try {
    sessionStorage.setItem(DEMO_DATA_KEY, JSON.stringify(store));
  } catch {}
  memoryStore = store;
}

// Simula pequena latência para naturalidade
const delay = (ms = 60) => new Promise(resolve => setTimeout(resolve, ms));

export async function handleMockRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  await delay(70);

  const method = (options.method || 'GET').toUpperCase();
  const url = new URL(`http://localhost${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);
  const pathname = url.pathname.replace(/^\/api/, '');
  const searchParams = url.searchParams;
  const store = loadDataStore();
  const demoSession = getDemoSession();
  const currentRole = demoSession?.role || 'GESTOR';

  // ==========================================
  // 1. DASHBOARD
  // ==========================================
  if (pathname === '/dashboard') {
    if (currentRole === 'RESPONSAVEL') {
      // Portal do responsável: Retorna o responsável e os atletas vinculados
      const student1 = store.students.find(s => s.id === 'demo-std-1') || store.students[0];
      const enrolledClasses = store.classes
        .filter(c => c.studentIds.includes(student1.id))
        .map(c => ({
          id: c.id,
          name: c.name,
          category: c.category,
          daysOfWeek: c.days_of_week,
          startTime: c.start_time,
          endTime: c.end_time,
          location: c.location,
          teacherName: c.teachers?.name || 'Treinador da Base'
        }));

      const studentAtt = store.attendance.filter(a => a.student_id === student1.id);
      const totalTrainings = studentAtt.length;
      const presences = studentAtt.filter(a => a.status === 'PRESENTE').length;
      const absences = studentAtt.filter(a => a.status === 'AUSENTE').length;
      const justified = studentAtt.filter(a => a.status === 'JUSTIFICADO').length;
      const attendanceRate = totalTrainings > 0 ? Math.round((presences / totalTrainings) * 100) : 100;

      const studentPayments = store.payments.filter(p => p.student_id === student1.id);
      const today = new Date().toISOString().slice(0, 10);
      const hasOverdue = studentPayments.some(p => p.status === 'ATRASADO' || (p.status === 'PENDENTE' && p.due_date < today));
      const hasPending = studentPayments.some(p => p.status === 'PENDENTE' && p.due_date >= today);

      let financialStatus = 'EM_DIA';
      if (hasOverdue) financialStatus = 'ATRASADO';
      else if (hasPending) financialStatus = 'PENDENTE';

      return {
        guardian: {
          id: 'demo-grd-1',
          name: 'Ana Paula Souza',
          phone: '(81) 98877-6655',
          school_id: 'demo-school-001'
        },
        students: [
          {
            ...student1,
            dominantFoot: student1.dominant_foot,
            shirtNumber: student1.shirt_number,
            relationship: 'Mãe (Responsável Legal)',
            classes: enrolledClasses,
            attendance: {
              totalTrainings,
              presences,
              absences,
              justified,
              attendanceRate,
              history: studentAtt
            },
            payments: studentPayments,
            financialStatus
          }
        ]
      };
    }

    // Dashboard Gestor / Professor
    const activeStudents = store.students.filter(s => s.status === 'ATIVO').length;
    const totalClasses = store.classes.filter(c => c.status === 'ATIVO').length;

    const today = new Date().toISOString().slice(0, 10);
    const paidList = store.payments.filter(p => p.status === 'PAGO');
    const pendingList = store.payments.filter(p => p.status === 'PENDENTE' && p.due_date >= today);
    const overdueList = store.payments.filter(p => p.status === 'ATRASADO' || (p.status === 'PENDENTE' && p.due_date < today));
    const monthRevenue = paidList.reduce((acc, p) => acc + Number(p.amount || 0), 0);

    const upcomingTrainings = store.classes.map(c => ({
      id: c.id,
      name: c.name,
      category: c.category,
      daysOfWeek: c.days_of_week,
      startTime: c.start_time,
      endTime: c.end_time,
      location: c.location,
      teacherName: c.teachers?.name || 'Técnico'
    }));

    return {
      activeStudents,
      totalClasses,
      overduePayments: overdueList.length,
      monthRevenue,
      paymentsSummary: {
        paid: paidList.length,
        pending: pendingList.length,
        overdue: overdueList.length
      },
      upcomingTrainings
    };
  }

  // ==========================================
  // 2. STUDENTS (/students)
  // ==========================================
  // GET /students/:id/profile
  const profileMatch = pathname.match(/^\/students\/([^/]+)\/profile$/);
  if (profileMatch && method === 'GET') {
    const studentId = profileMatch[1];
    const student = store.students.find(s => s.id === studentId);
    if (!student) throw new Error('Aluno não encontrado no ambiente de demonstração');

    const enrolledClasses = store.classes
      .filter(c => c.studentIds.includes(student.id))
      .map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        days_of_week: c.days_of_week,
        start_time: c.start_time,
        end_time: c.end_time,
        location: c.location
      }));

    const guardians = student.guardian ? [{
      id: student.guardian.id || 'demo-grd-1',
      name: student.guardian.name,
      cpf: student.guardian.cpf || null,
      phone: student.guardian.phone,
      email: student.guardian.email || null,
      hasPortalAccess: true,
      relationship: student.guardian.relationship || 'Responsável'
    }] : [];

    const emergencyContacts = student.emergencyContact ? [{
      name: student.emergencyContact.name,
      phone: student.emergencyContact.phone,
      relationship: student.emergencyContact.relationship,
      authorized_pickup: student.emergencyContact.authorizedPickup ?? true,
      notes: student.emergencyContact.notes || null
    }] : [];

    const payments = store.payments.filter(p => p.student_id === student.id);

    const studentAtt = store.attendance.filter(a => a.student_id === student.id);
    const totalTrainings = studentAtt.length > 0 ? studentAtt.length : 12;
    const presences = studentAtt.length > 0 ? studentAtt.filter(a => a.status === 'PRESENTE').length : 11;
    const absences = studentAtt.length > 0 ? studentAtt.filter(a => a.status === 'AUSENTE').length : 1;
    const justified = studentAtt.length > 0 ? studentAtt.filter(a => a.status === 'JUSTIFICADO').length : 0;
    const attendanceRate = totalTrainings > 0 ? Math.round((presences / totalTrainings) * 100) : 92;

    const studentData = {
      ...student,
      dominantFoot: student.dominant_foot,
      dominant_foot: student.dominant_foot,
      shirtNumber: student.shirt_number,
      shirt_number: student.shirt_number,
      medicalRestrictions: student.medical_restrictions,
      medical_restrictions: student.medical_restrictions
    };

    return {
      student: studentData,
      ...studentData,
      guardians,
      emergencyContacts,
      classes: enrolledClasses,
      payments,
      attendance: {
        totalTrainings,
        presences,
        absences,
        justified,
        attendanceRate,
        history: studentAtt
      }
    };
  }

  // POST /students/:id/guardians/:gid/invite ou reinvite
  if (pathname.includes('/invite') || pathname.includes('/reinvite')) {
    return {
      message: 'Convite simulado com sucesso no modo de demonstração!',
      status: 'SENT',
      email: 'responsavel@exemplo.com'
    };
  }

  // GET /students/:id
  const studentDetailMatch = pathname.match(/^\/students\/([^/]+)$/);
  if (studentDetailMatch) {
    const studentId = studentDetailMatch[1];
    if (method === 'GET') {
      const s = store.students.find(x => x.id === studentId);
      if (!s) throw new Error('Aluno não encontrado');
      return {
        ...s,
        dominantFoot: s.dominant_foot,
        shirtNumber: s.shirt_number,
        enrolledAt: s.enrolled_at
      };
    }

    if (method === 'PUT') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
      const index = store.students.findIndex(x => x.id === studentId);
      if (index === -1) throw new Error('Aluno não encontrado');

      const existing = store.students[index];
      const updated: MockStudent = {
        ...existing,
        name: body.name !== undefined ? body.name : existing.name,
        cpf: body.cpf !== undefined ? body.cpf : existing.cpf,
        dob: body.dob !== undefined ? body.dob : existing.dob,
        phone: body.phone !== undefined ? body.phone : existing.phone,
        address: body.address !== undefined ? body.address : existing.address,
        allergies: body.allergies !== undefined ? body.allergies : existing.allergies,
        medical_restrictions: body.medicalRestrictions !== undefined ? body.medicalRestrictions : (body.medical_restrictions !== undefined ? body.medical_restrictions : existing.medical_restrictions),
        medications: body.medications !== undefined ? body.medications : existing.medications,
        category: body.category !== undefined ? body.category : existing.category,
        position: body.position !== undefined ? body.position : existing.position,
        dominant_foot: body.dominantFoot !== undefined ? body.dominantFoot : (body.dominant_foot !== undefined ? body.dominant_foot : existing.dominant_foot),
        shirt_number: body.shirtNumber !== undefined ? Number(body.shirtNumber) : (body.shirt_number !== undefined ? Number(body.shirt_number) : existing.shirt_number),
        status: body.status !== undefined ? body.status : existing.status,
        guardian: body.guardian ? {
          ...(existing.guardian || { name: '', phone: '' }),
          ...body.guardian,
          id: existing.guardian?.id || 'demo-grd-1'
        } : existing.guardian,
        emergencyContact: body.emergencyContact ? {
          ...(existing.emergencyContact || { name: '', phone: '', relationship: 'Familiar' }),
          ...body.emergencyContact
        } : existing.emergencyContact
      };

      store.students[index] = updated;
      saveDataStore(store);
      return updated;
    }

    if (method === 'DELETE') {
      store.students = store.students.filter(x => x.id !== studentId);
      // Remove de classes
      store.classes.forEach(c => {
        c.studentIds = c.studentIds.filter(id => id !== studentId);
      });
      saveDataStore(store);
      return { message: 'Aluno excluído da demonstração com sucesso' };
    }
  }

  // GET /students ou POST /students
  if (pathname === '/students') {
    if (method === 'GET') {
      const search = searchParams.get('search')?.toLowerCase();
      const category = searchParams.get('category');
      const status = searchParams.get('status');

      let list = store.students;
      if (status) list = list.filter(s => s.status === status);
      if (category) list = list.filter(s => s.category === category);
      if (search) list = list.filter(s => s.name.toLowerCase().includes(search));

      return list.map(s => {
        const enrolledClasses = store.classes
          .filter(c => c.studentIds.includes(s.id))
          .map(c => ({ id: c.id, name: c.name, category: c.category }));

        return {
          ...s,
          dominantFoot: s.dominant_foot,
          shirtNumber: s.shirt_number,
          enrolledAt: s.enrolled_at,
          classes: enrolledClasses,
          className: enrolledClasses.length > 0 ? enrolledClasses[0].name : 'Sem Turma'
        };
      });
    }

    if (method === 'POST') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
      const newId = `demo-std-${Date.now()}`;
      const newStudent: MockStudent = {
        id: newId,
        school_id: 'demo-school-001',
        name: body.name || 'Novo Atleta Demo',
        cpf: body.cpf || '000.000.000-00',
        dob: body.dob || '2014-01-01',
        phone: body.phone || null,
        address: body.address || null,
        allergies: body.allergies || null,
        medical_restrictions: body.medicalRestrictions || null,
        medications: body.medications || null,
        category: body.category || 'SUB_11',
        position: body.position || 'Meio-Campo',
        dominant_foot: body.dominantFoot || 'Destro',
        shirt_number: Number(body.shirtNumber) || 10,
        status: 'ATIVO',
        enrolled_at: new Date().toISOString(),
        guardian: body.guardian,
        emergencyContact: body.emergencyContact
      };

      store.students.push(newStudent);

      // Enturmar se indicado
      if (body.classId) {
        const targetClass = store.classes.find(c => c.id === body.classId);
        if (targetClass && !targetClass.studentIds.includes(newId)) {
          targetClass.studentIds.push(newId);
        }
      }

      // Log de auditoria mock
      store.auditLogs.unshift({
        id: `demo-log-${Date.now()}`,
        school_id: 'demo-school-001',
        user_id: 'demo-user-gestor',
        user_email: 'carlos.diretor@basefc.com',
        user_role: 'GESTOR',
        action: 'CADASTRAR_ALUNO',
        resource: `Aluno: ${newStudent.name}`,
        details: { studentId: newId, category: newStudent.category },
        timestamp: new Date().toISOString(),
        ip_address: '127.0.0.1'
      });

      saveDataStore(store);
      return newStudent;
    }
  }

  // ==========================================
  // 3. CLASSES (/classes)
  // ==========================================
  // POST /classes/:id/enroll ou /classes/:id/students
  const enrollMatch = pathname.match(/^\/classes\/([^/]+)\/(enroll|students)$/);
  if (enrollMatch && method === 'POST') {
    const classId = enrollMatch[1];
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const studentId = body.studentId;
    const targetClass = store.classes.find(c => c.id === classId);
    if (targetClass && studentId && !targetClass.studentIds.includes(studentId)) {
      targetClass.studentIds.push(studentId);
      saveDataStore(store);
    }
    return { message: 'Atleta matriculado com sucesso na turma' };
  }

  // DELETE /classes/:id/enroll/:studentId ou /classes/:id/students/:studentId
  const unenrollMatch = pathname.match(/^\/classes\/([^/]+)\/(enroll|students)\/([^/]+)$/);
  if (unenrollMatch && method === 'DELETE') {
    const classId = unenrollMatch[1];
    const studentId = unenrollMatch[3];
    const targetClass = store.classes.find(c => c.id === classId);
    if (targetClass) {
      targetClass.studentIds = targetClass.studentIds.filter(id => id !== studentId);
      saveDataStore(store);
    }
    return { message: 'Atleta desmatriculado da turma com sucesso' };
  }

  // GET /classes/:id/students
  const classStudentsMatch = pathname.match(/^\/classes\/([^/]+)\/students$/);
  if (classStudentsMatch && method === 'GET') {
    const classId = classStudentsMatch[1];
    const targetClass = store.classes.find(c => c.id === classId);
    if (!targetClass) return [];
    return store.students
      .filter(s => targetClass.studentIds.includes(s.id))
      .map(s => ({
        id: s.id,
        name: s.name,
        shirtNumber: s.shirt_number,
        shirt_number: s.shirt_number,
        category: s.category,
        status: s.status
      }));
  }

  // GET /classes/:id, PUT /classes/:id, DELETE /classes/:id
  const classDetailMatch = pathname.match(/^\/classes\/([^/]+)$/);
  if (classDetailMatch) {
    const classId = classDetailMatch[1];
    const targetClass = store.classes.find(c => c.id === classId);
    if (!targetClass) throw new Error('Turma não encontrada');

    if (method === 'GET') {
      const teacher = store.teachers.find(t => t.id === targetClass.teacher_id);
      const studentsInClass = store.students
        .filter(s => targetClass.studentIds.includes(s.id))
        .map(s => ({
          id: s.id,
          name: s.name,
          cpf: s.cpf,
          category: s.category,
          shirt_number: s.shirt_number,
          status: s.status,
          dob: s.dob,
          phone: s.phone,
          address: s.address,
          position: s.position,
          dominant_foot: s.dominant_foot,
          medical_restrictions: s.medical_restrictions,
          allergies: s.allergies,
          medications: s.medications,
          enrolled_at: s.enrolled_at,
          guardians: s.guardian ? [s.guardian] : [],
          emergencyContacts: s.emergencyContact ? [s.emergencyContact] : []
        }));

      return {
        ...targetClass,
        daysOfWeek: targetClass.days_of_week,
        startTime: targetClass.start_time,
        endTime: targetClass.end_time,
        teacherId: targetClass.teacher_id,
        teacherName: teacher?.name || 'Sem Professor',
        teachers: teacher ? { id: teacher.id, name: teacher.name } : null,
        students: studentsInClass,
        enrolledCount: studentsInClass.length,
        availableSlots: Math.max(0, targetClass.capacity - studentsInClass.length),
        isFull: studentsInClass.length >= targetClass.capacity
      };
    }

    if (method === 'PUT') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
      Object.assign(targetClass, {
        name: body.name ?? targetClass.name,
        category: body.category ?? targetClass.category,
        days_of_week: body.daysOfWeek ?? targetClass.days_of_week,
        start_time: body.startTime ?? targetClass.start_time,
        end_time: body.endTime ?? targetClass.end_time,
        location: body.location ?? targetClass.location,
        capacity: Number(body.capacity) || targetClass.capacity,
        teacher_id: body.teacherId ?? targetClass.teacher_id
      });
      if (targetClass.teacher_id) {
        const t = store.teachers.find(tch => tch.id === targetClass.teacher_id);
        targetClass.teachers = t ? { id: t.id, name: t.name } : undefined;
      }
      saveDataStore(store);
      return targetClass;
    }

    if (method === 'DELETE') {
      store.classes = store.classes.filter(c => c.id !== classId);
      saveDataStore(store);
      return { message: 'Turma removida da demonstração' };
    }
  }

  // GET /classes ou POST /classes
  if (pathname === '/classes') {
    if (method === 'GET') {
      return store.classes.map(c => {
        const teacher = store.teachers.find(t => t.id === c.teacher_id);
        const enrolledCount = c.studentIds.length;
        return {
          ...c,
          daysOfWeek: c.days_of_week,
          startTime: c.start_time,
          endTime: c.end_time,
          teacherId: c.teacher_id,
          teacherName: teacher?.name || 'Sem Professor',
          teachers: teacher ? { id: teacher.id, name: teacher.name } : null,
          enrolledCount,
          availableSlots: Math.max(0, c.capacity - enrolledCount),
          isFull: enrolledCount >= c.capacity
        };
      });
    }

    if (method === 'POST') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
      const newClass: MockClass = {
        id: `demo-cls-${Date.now()}`,
        school_id: 'demo-school-001',
        name: body.name || 'Nova Turma Demo',
        category: body.category || 'SUB_11',
        days_of_week: body.daysOfWeek || ['SEG', 'QUA'],
        start_time: body.startTime || '08:00',
        end_time: body.endTime || '09:30',
        location: body.location || 'Campo 1',
        capacity: Number(body.capacity) || 20,
        status: 'ATIVO',
        teacher_id: body.teacherId || null,
        studentIds: []
      };
      if (newClass.teacher_id) {
        const t = store.teachers.find(tch => tch.id === newClass.teacher_id);
        newClass.teachers = t ? { id: t.id, name: t.name } : undefined;
      }
      store.classes.push(newClass);
      saveDataStore(store);
      return newClass;
    }
  }

  // ==========================================
  // 4. TEACHERS (/teachers)
  // ==========================================
  const teacherDetailMatch = pathname.match(/^\/teachers\/([^/]+)$/);
  if (teacherDetailMatch) {
    const teacherId = teacherDetailMatch[1];
    if (method === 'PUT') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
      const t = store.teachers.find(x => x.id === teacherId);
      if (!t) throw new Error('Professor não encontrado');
      Object.assign(t, {
        name: body.name ?? t.name,
        email: body.email ?? t.email,
        phone: body.phone ?? t.phone,
        cref: body.cref ?? t.cref,
        specialties: body.specialties ?? t.specialties,
        status: body.status ?? t.status
      });
      saveDataStore(store);
      return t;
    }

    if (method === 'DELETE') {
      store.teachers = store.teachers.filter(x => x.id !== teacherId);
      saveDataStore(store);
      return { message: 'Professor excluído da demonstração' };
    }
  }

  if (pathname === '/teachers') {
    if (method === 'GET') {
      return store.teachers.map(t => {
        const teacherClasses = store.classes
          .filter(c => c.teacher_id === t.id)
          .map(c => ({ id: c.id, name: c.name, category: c.category }));
        return { ...t, classes: teacherClasses };
      });
    }

    if (method === 'POST') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
      const newTeacher: MockTeacher = {
        id: `demo-tch-${Date.now()}`,
        school_id: 'demo-school-001',
        name: body.name || 'Novo Professor',
        email: body.email || null,
        phone: body.phone || null,
        cref: body.cref || null,
        specialties: Array.isArray(body.specialties) ? body.specialties : [],
        status: 'ATIVO',
        created_at: new Date().toISOString(),
        classes: []
      };
      store.teachers.push(newTeacher);
      saveDataStore(store);
      return newTeacher;
    }
  }

  // ==========================================
  // 5. ATTENDANCE (/attendance)
  // ==========================================
  // GET /attendance/class/:classId
  const attClassMatch = pathname.match(/^\/attendance\/class\/([^/]+)$/);
  if (attClassMatch && method === 'GET') {
    const classId = attClassMatch[1];
    const targetDate = searchParams.get('date') || new Date().toISOString().slice(0, 10);
    const targetClass = store.classes.find(c => c.id === classId);
    if (!targetClass) return [];

    const existingForDate = store.attendance.filter(a => a.class_id === classId && a.date === targetDate);
    const attMap = new Map(existingForDate.map(a => [a.student_id, a.status]));

    return store.students
      .filter(s => targetClass.studentIds.includes(s.id))
      .map(s => ({
        id: s.id,
        name: s.name,
        shirtNumber: s.shirt_number,
        shirt_number: s.shirt_number,
        category: s.category,
        status: attMap.get(s.id) || 'PRESENTE'
      }));
  }

  // POST /attendance
  if (pathname === '/attendance' && method === 'POST') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const { classId, date, records } = body;

    if (Array.isArray(records)) {
      // Remove presenças existentes da mesma data e turma
      store.attendance = store.attendance.filter(a => !(a.class_id === classId && a.date === date));
      // Insere novas
      records.forEach((rec: any) => {
        store.attendance.push({
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          class_id: classId,
          student_id: rec.studentId,
          date,
          status: rec.status,
          notes: rec.notes || null
        });
      });

      // Log de auditoria
      store.auditLogs.unshift({
        id: `demo-log-${Date.now()}`,
        school_id: 'demo-school-001',
        user_id: 'demo-user-prof',
        user_email: demoSession?.email || 'roberto.tecnico@basefc.com',
        user_role: currentRole,
        action: 'REGISTRAR_CHAMADA',
        resource: `Turma: ${store.classes.find(c => c.id === classId)?.name || classId} • Data: ${date}`,
        details: { classId, date, totalRecords: records.length },
        timestamp: new Date().toISOString(),
        ip_address: '127.0.0.1'
      });

      saveDataStore(store);
    }
    return { message: 'Chamada registrada com sucesso no ambiente de demonstração!' };
  }

  // ==========================================
  // 6. PAYMENTS (/payments)
  // ==========================================
  // POST /payments/batch
  if (pathname === '/payments/batch' && method === 'POST') {
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const competence = body.competence || '10/2026';
    const amount = Number(body.amount) || 195.00;
    const dueDate = body.dueDate || '2026-10-10';

    const activeStudents = store.students.filter(s => s.status === 'ATIVO');
    const createdList: MockPayment[] = [];

    activeStudents.forEach(s => {
      const exists = store.payments.some(p => p.student_id === s.id && p.competence === competence);
      if (!exists) {
        const newPay: MockPayment = {
          id: `demo-pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          student_id: s.id,
          amount,
          due_date: dueDate,
          competence,
          status: 'PENDENTE',
          students: {
            id: s.id,
            name: s.name,
            category: s.category,
            shirt_number: s.shirt_number,
            cpf: s.cpf
          }
        };
        store.payments.push(newPay);
        createdList.push(newPay);
      }
    });

    saveDataStore(store);
    return {
      message: `${createdList.length} mensalidades geradas em lote no ambiente de demonstração.`,
      count: createdList.length,
      created: createdList
    };
  }

  // POST /payments/:id/pay
  const payMatch = pathname.match(/^\/payments\/([^/]+)\/pay$/);
  if (payMatch && method === 'POST') {
    const paymentId = payMatch[1];
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
    const payment = store.payments.find(p => p.id === paymentId);
    if (!payment) throw new Error('Cobrança não encontrada');

    payment.status = 'PAGO';
    payment.payment_method = body.method || 'PIX';
    payment.paid_at = new Date().toISOString();

    store.auditLogs.unshift({
      id: `demo-log-${Date.now()}`,
      school_id: 'demo-school-001',
      user_id: 'demo-user-gestor',
      user_email: 'carlos.diretor@basefc.com',
      user_role: 'GESTOR',
      action: 'CONFIRMAR_PAGAMENTO',
      resource: `Mensalidade ${payment.competence} - ${payment.students?.name || 'Aluno'} (R$ ${payment.amount.toFixed(2)})`,
      details: { paymentId, method: payment.payment_method, paidAt: payment.paid_at },
      timestamp: new Date().toISOString(),
      ip_address: '127.0.0.1'
    });

    saveDataStore(store);
    return { message: 'Baixa de pagamento confirmada com sucesso!', payment };
  }

  // DELETE /payments/:id
  const payDeleteMatch = pathname.match(/^\/payments\/([^/]+)$/);
  if (payDeleteMatch && method === 'DELETE') {
    const paymentId = payDeleteMatch[1];
    store.payments = store.payments.filter(p => p.id !== paymentId);
    saveDataStore(store);
    return { message: 'Cobrança cancelada com sucesso' };
  }

  // GET /payments ou POST /payments
  if (pathname === '/payments') {
    if (method === 'GET') {
      const status = searchParams.get('status');
      const studentId = searchParams.get('studentId');
      const competence = searchParams.get('competence');
      const today = new Date().toISOString().slice(0, 10);

      let list = store.payments.map(p => {
        const student = store.students.find(s => s.id === p.student_id);
        const isOverdue = p.status === 'PENDENTE' && p.due_date < today;
        return {
          ...p,
          status: isOverdue ? ('ATRASADO' as const) : p.status,
          students: student ? {
            id: student.id,
            name: student.name,
            category: student.category,
            shirt_number: student.shirt_number,
            cpf: student.cpf,
            school_id: student.school_id
          } : p.students
        };
      });

      if (status && status !== 'TODOS') list = list.filter(p => p.status === status);
      if (studentId) list = list.filter(p => p.student_id === studentId);
      if (competence && competence !== 'TODOS') list = list.filter(p => p.competence === competence);

      return list;
    }

    if (method === 'POST') {
      const body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
      const student = store.students.find(s => s.id === body.studentId);
      const newPay: MockPayment = {
        id: `demo-pay-${Date.now()}`,
        student_id: body.studentId,
        amount: Number(body.amount) || 195.00,
        due_date: body.dueDate || new Date().toISOString().slice(0, 10),
        competence: body.competence || '09/2026',
        status: 'PENDENTE',
        students: student ? {
          id: student.id,
          name: student.name,
          category: student.category,
          shirt_number: student.shirt_number,
          cpf: student.cpf
        } : undefined
      };
      store.payments.push(newPay);
      saveDataStore(store);
      return newPay;
    }
  }

  // ==========================================
  // 7. AUDIT & LOGS (/audit ou /audit-logs)
  // ==========================================
  if (pathname === '/audit' || pathname === '/audit-logs') {
    return store.auditLogs.map(l => ({
      id: l.id,
      timestamp: l.timestamp,
      user: { email: l.user_email, role: l.user_role },
      action: l.action,
      resource: l.resource,
      ip: l.ip_address,
      details: l.details
    }));
  }

  // Fallback
  return { status: 'ok', mock: true };
}
