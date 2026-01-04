-- Tabela para armazenar os banners personalizados das revendedoras
CREATE TABLE IF NOT EXISTS banner_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES banner_templates(id) ON DELETE CASCADE,
  
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
  desktop_alignment TEXT NOT NULL CHECK (desktop_alignment IN ('left', 'center', 'right')),
  desktop_font_size INTEGER NOT NULL DEFAULT 100,
  
  -- Posicionamento Mobile
  mobile_position_x INTEGER NOT NULL,
  mobile_position_y INTEGER NOT NULL,
  mobile_alignment TEXT NOT NULL CHECK (mobile_alignment IN ('left', 'center', 'right')),
  mobile_font_size INTEGER NOT NULL DEFAULT 100,
  
  -- Espaçamentos
  line_spacing INTEGER NOT NULL DEFAULT 4,
  letter_spacing INTEGER NOT NULL DEFAULT 0,
  
  -- Status e URLs
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  desktop_final_url TEXT, -- URL do banner desktop final gerado
  mobile_final_url TEXT,   -- URL do banner mobile final gerado
  rejection_reason TEXT,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id)
);

-- Índices para performance
CREATE INDEX idx_banner_submissions_user ON banner_submissions(user_id);
CREATE INDEX idx_banner_submissions_status ON banner_submissions(status);
CREATE INDEX idx_banner_submissions_template ON banner_submissions(template_id);
CREATE INDEX idx_banner_submissions_created ON banner_submissions(created_at DESC);

-- RLS Policies
ALTER TABLE banner_submissions ENABLE ROW LEVEL SECURITY;

-- Revendedoras podem ver e criar seus próprios banners
CREATE POLICY "Revendedoras podem ver seus banners"
  ON banner_submissions
  FOR SELECT
  USING (auth.uid() = banner_submissions.user_id);

CREATE POLICY "Revendedoras podem criar banners"
  ON banner_submissions
  FOR INSERT
  WITH CHECK (auth.uid() = banner_submissions.user_id);

CREATE POLICY "Revendedoras podem atualizar seus banners pending"
  ON banner_submissions
  FOR UPDATE
  USING (auth.uid() = banner_submissions.user_id AND banner_submissions.status = 'pending');

-- Admins podem ver e gerenciar todos os banners
CREATE POLICY "Admins podem ver todos os banners"
  ON banner_submissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins podem atualizar status dos banners"
  ON banner_submissions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_banner_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_banner_submissions_updated_at
  BEFORE UPDATE ON banner_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_banner_submissions_updated_at();

-- Comentários
COMMENT ON TABLE banner_submissions IS 'Banners personalizados criados pelas revendedoras aguardando aprovação';
COMMENT ON COLUMN banner_submissions.status IS 'pending: aguardando aprovação, approved: aprovado, rejected: rejeitado';
COMMENT ON COLUMN banner_submissions.desktop_final_url IS 'URL do banner desktop final gerado após aprovação (sem fundo no texto)';
COMMENT ON COLUMN banner_submissions.mobile_final_url IS 'URL do banner mobile final gerado após aprovação (sem fundo no texto)';
