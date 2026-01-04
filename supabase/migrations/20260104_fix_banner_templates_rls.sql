-- Dropar policies antigas que dependem de raw_user_meta_data->>'role'
DROP POLICY IF EXISTS "Admin pode gerenciar banner_templates" ON banner_templates;
DROP POLICY IF EXISTS "Revendedoras podem ver banner_templates ativos" ON banner_templates;

-- Nova policy para admin usando is_admin()
CREATE POLICY "Admin pode gerenciar banner_templates"
  ON banner_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'carol@c4franquias.com.br'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'carol@c4franquias.com.br'
    )
  );

-- Nova policy para revendedoras usando a tabela resellers
CREATE POLICY "Revendedoras podem ver banner_templates ativos"
  ON banner_templates
  FOR SELECT
  TO authenticated
  USING (
    ativo = true
    AND EXISTS (
      SELECT 1 FROM resellers
      WHERE resellers.user_id = auth.uid()
    )
  );

-- Comentário
COMMENT ON POLICY "Revendedoras podem ver banner_templates ativos" ON banner_templates IS 
  'Permite revendedoras autenticadas (que existem na tabela revendedoras) verem apenas banners ativos';
