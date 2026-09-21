export interface MockStudent {
  id: string;
  school_id: string;
  schoolId?: string;
  name: string;
  cpf: string;
  dob: string;
  phone: string | null;
  address: string | null;
  allergies: string | null;
  medical_restrictions: string | null;
  medications: string | null;
  category: string;
  position: string;
  dominant_foot: string;
  dominantFoot?: string;
  shirt_number: number;
  shirtNumber?: number;
  status: 'ATIVO' | 'INATIVO';
  enrolled_at: string;
  enrolledAt?: string;
  classes?: any[];
  className?: string;
  guardian?: {
    id?: string;
    name: string;
    cpf?: string;
    phone: string;
    email?: string;
    relationship?: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
    authorizedPickup?: boolean;
    notes?: string;
  };
}

export interface MockTeacher {
  id: string;
  school_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  cref: string | null;
  specialties: string[];
  status: 'ATIVO' | 'INATIVO';
  created_at: string;
  classes?: { id: string; name: string; category: string }[];
}

export interface MockClass {
  id: string;
  school_id: string;
  name: string;
  category: string;
  days_of_week: string[];
  daysOfWeek?: string[];
  start_time: string;
  startTime?: string;
  end_time: string;
  endTime?: string;
  location: string;
  capacity: number;
  status: 'ATIVO' | 'INATIVO';
  teacher_id: string | null;
  teacherId?: string | null;
  teacherName?: string;
  teachers?: { id: string; name: string };
  enrolledCount?: number;
  availableSlots?: number;
  isFull?: boolean;
  studentIds: string[];
}

export interface MockPayment {
  id: string;
  student_id: string;
  studentId?: string;
  amount: number;
  due_date: string;
  dueDate?: string;
  competence: string;
  status: 'PAGO' | 'PENDENTE' | 'ATRASADO';
  payment_method?: string | null;
  paymentMethod?: string | null;
  paid_at?: string | null;
  paidAt?: string | null;
  invoice_url?: string | null;
  students?: {
    id: string;
    name: string;
    category: string;
    shirt_number?: number;
    cpf?: string;
    school_id?: string;
  };
}

export interface MockAttendance {
  id: string;
  class_id: string;
  student_id: string;
  date: string;
  status: 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADO';
  notes?: string | null;
}

export interface MockAuditLog {
  id: string;
  school_id: string;
  user_id: string;
  user_email: string;
  user_role: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  timestamp: string;
  ip_address: string;
}

export const INITIAL_TEACHERS: MockTeacher[] = [
  {
    id: 'demo-tch-1',
    school_id: 'demo-school-001',
    name: 'Prof. Roberto Costa',
    email: 'roberto.tecnico@basefc.com',
    phone: '81987654321',
    cref: '012345-G/PE',
    specialties: ['Tática Ofensiva', 'Fundamentos Técnicos', 'Transição Rápida'],
    status: 'ATIVO',
    created_at: '2025-01-10T10:00:00Z',
    classes: [
      { id: 'demo-cls-2', name: 'Sub-13 Tarde - Campo Principal', category: 'SUB_13' },
      { id: 'demo-cls-3', name: 'Sub-15 Tarde - Tático e Força', category: 'SUB_15' }
    ]
  },
  {
    id: 'demo-tch-2',
    school_id: 'demo-school-001',
    name: 'Profª. Juliana Martins',
    email: 'juliana.martins@basefc.com',
    phone: '81987654322',
    cref: '023456-G/PE',
    specialties: ['Iniciação Esportiva', 'Coordenação Motora', 'Preparação Física'],
    status: 'ATIVO',
    created_at: '2025-02-01T09:30:00Z',
    classes: [
      { id: 'demo-cls-1', name: 'Sub-11 Manhã - Campo Society', category: 'SUB_11' },
      { id: 'demo-cls-4', name: 'Sub-9 Iniciação aos Sábados', category: 'SUB_9' }
    ]
  },
  {
    id: 'demo-tch-3',
    school_id: 'demo-school-001',
    name: 'Prof. Marcos Vinicius',
    email: 'marcos.vinicius@basefc.com',
    phone: '81987654323',
    cref: '034567-G/PE',
    specialties: ['Treinamento de Goleiros', 'Agilidade', 'Reflexo'],
    status: 'ATIVO',
    created_at: '2025-03-05T14:00:00Z',
    classes: []
  }
];

export const INITIAL_CLASSES: MockClass[] = [
  {
    id: 'demo-cls-1',
    school_id: 'demo-school-001',
    name: 'Sub-11 Manhã - Campo Society',
    category: 'SUB_11',
    days_of_week: ['TER', 'QUI'],
    start_time: '08:00',
    end_time: '09:30',
    location: 'Campo Society 1',
    capacity: 20,
    status: 'ATIVO',
    teacher_id: 'demo-tch-2',
    teachers: { id: 'demo-tch-2', name: 'Profª. Juliana Martins' },
    studentIds: ['demo-std-2', 'demo-std-4']
  },
  {
    id: 'demo-cls-2',
    school_id: 'demo-school-001',
    name: 'Sub-13 Tarde - Campo Principal',
    category: 'SUB_13',
    days_of_week: ['SEG', 'QUA', 'SEX'],
    start_time: '15:00',
    end_time: '16:30',
    location: 'Campo de Grama Oficial',
    capacity: 22,
    status: 'ATIVO',
    teacher_id: 'demo-tch-1',
    teachers: { id: 'demo-tch-1', name: 'Prof. Roberto Costa' },
    studentIds: ['demo-std-1', 'demo-std-5', 'demo-std-7']
  },
  {
    id: 'demo-cls-3',
    school_id: 'demo-school-001',
    name: 'Sub-15 Tarde - Tático e Força',
    category: 'SUB_15',
    days_of_week: ['TER', 'QUI'],
    start_time: '16:30',
    end_time: '18:00',
    location: 'Campo de Grama Oficial',
    capacity: 25,
    status: 'ATIVO',
    teacher_id: 'demo-tch-1',
    teachers: { id: 'demo-tch-1', name: 'Prof. Roberto Costa' },
    studentIds: ['demo-std-3', 'demo-std-8']
  },
  {
    id: 'demo-cls-4',
    school_id: 'demo-school-001',
    name: 'Sub-9 Iniciação aos Sábados',
    category: 'SUB_9',
    days_of_week: ['SAB'],
    start_time: '08:30',
    end_time: '10:00',
    location: 'Quadra Poliesportiva Coberta',
    capacity: 18,
    status: 'ATIVO',
    teacher_id: 'demo-tch-2',
    teachers: { id: 'demo-tch-2', name: 'Profª. Juliana Martins' },
    studentIds: ['demo-std-6']
  }
];

export const INITIAL_STUDENTS: MockStudent[] = [
  {
    id: 'demo-std-1',
    school_id: 'demo-school-001',
    name: 'Lucas Souza',
    cpf: '11122233344',
    dob: '2013-05-12',
    phone: '81988776655',
    address: 'Rua das Palmeiras, 142 - Boa Viagem, Recife-PE',
    allergies: 'Dipirona e Frutos do Mar',
    medical_restrictions: 'Sem restrições para esforço cardiovascular intenso',
    medications: null,
    category: 'SUB_13',
    position: 'Meio-Campo',
    dominant_foot: 'Destro',
    shirt_number: 10,
    status: 'ATIVO',
    enrolled_at: '2025-01-15T14:30:00Z',
    guardian: {
      id: 'demo-grd-1',
      name: 'Ana Paula Souza',
      cpf: '99988877766',
      phone: '81988776655',
      email: 'ana.souza@email.com',
      relationship: 'Mãe'
    },
    emergencyContact: {
      name: 'Carlos Souza (Pai)',
      phone: '81988776650',
      relationship: 'Pai',
      authorizedPickup: true,
      notes: 'Ligar em caso de emergência ou atraso no treino'
    }
  },
  {
    id: 'demo-std-2',
    school_id: 'demo-school-001',
    name: 'Gabriel Silva',
    cpf: '22233344455',
    dob: '2015-08-20',
    phone: '81999881122',
    address: 'Av. Conselheiro Aguiar, 2300 - Recife-PE',
    allergies: null,
    medical_restrictions: 'Usa bombinha preventiva antes do treino',
    medications: 'Salbutamol se necessário',
    category: 'SUB_11',
    position: 'Atacante',
    dominant_foot: 'Canhoto',
    shirt_number: 7,
    status: 'ATIVO',
    enrolled_at: '2025-02-01T10:15:00Z',
    guardian: {
      id: 'demo-grd-2',
      name: 'Marcos Silva',
      phone: '81999881122',
      email: 'marcos.silva@email.com',
      relationship: 'Pai'
    },
    emergencyContact: {
      name: 'Renata Silva',
      phone: '81999881123',
      relationship: 'Mãe',
      authorizedPickup: true
    }
  },
  {
    id: 'demo-std-3',
    school_id: 'demo-school-001',
    name: 'Matheus Oliveira',
    cpf: '33344455566',
    dob: '2011-03-15',
    phone: '81987772233',
    address: 'Rua do Espinheiro, 450 - Recife-PE',
    allergies: 'Pólen e poeira',
    medical_restrictions: null,
    medications: null,
    category: 'SUB_15',
    position: 'Goleiro',
    dominant_foot: 'Destro',
    shirt_number: 1,
    status: 'ATIVO',
    enrolled_at: '2025-01-20T11:00:00Z',
    guardian: {
      id: 'demo-grd-3',
      name: 'Fátima Oliveira',
      phone: '81987772233',
      email: 'fatima.oliveira@email.com',
      relationship: 'Mãe'
    },
    emergencyContact: {
      name: 'Fátima Oliveira',
      phone: '81987772233',
      relationship: 'Mãe',
      authorizedPickup: true
    }
  },
  {
    id: 'demo-std-4',
    school_id: 'demo-school-001',
    name: 'Bernardo Santos',
    cpf: '44455566677',
    dob: '2015-11-04',
    phone: '81981113344',
    address: 'Rua Real da Torre, 1020 - Recife-PE',
    allergies: null,
    medical_restrictions: null,
    medications: null,
    category: 'SUB_11',
    position: 'Zagueiro',
    dominant_foot: 'Destro',
    shirt_number: 5,
    status: 'ATIVO',
    enrolled_at: '2025-02-10T16:20:00Z',
    guardian: {
      id: 'demo-grd-4',
      name: 'Eduardo Santos',
      phone: '81981113344',
      relationship: 'Pai'
    }
  },
  {
    id: 'demo-std-5',
    school_id: 'demo-school-001',
    name: 'Enzo Ferrari Ferreira',
    cpf: '55566677788',
    dob: '2013-09-18',
    phone: '81982224455',
    address: 'Rua Amélia, 310 - Graças, Recife-PE',
    allergies: 'Lactose',
    medical_restrictions: null,
    medications: null,
    category: 'SUB_13',
    position: 'Volante',
    dominant_foot: 'Destro',
    shirt_number: 8,
    status: 'ATIVO',
    enrolled_at: '2025-01-25T09:40:00Z',
    guardian: {
      id: 'demo-grd-5',
      name: 'Patrícia Ferreira',
      phone: '81982224455',
      relationship: 'Mãe'
    }
  },
  {
    id: 'demo-std-6',
    school_id: 'demo-school-001',
    name: 'Arthur Pereira',
    cpf: '66677788899',
    dob: '2017-02-28',
    phone: '81983335566',
    address: 'Rua Barão de Souza Leão, 800 - Recife-PE',
    allergies: null,
    medical_restrictions: null,
    medications: null,
    category: 'SUB_9',
    position: 'Atacante',
    dominant_foot: 'Destro',
    shirt_number: 9,
    status: 'ATIVO',
    enrolled_at: '2025-02-15T15:00:00Z',
    guardian: {
      id: 'demo-grd-6',
      name: 'Luciana Pereira',
      phone: '81983335566',
      relationship: 'Mãe'
    }
  },
  {
    id: 'demo-std-7',
    school_id: 'demo-school-001',
    name: 'Davi Lucca Ribeiro',
    cpf: '77788899900',
    dob: '2013-07-09',
    phone: '81984446677',
    address: 'Rua Setúbal, 650 - Boa Viagem, Recife-PE',
    allergies: null,
    medical_restrictions: null,
    medications: null,
    category: 'SUB_13',
    position: 'Lateral Esquerdo',
    dominant_foot: 'Canhoto',
    shirt_number: 11,
    status: 'ATIVO',
    enrolled_at: '2025-01-18T10:30:00Z',
    guardian: {
      id: 'demo-grd-7',
      name: 'Rodrigo Ribeiro',
      phone: '81984446677',
      relationship: 'Pai'
    }
  },
  {
    id: 'demo-std-8',
    school_id: 'demo-school-001',
    name: 'Cauã Rodrigues',
    cpf: '88899900011',
    dob: '2011-10-10',
    phone: '81985557788',
    address: 'Av. Beira Rio, 1200 - Madalena, Recife-PE',
    allergies: null,
    medical_restrictions: 'Em recuperação de lesão leve no joelho direito',
    medications: null,
    category: 'SUB_15',
    position: 'Zagueiro',
    dominant_foot: 'Destro',
    shirt_number: 4,
    status: 'INATIVO',
    enrolled_at: '2024-11-05T14:00:00Z',
    guardian: {
      id: 'demo-grd-8',
      name: 'Mônica Rodrigues',
      phone: '81985557788',
      relationship: 'Mãe'
    }
  }
];

export const INITIAL_PAYMENTS: MockPayment[] = [
  {
    id: 'demo-pay-1',
    student_id: 'demo-std-1',
    amount: 195.00,
    due_date: '2026-09-10',
    competence: '09/2026',
    status: 'PAGO',
    payment_method: 'PIX',
    paid_at: '2026-09-08T15:20:00Z',
    invoice_url: '#',
    students: { id: 'demo-std-1', name: 'Lucas Souza', category: 'SUB_13', shirt_number: 10, cpf: '11122233344' }
  },
  {
    id: 'demo-pay-2',
    student_id: 'demo-std-2',
    amount: 195.00,
    due_date: '2026-09-10',
    competence: '09/2026',
    status: 'PAGO',
    payment_method: 'CARTAO_CREDITO',
    paid_at: '2026-09-10T09:45:00Z',
    invoice_url: '#',
    students: { id: 'demo-std-2', name: 'Gabriel Silva', category: 'SUB_11', shirt_number: 7, cpf: '22233344455' }
  },
  {
    id: 'demo-pay-3',
    student_id: 'demo-std-3',
    amount: 210.00,
    due_date: '2026-09-15',
    competence: '09/2026',
    status: 'PENDENTE',
    students: { id: 'demo-std-3', name: 'Matheus Oliveira', category: 'SUB_15', shirt_number: 1, cpf: '33344455566' }
  },
  {
    id: 'demo-pay-4',
    student_id: 'demo-std-4',
    amount: 195.00,
    due_date: '2026-09-05',
    competence: '09/2026',
    status: 'ATRASADO',
    students: { id: 'demo-std-4', name: 'Bernardo Santos', category: 'SUB_11', shirt_number: 5, cpf: '44455566677' }
  },
  {
    id: 'demo-pay-5',
    student_id: 'demo-std-5',
    amount: 195.00,
    due_date: '2026-09-10',
    competence: '09/2026',
    status: 'PAGO',
    payment_method: 'PIX',
    paid_at: '2026-09-09T17:10:00Z',
    students: { id: 'demo-std-5', name: 'Enzo Ferrari Ferreira', category: 'SUB_13', shirt_number: 8, cpf: '55566677788' }
  },
  {
    id: 'demo-pay-6',
    student_id: 'demo-std-6',
    amount: 180.00,
    due_date: '2026-09-20',
    competence: '09/2026',
    status: 'PENDENTE',
    students: { id: 'demo-std-6', name: 'Arthur Pereira', category: 'SUB_9', shirt_number: 9, cpf: '66677788899' }
  },
  {
    id: 'demo-pay-7',
    student_id: 'demo-std-7',
    amount: 195.00,
    due_date: '2026-09-05',
    competence: '09/2026',
    status: 'ATRASADO',
    students: { id: 'demo-std-7', name: 'Davi Lucca Ribeiro', category: 'SUB_13', shirt_number: 11, cpf: '77788899900' }
  },
  {
    id: 'demo-pay-8',
    student_id: 'demo-std-1',
    amount: 195.00,
    due_date: '2026-08-10',
    competence: '08/2026',
    status: 'PAGO',
    payment_method: 'PIX',
    paid_at: '2026-08-09T11:00:00Z',
    students: { id: 'demo-std-1', name: 'Lucas Souza', category: 'SUB_13', shirt_number: 10, cpf: '11122233344' }
  }
];

export const INITIAL_ATTENDANCE: MockAttendance[] = [
  { id: 'att-1', class_id: 'demo-cls-2', student_id: 'demo-std-1', date: '2026-09-18', status: 'PRESENTE' },
  { id: 'att-2', class_id: 'demo-cls-2', student_id: 'demo-std-5', date: '2026-09-18', status: 'PRESENTE' },
  { id: 'att-3', class_id: 'demo-cls-2', student_id: 'demo-std-7', date: '2026-09-18', status: 'AUSENTE' },
  { id: 'att-4', class_id: 'demo-cls-2', student_id: 'demo-std-1', date: '2026-09-16', status: 'PRESENTE' },
  { id: 'att-5', class_id: 'demo-cls-2', student_id: 'demo-std-5', date: '2026-09-16', status: 'JUSTIFICADO', notes: 'Consulta odontológica' },
  { id: 'att-6', class_id: 'demo-cls-2', student_id: 'demo-std-7', date: '2026-09-16', status: 'PRESENTE' },
  { id: 'att-7', class_id: 'demo-cls-2', student_id: 'demo-std-1', date: '2026-09-14', status: 'PRESENTE' },
  { id: 'att-8', class_id: 'demo-cls-1', student_id: 'demo-std-2', date: '2026-09-17', status: 'PRESENTE' },
  { id: 'att-9', class_id: 'demo-cls-1', student_id: 'demo-std-4', date: '2026-09-17', status: 'PRESENTE' }
];

export const INITIAL_AUDIT_LOGS: MockAuditLog[] = [
  {
    id: 'demo-log-1',
    school_id: 'demo-school-001',
    user_id: 'demo-user-gestor',
    user_email: 'carlos.diretor@basefc.com',
    user_role: 'GESTOR',
    action: 'CONFIRMAR_PAGAMENTO',
    resource: 'Mensalidade 09/2026 - Lucas Souza (R$ 195,00)',
    details: { paymentId: 'demo-pay-1', method: 'PIX', status: 'PAGO' },
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    ip_address: '189.45.120.33'
  },
  {
    id: 'demo-log-2',
    school_id: 'demo-school-001',
    user_id: 'demo-user-prof',
    user_email: 'roberto.tecnico@basefc.com',
    user_role: 'PROFESSOR',
    action: 'REGISTRAR_CHAMADA',
    resource: 'Turma Sub-13 Tarde - Treino 18/09/2026',
    details: { classId: 'demo-cls-2', totalStudents: 3, presences: 2, absences: 1 },
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    ip_address: '177.18.99.14'
  },
  {
    id: 'demo-log-3',
    school_id: 'demo-school-001',
    user_id: 'demo-user-gestor',
    user_email: 'carlos.diretor@basefc.com',
    user_role: 'GESTOR',
    action: 'CADASTRAR_ALUNO',
    resource: 'Aluno: Lucas Souza (Sub-13)',
    details: { studentId: 'demo-std-1', category: 'SUB_13', shirtNumber: 10 },
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
    ip_address: '189.45.120.33'
  },
  {
    id: 'demo-log-4',
    school_id: 'demo-school-001',
    user_id: 'demo-user-gestor',
    user_email: 'carlos.diretor@basefc.com',
    user_role: 'GESTOR',
    action: 'EMISSAO_LOTE_MENSALIDADES',
    resource: 'Competência 09/2026 - 7 Títulos Emitidos',
    details: { totalIssued: 7, monthRevenueExpected: 1365.00 },
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    ip_address: '189.45.120.33'
  }
];
