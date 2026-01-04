-- VERSÃO ULTRA SIMPLES: Sem foreign keys complexas

-- 1. Criar tabela (versão simplificada)
CREATE TABLE banner_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  template_id UUID NOT NULL,
  
  -- Textos
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  texto_adicional TEXT,
  
  -- Estilização
  font_family TEXT NOT NULL,
  text_color TEXT NOT NULL DEFAULT '#FFFFFF',
  
  -- Posicionamento Desktop
  desktop_position_x INTEGER NOT NULL,
  desktop_position_y INTEGER NOT NULL,
  desktop_alignment TEXT NOT NULL,
  desktop_font_size INTEGER NOT NULL DEFAULT 100,
  
  -- Posicionamento Mobile
  mobile_position_x INTEGER NOT NULL,
  mobile_position_y INTEGER NOT NULL,
  mobile_alignment TEXT NOT NULL,
  mobile_font_size INTEGER NOT NULL DEFAULT 100,
  
  -- Espaçamentos
  line_spacing INTEGER NOT NULL DEFAULT 4,
  letter_spacing INTEGER NOT NULL DEFAULT 0,
  
  -- Status e URLs
  status TEXT NOT NULL DEFAULT 'pending',
  desktop_final_url TEXT,
  mobile_final_url TEXT,
  rejection_reason TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID
);

-- 2. Criar índices
CREATE INDEX idx_banner_submissions_user ON banner_submissions(user_id);
CREATE INDEX idx_banner_submissions_status ON banner_submissions(status);
CREATE INDEX idx_banner_submissions_template ON banner_submissions(template_id);
CREATE INDEX idx_banner_submissions_created ON banner_submissions(created_at DESC);

-- 3. Criar função trigger
CREATE OR REPLACE FUNCTION update_banner_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar trigger
CREATE TRIGGER update_banner_submissions_updated_at
  BEFORE UPDATE ON banner_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_banner_submissions_updated_at();

-- 5. Desabilitar RLS
ALTER TABLE banner_submissions DISABLE ROW LEVEL SECURITY;
