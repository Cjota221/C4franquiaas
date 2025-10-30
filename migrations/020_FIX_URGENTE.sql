-- 🚨 FIX URGENTE - Rode isso NO SUPABASE SQL EDITOR AGORA! 🚨
-- Copie e cole TODO este arquivo no Supabase SQL Editor e clique em RUN

-- 1. Tornar franqueada_id NULLABLE (permitir NULL)
ALTER TABLE public.vendas 
  ALTER COLUMN franqueada_id DROP NOT NULL;

-- 2. Remover políticas antigas
DROP POLICY IF EXISTS "Usuários podem criar vendas" ON public.vendas;
DROP POLICY IF EXISTS "Clientes podem criar vendas" ON public.vendas;

-- 3. Criar nova política permitindo usuários anônimos (anon) E autenticados
CREATE POLICY "Clientes podem criar vendas"
  ON public.vendas
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ✅ PRONTO! Agora teste fazer um pedido novamente.
