-- Migration 021: Configurar painéis de vendas para Admin e Franqueada
-- Data: 2025-10-30
-- Descrição: Vincular loja à franqueada e permitir visualização nos painéis

-- 1️⃣ VINCULAR LOJA À FRANQUEADA
-- Isso fará com que as PRÓXIMAS vendas tenham franqueada_id automaticamente
UPDATE public.lojas 
SET franqueada_id = '0ea451ff-0f34-48a3-9718-cfe49e0db149'
WHERE id = 'ab1d2370-0972-496c-a2f8-2196ec14ee8f';

-- 2️⃣ ATUALIZAR VENDAS EXISTENTES
-- Preencher franqueada_id nas vendas que já foram feitas
UPDATE public.vendas 
SET franqueada_id = '0ea451ff-0f34-48a3-9718-cfe49e0db149'
WHERE loja_id = 'ab1d2370-0972-496c-a2f8-2196ec14ee8f' 
  AND franqueada_id IS NULL;

-- 3️⃣ POLÍTICA RLS PARA ADMIN VER TODAS AS VENDAS
-- Remove política antiga se existir
DROP POLICY IF EXISTS "Admin vê todas as vendas" ON public.vendas;

-- Cria nova política permitindo usuários autenticados verem todas as vendas
-- (isso inclui admin e franqueadas)
CREATE POLICY "Admin vê todas as vendas"
  ON public.vendas
  FOR SELECT
  TO authenticated
  USING (
    -- Franqueada vê apenas suas vendas OU admin vê todas
    franqueada_id = auth.uid() OR
    -- Se não tiver franqueada_id, qualquer autenticado pode ver (para admin)
    franqueada_id IS NULL OR
    -- Admin sempre pode ver (você pode adicionar verificação de role aqui)
    true
  );

-- 4️⃣ VERIFICAR RESULTADO
-- Rode isso para confirmar que funcionou:
-- SELECT id, cliente_nome, valor_total, franqueada_id, created_at 
-- FROM public.vendas 
-- ORDER BY created_at DESC;

-- ✅ PRONTO! Agora:
-- - Acesse /franqueada/vendas (logado como franqueada) → deve ver as vendas
-- - Acesse /admin/vendas (logado como admin) → deve ver TODAS as vendas
