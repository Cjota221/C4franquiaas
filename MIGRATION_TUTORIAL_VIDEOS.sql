-- ============================================================================
-- MIGRATION: TUTORIAL VIDEOS - Sistema de Vídeos Tutoriais
-- ============================================================================
-- Este script cria a tabela para vídeos tutoriais que aparecem nas páginas

-- PASSO 1: Criar tabela tutorial_videos
CREATE TABLE IF NOT EXISTS tutorial_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  video_url TEXT NOT NULL, -- URL do YouTube, Vimeo, etc
  pagina TEXT NOT NULL, -- 'produtos', 'carrinhos', 'promocoes', 'personalizacao', 'configuracoes'
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PASSO 2: Criar índices
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_pagina ON tutorial_videos(pagina);
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_ativo ON tutorial_videos(ativo);
CREATE INDEX IF NOT EXISTS idx_tutorial_videos_ordem ON tutorial_videos(ordem);

-- PASSO 3: Habilitar RLS
ALTER TABLE tutorial_videos ENABLE ROW LEVEL SECURITY;

-- PASSO 4: Políticas RLS

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

-- PASSO 5: Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_tutorial_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tutorial_videos_updated_at
  BEFORE UPDATE ON tutorial_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_tutorial_videos_updated_at();

-- PASSO 6: Dados de exemplo (OPCIONAL - comentar se não quiser)
-- INSERT INTO tutorial_videos (titulo, descricao, video_url, pagina, ativo, ordem) VALUES
-- ('Como Ativar Produtos', 'Aprenda a ativar e gerenciar produtos no seu catálogo', 'https://www.youtube.com/embed/VIDEO_ID_1', 'produtos', true, 1),
-- ('Configurar Promoções', 'Tutorial completo sobre como criar promoções', 'https://www.youtube.com/embed/VIDEO_ID_2', 'promocoes', true, 1),
-- ('Personalizar Loja', 'Personalize cores, logo e banners da sua loja', 'https://www.youtube.com/embed/VIDEO_ID_3', 'personalizacao', true, 1);

-- VERIFICAR
SELECT * FROM tutorial_videos ORDER BY pagina, ordem;
