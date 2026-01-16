-- ============================================================================
-- CRIAR BUCKET E ESTRUTURA PARA C4 REELS (Vídeos de Produto)
-- Execute no SQL Editor do Supabase
-- ============================================================================

-- 1. CRIAR BUCKET para vídeos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'videos',
  'videos',
  true,
  31457280, -- 30MB em bytes
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 31457280,
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/quicktime'];

-- 2. POLÍTICAS RLS para o bucket videos
-- Permitir leitura pública
CREATE POLICY "Vídeos públicos para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Permitir upload para usuários autenticados
CREATE POLICY "Upload de vídeos para autenticados"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'videos' 
  AND auth.role() = 'authenticated'
);

-- Permitir delete para autenticados (donos ou admins)
CREATE POLICY "Delete de vídeos para autenticados"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'videos' 
  AND auth.role() = 'authenticated'
);

-- 3. ADICIONAR CAMPOS na tabela produtos
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS video_thumbnail TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS video_duration INTEGER DEFAULT NULL; -- duração em segundos

-- 4. CRIAR TABELA para Reels (vídeos independentes de produto)
CREATE TABLE IF NOT EXISTS reels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Vínculo (opcional - pode ser reel sem produto)
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  reseller_id UUID REFERENCES resellers(id) ON DELETE CASCADE,
  
  -- Mídia
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration INTEGER, -- segundos
  
  -- Metadados
  titulo TEXT,
  descricao TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false, -- Destaque na home
  
  -- Analytics
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_reels_produto ON reels(produto_id);
CREATE INDEX IF NOT EXISTS idx_reels_reseller ON reels(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reels_featured ON reels(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_reels_active ON reels(is_active) WHERE is_active = true;

-- RLS para reels
ALTER TABLE reels ENABLE ROW LEVEL SECURITY;

-- Leitura pública de reels ativos
CREATE POLICY "Reels ativos são públicos"
ON reels FOR SELECT
USING (is_active = true);

-- CRUD para donos
CREATE POLICY "Revendedoras gerenciam seus reels"
ON reels FOR ALL
USING (reseller_id = auth.uid())
WITH CHECK (reseller_id = auth.uid());

-- 5. FUNÇÃO para incrementar views
CREATE OR REPLACE FUNCTION increment_reel_views(reel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE reels SET views = views + 1 WHERE id = reel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. TRIGGER para updated_at
CREATE OR REPLACE FUNCTION update_reels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_reels_updated_at ON reels;
CREATE TRIGGER trg_reels_updated_at
  BEFORE UPDATE ON reels
  FOR EACH ROW
  EXECUTE FUNCTION update_reels_updated_at();

-- ============================================================================
-- VERIFICAR
-- ============================================================================
SELECT 'Bucket videos criado' AS status, EXISTS(SELECT 1 FROM storage.buckets WHERE id = 'videos') AS existe;
SELECT 'Tabela reels criada' AS status, EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'reels') AS existe;
SELECT 'Campo video_url em produtos' AS status, EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'produtos' AND column_name = 'video_url') AS existe;
