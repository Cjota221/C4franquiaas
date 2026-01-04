-- Criar tabela de templates de banners para admin gerenciar
CREATE TABLE IF NOT EXISTS banner_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  desktop_url TEXT NOT NULL,
  mobile_url TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_banner_templates_ativo ON banner_templates(ativo);
CREATE INDEX idx_banner_templates_ordem ON banner_templates(ordem);

-- RLS Policies
ALTER TABLE banner_templates ENABLE ROW LEVEL SECURITY;

-- Admin pode fazer tudo
CREATE POLICY "Admin pode gerenciar banner_templates"
  ON banner_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Revendedoras podem apenas ler banners ativos
CREATE POLICY "Revendedoras podem ver banner_templates ativos"
  ON banner_templates
  FOR SELECT
  TO authenticated
  USING (
    ativo = true
    AND EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND raw_user_meta_data->>'role' = 'revendedora'
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_banner_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_banner_templates_updated_at
  BEFORE UPDATE ON banner_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_banner_templates_updated_at();

-- Comentários
COMMENT ON TABLE banner_templates IS 'Templates de banners pré-definidos gerenciados pelo admin';
COMMENT ON COLUMN banner_templates.nome IS 'Nome identificador do banner';
COMMENT ON COLUMN banner_templates.desktop_url IS 'URL da imagem desktop no Supabase Storage';
COMMENT ON COLUMN banner_templates.mobile_url IS 'URL da imagem mobile no Supabase Storage';
COMMENT ON COLUMN banner_templates.ativo IS 'Se o banner está disponível para revendedoras';
COMMENT ON COLUMN banner_templates.ordem IS 'Ordem de exibição na galeria';
