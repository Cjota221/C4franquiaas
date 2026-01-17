# Aplicar Migration 067 - Pedido Mínimo

Execute no Supabase SQL Editor:

```sql
-- ============================================================================
-- Migration 067: Configuração de Pedido Mínimo para Revendedoras
-- ============================================================================
-- Description: Adiciona campos para configurar pedido mínimo por valor ou quantidade
-- Date: 2026-01-17

-- STEP 1: Adicionar campos de pedido mínimo na tabela resellers
ALTER TABLE resellers
ADD COLUMN IF NOT EXISTS min_order_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_order_type TEXT DEFAULT 'value' CHECK (min_order_type IN ('value', 'quantity', 'both')),
ADD COLUMN IF NOT EXISTS min_order_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_order_quantity INTEGER DEFAULT 0;

-- STEP 2: Criar índice para consultas
CREATE INDEX IF NOT EXISTS idx_resellers_min_order ON resellers(min_order_enabled) WHERE min_order_enabled = true;

-- STEP 3: Comentários para documentação
COMMENT ON COLUMN resellers.min_order_enabled IS 'Habilita/desabilita pedido mínimo';
COMMENT ON COLUMN resellers.min_order_type IS 'Tipo de pedido mínimo: value (valor), quantity (quantidade) ou both (ambos)';
COMMENT ON COLUMN resellers.min_order_value IS 'Valor mínimo do pedido em R$';
COMMENT ON COLUMN resellers.min_order_quantity IS 'Quantidade mínima de peças';
```

## ✅ O que foi implementado:

### 1. **Painel da Revendedora** (`/revendedora/configuracoes`)

- Nova seção "Pedido Mínimo" com toggle para ativar/desativar
- Opções de tipo: Por Valor, Por Quantidade ou Ambos
- Campos para definir valores
- Preview da mensagem que aparecerá para clientes

### 2. **Site do Catálogo** (`/site/[slug]`)

- Validação de pedido mínimo no carrinho
- Alerta visual quando não atinge o mínimo
- Barra de progresso mostrando quanto falta
- Botão de finalização desabilitado até atingir o mínimo

### 3. **Opções disponíveis:**

- **Por Valor**: Ex: "Pedido mínimo de R$ 150,00"
- **Por Quantidade**: Ex: "Pedido mínimo de 2 peças"
- **Ambos**: Precisa atingir tanto valor quanto quantidade
