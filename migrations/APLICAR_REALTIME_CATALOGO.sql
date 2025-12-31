-- ============================================
-- 🔥 ATIVAR REALTIME PARA CATÁLOGO
-- ============================================
-- PROBLEMA: Estoque atualiza no admin mas não nos sites públicos
-- SOLUÇÃO: Ativar Supabase Realtime para sincronização automática
--
-- APLICAR: Copie este SQL e cole no Supabase SQL Editor
-- ============================================

-- 1️⃣ Habilitar Realtime na tabela produtos
ALTER PUBLICATION supabase_realtime ADD TABLE produtos;

-- 2️⃣ Verificar se foi aplicado corretamente
SELECT 
  schemaname,
  tablename,
  pubname
FROM 
  pg_publication_tables
WHERE 
  tablename = 'produtos'
  AND pubname = 'supabase_realtime';

-- ✅ Sucesso se retornar:
-- schemaname | tablename | pubname
-- -----------+-----------+-------------------
-- public     | produtos  | supabase_realtime

-- 📝 NOTAS:
-- - Após aplicar, os catálogos públicos receberão atualizações em tempo real
-- - Quando o estoque mudar, o site atualiza automaticamente
-- - Sem necessidade de recarregar a página
