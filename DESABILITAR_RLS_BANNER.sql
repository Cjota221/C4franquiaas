-- ⚠️ SOLUÇÃO EMERGENCIAL: Desabilitar RLS na tabela banner_templates
-- Use isso APENAS para testar se o sistema funciona

ALTER TABLE banner_templates DISABLE ROW LEVEL SECURITY;

-- ⚠️ ATENÇÃO: Isso deixa a tabela PÚBLICA (qualquer pessoa pode ler)
-- Depois de testar, reabilite com:
-- ALTER TABLE banner_templates ENABLE ROW LEVEL SECURITY;
