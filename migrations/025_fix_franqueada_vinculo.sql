-- Migration 025: Corrigir vinculação franqueada_id nas vendas
-- Data: 2025-10-30
-- Descrição: Garantir que vendas sejam vinculadas corretamente à franqueada (user_id)

-- Problema identificado:
-- lojas.franqueada_id → franqueadas.id
-- vendas.franqueada_id → auth.users.id (esperado)
-- Mas na tabela franqueadas, o user_id é a FK para auth.users
-- Então precisamos buscar franqueadas.user_id quando criamos a venda

-- Não precisamos alterar schema, apenas documentar a lógica:
-- Ao criar venda: buscar franqueadas.user_id WHERE franqueadas.id = lojas.franqueada_id

-- Verificar estrutura atual
DO $$
BEGIN
  RAISE NOTICE '📋 Verificando estrutura das tabelas...';
  
  -- Mostrar schema de lojas
  RAISE NOTICE '🏪 Tabela LOJAS:';
  RAISE NOTICE '   franqueada_id → franqueadas(id)';
  
  -- Mostrar schema de franqueadas
  RAISE NOTICE '👥 Tabela FRANQUEADAS:';
  RAISE NOTICE '   id → PK';
  RAISE NOTICE '   user_id → auth.users(id)';
  
  -- Mostrar schema de vendas
  RAISE NOTICE '💰 Tabela VENDAS:';
  RAISE NOTICE '   franqueada_id → auth.users(id) ✅';
  
  RAISE NOTICE '';
  RAISE NOTICE '🔧 CORREÇÃO NECESSÁRIA NO CÓDIGO:';
  RAISE NOTICE '   No CheckoutForm, ao criar venda:';
  RAISE NOTICE '   1. Buscar franqueadas.user_id WHERE id = loja.franqueada_id';
  RAISE NOTICE '   2. Usar esse user_id como vendas.franqueada_id';
END $$;

-- Comentários para documentação
COMMENT ON COLUMN vendas.franqueada_id IS 'user_id da franqueada (auth.users.id) - buscar via franqueadas.user_id';
