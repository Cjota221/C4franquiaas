-- Migration 041: Sistema de Moderação de Banners
-- Criado em: 27/12/2024
-- Descrição: Banners enviados por revendedoras precisam de aprovação do admin

-- ============================================================================
-- TABELA DE SUBMISSÕES DE BANNERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS banner_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id UUID NOT NULL REFERENCES resellers(id) ON DELETE CASCADE,
  
  -- Tipo do banner
  banner_type VARCHAR(20) NOT NULL DEFAULT 'desktop', -- 'desktop', 'mobile'
  
  -- URL da imagem (armazenada no Supabase Storage)
  image_url TEXT NOT NULL,
  
  -- Status da submissão
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  
  -- Feedback do admin (motivo da recusa, se aplicável)
  admin_feedback TEXT,
  
  -- Quem revisou
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- Controle
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_banner_submissions_reseller ON banner_submissions(reseller_id);
CREATE INDEX IF NOT EXISTS idx_banner_submissions_status ON banner_submissions(status);
CREATE INDEX IF NOT EXISTS idx_banner_submissions_type ON banner_submissions(banner_type);

-- ============================================================================
-- ATUALIZAR TABELA RESELLERS PARA USAR BANNER APROVADO
-- ============================================================================

-- Adicionar colunas para banner aprovado atual (se não existirem)
DO $$ 
BEGIN
  -- Banner desktop aprovado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resellers' AND column_name = 'approved_banner_id') THEN
    ALTER TABLE resellers ADD COLUMN approved_banner_id UUID REFERENCES banner_submissions(id);
  END IF;
  
  -- Banner mobile aprovado
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'resellers' AND column_name = 'approved_banner_mobile_id') THEN
    ALTER TABLE resellers ADD COLUMN approved_banner_mobile_id UUID REFERENCES banner_submissions(id);
  END IF;
END $$;

-- ============================================================================
-- FUNÇÃO PARA APROVAR BANNER
-- ============================================================================

CREATE OR REPLACE FUNCTION approve_banner(
  p_submission_id UUID,
  p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_submission RECORD;
  v_result JSONB;
BEGIN
  -- Buscar a submissão
  SELECT * INTO v_submission FROM banner_submissions WHERE id = p_submission_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Submissão não encontrada');
  END IF;
  
  -- Atualizar status para aprovado
  UPDATE banner_submissions 
  SET 
    status = 'approved',
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_submission_id;
  
  -- Atualizar o reseller com o banner aprovado
  IF v_submission.banner_type = 'desktop' THEN
    UPDATE resellers 
    SET 
      banner_url = v_submission.image_url,
      approved_banner_id = p_submission_id,
      updated_at = NOW()
    WHERE id = v_submission.reseller_id;
  ELSE
    UPDATE resellers 
    SET 
      banner_mobile_url = v_submission.image_url,
      approved_banner_mobile_id = p_submission_id,
      updated_at = NOW()
    WHERE id = v_submission.reseller_id;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'message', 'Banner aprovado com sucesso');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNÇÃO PARA RECUSAR BANNER
-- ============================================================================

CREATE OR REPLACE FUNCTION reject_banner(
  p_submission_id UUID,
  p_admin_id UUID,
  p_feedback TEXT DEFAULT 'Banner não atende aos critérios da plataforma'
)
RETURNS JSONB AS $$
BEGIN
  -- Verificar se existe
  IF NOT EXISTS (SELECT 1 FROM banner_submissions WHERE id = p_submission_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Submissão não encontrada');
  END IF;
  
  -- Atualizar status para recusado
  UPDATE banner_submissions 
  SET 
    status = 'rejected',
    admin_feedback = p_feedback,
    reviewed_by = p_admin_id,
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_submission_id;
  
  RETURN jsonb_build_object('success', true, 'message', 'Banner recusado');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE banner_submissions ENABLE ROW LEVEL SECURITY;

-- Revendedora vê apenas suas próprias submissões
CREATE POLICY "Resellers can view own banner submissions"
  ON banner_submissions FOR SELECT
  USING (
    reseller_id IN (
      SELECT id FROM resellers WHERE user_id = auth.uid()
    )
  );

-- Revendedora pode criar novas submissões
CREATE POLICY "Resellers can create banner submissions"
  ON banner_submissions FOR INSERT
  WITH CHECK (
    reseller_id IN (
      SELECT id FROM resellers WHERE user_id = auth.uid()
    )
  );

-- Admin pode ver todas as submissões
CREATE POLICY "Admins can view all banner submissions"
  ON banner_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admin pode atualizar submissões (aprovar/recusar)
CREATE POLICY "Admins can update banner submissions"
  ON banner_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE banner_submissions IS 'Submissões de banners das revendedoras para aprovação';
COMMENT ON COLUMN banner_submissions.status IS 'pending = aguardando revisão, approved = aprovado, rejected = recusado';
COMMENT ON COLUMN banner_submissions.admin_feedback IS 'Mensagem do admin explicando motivo da recusa';
