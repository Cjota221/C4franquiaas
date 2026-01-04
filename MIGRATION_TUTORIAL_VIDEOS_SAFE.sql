-- ============================================================================
-- MIGRATION SAFE: TUTORIAL VIDEOS - Sistema de Vídeos Tutoriais
-- ============================================================================
-- Versão SAFE que não dropa nada, apenas cria se não existir

-- PASSO 1: Criar tabela tutorial_videos (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS tutorial_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  video_url TEXT NOT NULL,
  pagina TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASSO 2: Criar índices (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_pagina ON tutorial_videos(pagina);
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_ativo ON tutorial_videos(ativo);
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_ordem ON tutorial_videos(ordem);

-- PASSO 3: Habilitar RLS (não dropa as policies antigas)
ALTER TABLE tutorial_videos ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Dropar policies antigas apenas se existirem
DROP POLICY IF EXISTS "Admin pode gerenciar tutorial_videos" ON tutorial_videos;
DROP POLICY IF EXISTS "Revendedoras podem ver tutorial_videos ativos" ON tutorial_videos;
DROP POLICY IF EXISTS "Franqueadas podem ver tutorial_videos ativos" ON tutorial_videos;

-- PASSO 5: Criar policies novamente
CREATE POLICY "Admin pode gerenciar tutorial_videos"
ON tutorial_videos
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'admin'
  )
);

CREATE POLICY "Revendedoras podem ver tutorial_videos ativos"
ON tutorial_videos
FOR SELECT
TO authenticated
USING (
  ativo = true
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'revendedora'
  )
);

CREATE POLICY "Franqueadas podem ver tutorial_videos ativos"
ON tutorial_videos
FOR SELECT
TO authenticated
USING (
  ativo = true
  AND EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.raw_user_meta_data->>'role' = 'franqueada'
  )
);

-- PASSO 6: Criar/substituir função e trigger
CREATE OR REPLACE FUNCTION update_tutorial_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tutorial_videos_updated_at ON tutorial_videos;

CREATE TRIGGER tutorial_videos_updated_at
  BEFORE UPDATE ON tutorial_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_tutorial_videos_updated_at();

-- VERIFICAR
SELECT 'Tutorial videos table ready!' as status;
SELECT COUNT(*) as total_videos FROM tutorial_videos;
