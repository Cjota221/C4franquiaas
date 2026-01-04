-- ============================================================================
-- EXECUTAR NO SUPABASE SQL EDITOR - CRIAR TABELA + BUCKET TUTORIAIS
-- ============================================================================

-- PARTE 1: CRIAR TABELA tutorial_videos
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

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_pagina ON tutorial_videos(pagina);
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_ativo ON tutorial_videos(ativo);
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_ordem ON tutorial_videos(ordem);

-- Habilitar RLS
ALTER TABLE tutorial_videos ENABLE ROW LEVEL SECURITY;

-- Dropar policies antigas
DROP POLICY IF EXISTS "Admin pode gerenciar tutorial_videos" ON tutorial_videos;
DROP POLICY IF EXISTS "Revendedoras podem ver tutorial_videos ativos" ON tutorial_videos;
DROP POLICY IF EXISTS "Franqueadas podem ver tutorial_videos ativos" ON tutorial_videos;

-- Criar policies
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

-- Criar função e trigger
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

-- ============================================================================
-- PARTE 2: CRIAR BUCKET tutorial-videos
-- ============================================================================

-- Criar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('tutorial-videos', 'tutorial-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Dropar policies antigas do bucket
DROP POLICY IF EXISTS "Usuários podem fazer upload de vídeos tutoriais" ON storage.objects;
DROP POLICY IF EXISTS "Vídeos tutoriais são públicos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar seus vídeos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar seus vídeos" ON storage.objects;

-- Policy: Admin pode fazer upload
CREATE POLICY "Usuários podem fazer upload de vídeos tutoriais"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tutorial-videos'
  AND (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
);

-- Policy: Acesso público para leitura
CREATE POLICY "Vídeos tutoriais são públicos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'tutorial-videos');

-- Policy: Admin pode atualizar
CREATE POLICY "Usuários podem atualizar seus vídeos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tutorial-videos'
  AND (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
);

-- Policy: Admin pode deletar
CREATE POLICY "Usuários podem deletar seus vídeos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tutorial-videos'
  AND (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
);

-- ============================================================================
-- VERIFICAR
-- ============================================================================

SELECT 'Tutorial videos table ready!' as status;
SELECT COUNT(*) as total_videos FROM tutorial_videos;
SELECT id, name, public FROM storage.buckets WHERE id = 'tutorial-videos';
