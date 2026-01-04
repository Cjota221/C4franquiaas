-- ============================================================================
-- MIGRATION: TUTORIAL VIDEOS - Sistema de Vídeos Tutoriais (VERSÃO SEGURA)
-- ============================================================================
-- Esta versão verifica se já existe antes de criar

-- PASSO 1: Criar tabela tutorial_videos (se não existir)
CREATE TABLE IF NOT EXISTS tutorial_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  video_url TEXT NOT NULL,
  pagina TEXT NOT NULL CHECK (pagina IN ('produtos', 'carrinhos', 'promocoes', 'personalizacao', 'configuracoes')),
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASSO 2: Criar índices (se não existirem)
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_pagina ON tutorial_videos(pagina);
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_ativo ON tutorial_videos(ativo);
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_ordem ON tutorial_videos(ordem);

-- PASSO 3: Habilitar RLS (ignora se já está ativo)
ALTER TABLE tutorial_videos ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Dropar políticas existentes antes de recriar
DROP POLICY IF EXISTS "Admin pode gerenciar tutorial_videos" ON tutorial_videos;
DROP POLICY IF EXISTS "Revendedoras podem ver tutorial_videos ativos" ON tutorial_videos;
DROP POLICY IF EXISTS "Franqueadas podem ver tutorial_videos ativos" ON tutorial_videos;

-- PASSO 5: Criar políticas RLS

-- Admin pode fazer tudo
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

-- Revendedoras podem apenas ver vídeos ativos
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

-- Franqueadas podem apenas ver vídeos ativos
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

-- PASSO 6: Criar função de trigger (substitui se existir)
CREATE OR REPLACE FUNCTION update_tutorial_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASSO 7: Dropar trigger antigo e criar novo
DROP TRIGGER IF EXISTS tutorial_videos_updated_at ON tutorial_videos;

CREATE TRIGGER tutorial_videos_updated_at
  BEFORE UPDATE ON tutorial_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_tutorial_videos_updated_at();

-- PASSO 8: VERIFICAR
SELECT 
  'Tabela criada' as status,
  COUNT(*) as total_videos
FROM tutorial_videos;

-- Verificar políticas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'tutorial_videos'
ORDER BY policyname;
