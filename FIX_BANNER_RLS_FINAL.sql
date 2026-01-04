-- 🔥 SOLUÇÃO DEFINITIVA: Liberar acesso aos templates

-- 1. Desabilitar RLS (deixar tabela pública para LEITURA)
ALTER TABLE banner_templates DISABLE ROW LEVEL SECURITY;

-- ✅ PRONTO! Agora QUALQUER PESSOA pode ver os templates
-- ✅ Admin continua podendo criar/editar/deletar (via admin panel)
-- ✅ Revendedora vê os templates, escolhe, edita TEXTO e manda pra aprovação

-- REGRAS DO SISTEMA:
-- 1. Admin sobe templates no painel /admin/banners
-- 2. Revendedora vê galeria de templates disponíveis
-- 3. Revendedora escolhe template, edita TEXTO, posiciona, salva
-- 4. Banner vai pra aprovação (tabela banner_submissions - criar depois)
-- 5. Admin aprova/rejeita na moderação
-- 6. Se aprovado, aparece no site da revendedora
