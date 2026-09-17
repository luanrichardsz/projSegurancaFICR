-- =============================================================================
-- BASE FC - MIGRAÇÃO V3 (ATUALIZAÇÃO DE PROFESSORES / COMISSÃO TÉCNICA)
-- Adiciona email, telefone, cref, especialidades e status na tabela de professores
-- =============================================================================

ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS email VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS cref VARCHAR(20),
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ATIVO';

COMMENT ON COLUMN public.teachers.email IS 'E-mail de contato do professor';
COMMENT ON COLUMN public.teachers.phone IS 'Telefone de contato higienizado';
COMMENT ON COLUMN public.teachers.cref IS 'Registro Profissional de Educação Física';
COMMENT ON COLUMN public.teachers.specialties IS 'Lista de especialidades técnicas';
COMMENT ON COLUMN public.teachers.status IS 'Status ATIVO ou INATIVO';
