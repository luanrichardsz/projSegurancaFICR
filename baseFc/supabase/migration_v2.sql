-- =============================================================================
-- BASE FC - MIGRAÇÃO V2 (CAMPOS MÉDICOS, CONTATO E SEGURANÇA)
-- Execute no Supabase SQL Editor para adicionar os novos campos
-- =============================================================================

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS allergies TEXT,
ADD COLUMN IF NOT EXISTS medical_restrictions TEXT,
ADD COLUMN IF NOT EXISTS medications TEXT;

-- Comentários explicativos para documentação acadêmica
COMMENT ON COLUMN public.students.allergies IS 'Dado de saúde sensível - Acesso restrito (Confidencialidade)';
COMMENT ON COLUMN public.students.medical_restrictions IS 'Restrições para exercícios físicos - Acesso permitido ao professor';
