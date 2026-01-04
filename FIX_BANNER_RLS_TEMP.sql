-- 🚀 SOLUÇÃO TEMPORÁRIA: Permitir qualquer usuário autenticado ver banners ativos
-- (Use isso apenas para testar se o sistema funciona)

-- Dropar policy atual
DROP POLICY IF EXISTS "Revendedoras podem ver banner_templates ativos" ON banner_templates;

-- Criar policy TEMPORÁRIA sem verificar tabela resellers
CREATE POLICY "Revendedoras podem ver banner_templates ativos"
  ON banner_templates
  FOR SELECT
  TO authenticated
  USING (ativo = true);

-- ⚠️ ATENÇÃO: Esta policy permite QUALQUER usuário autenticado ver os banners
-- Depois de testar, você pode voltar para a policy mais restritiva
