-- =============================================================================
-- BASE FC - ESQUEMA DO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- Projeto de Segurança da Informação - FICR
-- =============================================================================

-- Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Escolas (Multi-tenancy)
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Perfis de Usuário (vinculada ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('GESTOR', 'PROFESSOR', 'RESPONSAVEL')),
    school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Alunos (Atletas)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    cpf VARCHAR(11) NOT NULL,
    dob DATE,
    category VARCHAR(50),
    position VARCHAR(50),
    dominant_foot VARCHAR(20) CHECK (dominant_foot IN ('DIREITO', 'ESQUERDO', 'AMBIDESTRO')),
    shirt_number INT CHECK (shirt_number BETWEEN 1 AND 99),
    status VARCHAR(20) DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO', 'TRANCADO')),
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabela de Responsáveis (Guardians)
CREATE TABLE IF NOT EXISTS public.guardians (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    cpf VARCHAR(14),
    phone VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Vínculo Responsável x Alunos
CREATE TABLE IF NOT EXISTS public.guardian_students (
    guardian_id UUID REFERENCES public.guardians(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    PRIMARY KEY (guardian_id, student_id)
);

-- 6. Tabela de Professores
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Tabela de Turmas (Classes)
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    days_of_week TEXT[],
    start_time TIME,
    end_time TIME,
    location VARCHAR(100),
    capacity INT NOT NULL DEFAULT 20,
    status VARCHAR(20) DEFAULT 'ATIVO' CHECK (status IN ('ATIVO', 'INATIVO')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Vínculo Turma x Alunos
CREATE TABLE IF NOT EXISTS public.class_students (
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    PRIMARY KEY (class_id, student_id)
);

-- 9. Contatos de Emergência
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50),
    phone VARCHAR(20) NOT NULL,
    is_main BOOLEAN DEFAULT false,
    authorized_pickup BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. Mensalidades / Pagamentos
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'PAGO', 'ATRASADO', 'CANCELADO')),
    payment_method VARCHAR(50),
    paid_at TIMESTAMPTZ,
    competence VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 11. Eventos e Treinos
CREATE TABLE IF NOT EXISTS public.training_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
    type VARCHAR(20) CHECK (type IN ('TREINO', 'AMISTOSO', 'CAMPEONATO', 'EVENTO')),
    title VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time TIME,
    location VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 12. Frequência / Presença
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) CHECK (status IN ('PRESENTE', 'AUSENTE', 'JUSTIFICADO')),
    recorded_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 13. Avisos e Comunicados
CREATE TABLE IF NOT EXISTS public.notices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    target_role VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. Trilha de Auditoria (Audit Log - Tríade CID - Integridade)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID,
    user_id UUID,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    details JSONB,
    timestamp TIMESTAMPTZ DEFAULT now()
);

-- =============================================================================
-- ÍNDICES PARA ALTA PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_students_school ON public.students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_cpf ON public.students(cpf);
CREATE INDEX IF NOT EXISTS idx_classes_school ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_school ON public.audit_logs(school_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- =============================================================================
-- SEGURANÇA: ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para usuários autenticados visualizarem seu próprio perfil
CREATE POLICY "Users can view own profile" 
ON public.users FOR SELECT 
TO authenticated 
USING (id = auth.uid());

-- Permitir que o backend (service_role) tenha acesso irrestrito para aplicar RBAC e auditoria
-- No Supabase, o service_role bypassa RLS automaticamente.

-- =============================================================================
-- TRIGGER AUTOMÁTICO: Vincular novos usuários cadastrados no Auth à tabela users
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role, status)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'GESTOR'),
        'ATIVO'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Inserir Escola Padrão Inicial para demonstração
INSERT INTO public.schools (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Escolinha Base FC Principal')
ON CONFLICT (id) DO NOTHING;
