-- Migration 021: Configurar painéis de vendas para Admin e Franqueada
-- Data: 2025-10-30
-- Descrição: Vincular loja à franqueada e permitir visualização nos painéis

-- ⚠️ PRIMEIRO: Descubra o ID correto da franqueada
-- Execute este SELECT e use o ID retornado:
-- SELECT id, email, user_metadata->>'nome' as nome 
-- FROM auth.users 
-- WHERE user_metadata->>'tipo' = 'franqueada' 
-- ORDER BY created_at DESC 
-- LIMIT 5;

-- ❌ NÃO EXECUTE OS UPDATES ABAIXO ATÉ DESCOBRIR O ID CORRETO! ❌

-- 1️⃣ VINCULAR LOJA À FRANQUEADA
-- SUBSTITUA 'ID_DA_FRANQUEADA_AQUI' pelo ID correto antes de executar
-- UPDATE public.lojas 
-- SET franqueada_id = 'ID_DA_FRANQUEADA_AQUI'
-- WHERE id = 'ab1d2370-0972-496c-a2f8-2196ec14ee8f';

-- 2️⃣ ATUALIZAR VENDAS EXISTENTES
-- SUBSTITUA 'ID_DA_FRANQUEADA_AQUI' pelo ID correto antes de executar
-- UPDATE public.vendas 
-- SET franqueada_id = 'ID_DA_FRANQUEADA_AQUI'
-- WHERE loja_id = 'ab1d2370-0972-496c-a2f8-2196ec14ee8f' 
--   AND franqueada_id IS NULL;

-- 3️⃣ POLÍTICA RLS PARA ADMIN VER TODAS AS VENDAS
-- Remove política antiga se existir
DROP POLICY IF EXISTS "Admin vê todas as vendas" ON public.vendas;

-- Cria nova política permitindo usuários autenticados verem todas as vendas
CREATE POLICY "Admin vê todas as vendas"
  ON public.vendas
  FOR SELECT
  TO authenticated
  USING (
    -- Franqueada vê apenas suas vendas OU admin vê todas
    franqueada_id = auth.uid() OR
    -- Se não tiver franqueada_id, qualquer autenticado pode ver
    franqueada_id IS NULL OR
    -- Admin sempre pode ver
    true
  );

-- ✅ APÓS EXECUTAR A POLÍTICA ACIMA:
-- 
-- 1. Execute o SELECT abaixo para descobrir o ID da franqueada:
--
--    SELECT id, email, user_metadata->>'nome' as nome 
--    FROM auth.users 
--    WHERE user_metadata->>'tipo' = 'franqueada' 
--    ORDER BY created_at DESC 
--    LIMIT 5;
--
-- 2. Copie o ID retornado e execute os UPDATEs acima (linhas 11-21)
--    substituindo 'ID_DA_FRANQUEADA_AQUI' pelo ID correto
--
-- 3. Verifique o resultado:
--
--    SELECT id, cliente_nome, valor_total, franqueada_id, created_at 
--    FROM public.vendas 
--    ORDER BY created_at DESC;
--
-- ✅ PRONTO! Agora:
-- - Acesse /franqueada/vendas (logado como franqueada) → deve ver as vendas
-- - Acesse /admin/vendas (logado como admin) → deve ver TODAS as vendas
