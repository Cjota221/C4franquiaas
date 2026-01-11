# 📊 RELATÓRIO TÉCNICO: ANÁLISE COMPLETA DO SISTEMA DE PRODUTOS C4

**Data:** 10 de Janeiro de 2026  
**Versão:** 1.0  
**Status:** Análise técnica para revisão

---

## 📋 ÍNDICE

1. [Mapa Geral de Entidades e Tabelas](#1-mapa-geral-de-entidades-e-tabelas)
2. [Fluxo do Produto no Painel Admin](#2-fluxo-do-produto-no-painel-admin)
3. [Fluxo do Produto para Revendedoras/Franqueadas](#3-fluxo-do-produto-para-revendedorasfranqueadas)
4. [Webhooks, Integrações e Eventos](#4-webhooks-integrações-e-eventos)
5. [Pontos Cegos e Problemas Identificados](#5-pontos-cegos-e-problemas-identificados)
6. [Sugestões de Melhoria](#6-sugestões-de-melhoria)

---

## 1. MAPA GERAL DE ENTIDADES E TABELAS

### 1.1 Tabela Principal: `produtos`

**Propósito:** Armazena todos os produtos do catálogo central (fonte única de verdade para produtos).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `id_externo` | TEXT | ID do FácilZap (integração) |
| `nome` | TEXT | Nome do produto |
| `preco_base` | DECIMAL | Preço base definido pelo admin |
| `estoque` | INTEGER | Soma total de estoque (todas variações) |
| `ativo` | BOOLEAN | Se produto está ativo no admin |
| `desativado_manual` | BOOLEAN | Se foi desativado manualmente |
| `imagem` | TEXT | URL da imagem principal |
| `imagens` | TEXT[] | Array de URLs de imagens |
| `variacoes_meta` | JSONB | Array de variações (tamanhos, SKU, estoque por variação) |
| `codigo_barras` | TEXT | Código de barras |
| `description` | TEXT | Descrição do produto |
| `size_guide` | JSONB | Guia de tamanhos |
| `categorias` | TEXT | Categorias (formato legado) |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `ultima_sincronizacao` | TIMESTAMPTZ | Última sync com FácilZap |
| `admin_aprovado` | BOOLEAN | Se foi aprovado pelo admin |
| `admin_rejeitado` | BOOLEAN | Se foi rejeitado pelo admin |
| `admin_data_aprovacao` | TIMESTAMPTZ | Data de aprovação |
| `admin_aprovado_por` | UUID | ID do admin que aprovou |
| `admin_notas` | TEXT | Notas do admin |
| `eh_produto_novo` | BOOLEAN | Se é produto novo |

**Estrutura de `variacoes_meta`:**
```json
[
  {
    "id": "v1",
    "sku": "FLV-34-PRE",
    "nome": "34",
    "estoque": 5,
    "codigo_barras": "7891234567890"
  },
  {
    "id": "v2",
    "sku": "FLV-37-PRE",
    "nome": "37",
    "estoque": 0,
    "codigo_barras": "7891234567891"
  }
]
```

---

### 1.2 Tabela: `reseller_products` (Vinculação Produto ↔ Revendedora)

**Propósito:** Junction table que relaciona produtos às revendedoras, com configurações específicas por revendedora.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `reseller_id` | UUID | FK para `resellers` |
| `product_id` | UUID | FK para `produtos` |
| `is_active` | BOOLEAN | Se produto está ativo NA LOJA DA REVENDEDORA |
| `margin_percent` | DECIMAL(5,2) | Percentual de margem de lucro |
| `custom_price` | DECIMAL(10,2) | Preço customizado (alternativa à margem) |
| `display_order` | INTEGER | Ordem de exibição |
| `vista_pela_franqueada` | BOOLEAN | Se revendedora já viu o produto |
| `data_ativacao` | TIMESTAMPTZ | Quando foi ativado |
| `created_at` | TIMESTAMPTZ | Data de criação |
| `updated_at` | TIMESTAMPTZ | Data de atualização |

**Constraint:** `UNIQUE(reseller_id, product_id)`

---

### 1.3 Tabela: `produtos_franqueadas` (Sistema Legado - Franqueadas PRO)

**Propósito:** Vinculação de produtos para franqueadas no sistema antigo/PRO.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `produto_id` | INTEGER | FK para `produtos` (⚠️ INTEGER, não UUID!) |
| `franqueada_id` | UUID | FK para `franqueadas` |
| `ativo` | BOOLEAN | Se está ativo |
| `vinculado_em` | TIMESTAMPTZ | Data de vinculação |
| `desvinculado_em` | TIMESTAMPTZ | Data de desvinculação |

**⚠️ PROBLEMA:** Esta tabela usa `produto_id` como INTEGER enquanto a tabela `produtos` usa UUID como PK.

---

### 1.4 Tabela: `produtos_franqueadas_precos` (Preços Customizados - Franqueadas PRO)

**Propósito:** Preços personalizados das franqueadas no sistema legado.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `produto_franqueada_id` | UUID | FK para `produtos_franqueadas` |
| `preco_base` | DECIMAL(10,2) | Preço base do admin |
| `ajuste_tipo` | VARCHAR(20) | 'fixo' ou 'porcentagem' |
| `ajuste_valor` | DECIMAL(10,2) | Valor do ajuste |
| `preco_final` | DECIMAL(10,2) | Preço calculado final |
| `ativo_no_site` | BOOLEAN | Se aparece no site |
| `atualizado_em` | TIMESTAMPTZ | Última atualização |

---

### 1.5 Tabela: `categorias`

**Propósito:** Categorias de produtos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | SERIAL | Identificador único |
| `nome` | TEXT | Nome da categoria |
| `slug` | TEXT | Slug para URL |
| `imagem` | TEXT | URL da imagem |

---

### 1.6 Tabela: `produto_categorias` (Junction)

**Propósito:** Relacionamento N:N entre produtos e categorias.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `produto_id` | UUID | FK para `produtos` |
| `categoria_id` | INTEGER | FK para `categorias` |

---

### 1.7 Tabela: `vendas`

**Propósito:** Registrar vendas/pedidos realizados.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `loja_id` | UUID | FK para `lojas` |
| `franqueada_id` | UUID | FK para `auth.users` (NULLABLE) |
| `items` | JSONB | Array de produtos vendidos |
| `valor_total` | DECIMAL(10,2) | Valor total da venda |
| `comissao_franqueada` | DECIMAL(10,2) | Comissão da franqueada |
| `percentual_comissao` | DECIMAL(5,2) | % de comissão |
| `mp_payment_id` | TEXT | ID do pagamento Mercado Pago |
| `status_pagamento` | TEXT | 'pending', 'approved', 'rejected', 'cancelled' |
| `cliente_nome` | TEXT | Nome do cliente |
| `cliente_email` | TEXT | Email do cliente |
| `endereco_completo` | JSONB | Endereço de entrega |
| `created_at` | TIMESTAMPTZ | Data da venda |

**Estrutura de `items`:**
```json
[
  {
    "id": "uuid-do-produto",
    "nome": "Tênis XYZ",
    "tamanho": "38",
    "sku": "TNS-38-PRE",
    "quantidade": 1,
    "preco": 199.90
  }
]
```

---

### 1.8 Tabela: `lojas`

**Propósito:** Lojas das franqueadas/revendedoras.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `franqueada_id` | UUID | FK para auth.users |
| `nome` | TEXT | Nome da loja |
| `dominio` | TEXT | Subdomínio (slug) |
| `ativo` | BOOLEAN | Se está ativa |
| `margem_padrao` | DECIMAL(5,2) | Margem padrão para novos produtos |

---

### 1.9 Tabela: `resellers` (Revendedoras)

**Propósito:** Cadastro de revendedoras.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | Identificador único |
| `user_id` | UUID | FK para auth.users |
| `name` | TEXT | Nome da revendedora |
| `email` | TEXT | Email |
| `phone` | TEXT | Telefone |
| `store_name` | TEXT | Nome da loja |
| `slug` | TEXT | Slug da loja |
| `status` | TEXT | 'pendente', 'aprovada', 'rejeitada' |
| `is_active` | BOOLEAN | Se está ativa |
| `logo_url` | TEXT | Logo da loja |
| `banner_url` | TEXT | Banner da loja |
| `colors` | JSONB | Cores personalizadas |
| `theme_settings` | JSONB | Configurações de tema |
| `total_products` | INTEGER | Contador de produtos ativos |

---

## 2. FLUXO DO PRODUTO NO PAINEL ADMIN

### 2.1 Como um produto nasce no sistema

#### Origem 1: Sincronização com FácilZap (Fonte Principal)
**Arquivo:** `lib/facilzapClient.ts`, `app/api/sync-produtos/route.ts`

1. **Cron Job** ou **botão manual** dispara sincronização
2. API consulta FácilZap (`GET /api/catalogo/produtos`)
3. Para cada produto:
   - Se não existe: `INSERT` na tabela `produtos`
   - Se existe: `UPDATE` campos (nome, preço, estoque, imagens)
4. **Campo `admin_aprovado` = false** para produtos novos (desde migration 049)
5. **Campo `ativo` = false** até admin aprovar

#### Origem 2: Cadastro Manual (Raro)
**Arquivo:** `app/admin/produtos/page.tsx`

- Admin pode criar produtos manualmente
- Campos obrigatórios: `nome`, `preco_base`
- Estoque pode ser definido manualmente

---

### 2.2 Gestão de Estoque

#### Onde o estoque é armazenado:
1. **Campo `estoque`** na tabela `produtos` - Soma total
2. **Campo `variacoes_meta[].estoque`** - Estoque por variação (tamanho/SKU)

#### Quem atualiza o estoque:

| Evento | Arquivo | Ação |
|--------|---------|------|
| Sync FácilZap | `lib/facilzapClient.ts` | Atualiza estoque do FácilZap |
| Webhook FácilZap | `app/api/webhook/facilzap/route.ts` | Atualiza quando produto muda na origem |
| Pagamento Aprovado | `app/api/webhook/mercadopago/route.ts` | **DÁ BAIXA** no estoque |
| Pagamento Cancelado | `app/api/webhook/mercadopago/route.ts` | **RESTAURA** estoque |
| Cron Estoque | `app/api/cron-estoque/route.ts` | Sincroniza periodicamente |

#### Fluxo de Baixa no Estoque (Pagamento Aprovado):
```
1. Webhook MP recebe evento payment.approved
2. Busca venda pelo mp_payment_id
3. Para cada item da venda:
   a. Busca produto.variacoes
   b. Encontra variação pelo tamanho/SKU
   c. Subtrai quantidade do estoque da variação
   d. Se estoque = 0: desativa produto nas franquias/revendedoras
4. Salva variações atualizadas
```

**⚠️ PROBLEMA IDENTIFICADO:** 
- A baixa de estoque trabalha com campo `variacoes` (não `variacoes_meta`)
- Pode haver inconsistência se o campo correto for `variacoes_meta`

---

### 2.3 Fluxo de Aprovação (Admin → Revendedora)

**Migration:** `049_fluxo_aprovacao_produtos.sql`, `051_produtos_novos_desativados.sql`

```
PRODUTO NOVO (FácilZap)
        │
        ▼
┌──────────────────────┐
│ admin_aprovado=false │  ← Produto pendente
│ ativo=false          │
└──────────────────────┘
        │
        │ Admin APROVA (função aprovar_produtos)
        ▼
┌──────────────────────┐
│ admin_aprovado=true  │
│ ativo=true           │
└──────────────────────┘
        │
        │ Trigger auto-vincula às revendedoras
        ▼
┌──────────────────────────────────────┐
│ reseller_products                     │
│   is_active=false (DESATIVADO)       │  ← Conforme migration 051
│   margin_percent=0 (SEM MARGEM)       │
│   vista_pela_franqueada=false        │
└──────────────────────────────────────┘
        │
        │ Revendedora define margem e ativa
        ▼
┌──────────────────────────────────────┐
│ reseller_products                     │
│   is_active=true                      │
│   margin_percent=30 (exemplo)         │
└──────────────────────────────────────┘
```

---

## 3. FLUXO DO PRODUTO PARA REVENDEDORAS/FRANQUEADAS

### 3.1 Sistema de Revendedoras (Atual - `resellers` + `reseller_products`)

#### Vinculação Automática (Trigger)
**Arquivo:** `migrations/048_auto_vincular_produtos_revendedoras.sql`

```sql
-- Quando produto é ATIVADO no admin:
INSERT INTO reseller_products (
  reseller_id,
  product_id,
  margin_percent,   -- 30 (padrão ANTIGO) ou 0 (migration 051)
  is_active,        -- true (ANTIGO) ou false (migration 051)
  created_at
)
SELECT r.id, NEW.id, 30, true, NOW()  -- ⚠️ CONFLITO!
FROM resellers r
WHERE r.status = 'aprovada' AND r.is_active = true
ON CONFLICT DO UPDATE SET is_active = true;
```

**⚠️ CONFLITO CRÍTICO:**
- Migration `048` define: `margin_percent=30, is_active=true`
- Migration `051` define: `margin_percent=0, is_active=false`
- **Depende de qual trigger está ativo no banco!**

---

#### Painel da Revendedora (`app/revendedora/produtos/page.tsx`)

**O que a revendedora pode fazer:**

1. **Ver produtos vinculados:**
   ```typescript
   // Busca produtos onde reseller_id = meu_id
   const { data: vinculacoes } = await supabase
     .from('reseller_products')
     .select('product_id, margin_percent, is_active')
     .eq('reseller_id', revendedora.id);
   ```

2. **Ativar/Desativar produto:**
   ```typescript
   await supabase
     .from('reseller_products')
     .update({ is_active: !produto.is_active })
     .eq('reseller_id', revendedoraId)
     .eq('product_id', produtoId);
   ```

3. **Definir margem de lucro:**
   ```typescript
   await supabase
     .from('reseller_products')
     .update({ margin_percent: novaMargem })
     .eq('reseller_id', revendedoraId)
     .eq('product_id', produtoId);
   ```

**Cálculo do preço final:**
```typescript
const precoFinal = precoBase * (1 + marginPercent / 100);
```

---

### 3.2 Sistema de Franqueadas PRO (Legado - `produtos_franqueadas` + `produtos_franqueadas_precos`)

**Diferenças do sistema de revendedoras:**

| Aspecto | Revendedoras | Franqueadas PRO |
|---------|--------------|-----------------|
| Tabela vinculação | `reseller_products` | `produtos_franqueadas` |
| Tabela preços | (inline) `margin_percent` | `produtos_franqueadas_precos` |
| Campo ativo | `is_active` | `ativo` + `ativo_no_site` |
| Tipo ajuste | Só percentual | `ajuste_tipo` (fixo/porcentagem) |
| FK produto | UUID | ⚠️ INTEGER |

---

### 3.3 Impacto na Loja Pública

**API:** `app/api/loja/[dominio]/produtos/route.ts`

```typescript
// Busca produtos vinculados à franqueada da loja
let query = supabase
  .from('produtos_franqueadas')  // ⚠️ Usa sistema legado!
  .select(`
    id,
    produto_id,
    produtos:produto_id (id, nome, preco_base, estoque, imagem, imagens, ativo)
  `)
  .eq('franqueada_id', loja.franqueada_id)
  .eq('ativo', true);

// Busca preços personalizados
const { data: precos } = await supabase
  .from('produtos_franqueadas_precos')
  .select('*')
  .in('produto_franqueada_id', vinculacaoIds);

// Calcula preço final
const precoFinal = preco?.preco_final || produto.preco_base;
```

**⚠️ PROBLEMA:** A API da loja usa `produtos_franqueadas` (legado) e não `reseller_products` (novo).

---

## 4. WEBHOOKS, INTEGRAÇÕES E EVENTOS

### 4.1 Webhook Mercado Pago (`app/api/webhook/mercadopago/route.ts`)

**Eventos tratados:**

| Evento | Ação |
|--------|------|
| `payment.approved` | Baixa estoque, atualiza status venda |
| `payment.cancelled` | Restaura estoque |
| `payment.refunded` | Restaura estoque |

**Uso de dados de produto:**
- Busca `venda.items` (JSONB) para obter produtos
- Atualiza `produtos.variacoes` (⚠️ não `variacoes_meta`)
- Se estoque zera: desativa em `reseller_products` e `produtos_franqueadas_precos`

---

### 4.2 Webhook FácilZap (`app/api/webhook/facilzap/route.ts`)

**Eventos tratados:**
- `produto.atualizado` / `product.updated`
- `produto.criado` / `product.created`
- `estoque_atualizado` / `product.stock.updated`
- `pedido.criado` / `order.created`
- `pedido.cancelado` / `order.cancelled`

**Fluxo de estoque:**
```
Pedido criado → Baixa estoque
Pedido cancelado → Devolve estoque
```

---

### 4.3 Integração de Frete (Melhor Envio)

**Configuração:** `migrations/032_dimensoes_padrao.sql`

```sql
-- Dimensões padrão na config_frete_geral
peso_padrao DECIMAL DEFAULT 0.300  -- 300g
altura_padrao DECIMAL DEFAULT 5     -- 5cm
largura_padrao DECIMAL DEFAULT 15   -- 15cm
comprimento_padrao DECIMAL DEFAULT 20 -- 20cm
```

**⚠️ PROBLEMA:** 
- Produtos **NÃO têm campos de peso/dimensões individuais**
- Usa dimensões padrão da config geral
- Pode resultar em cotação de frete incorreta para produtos grandes/pesados

---

### 4.4 Sincronização com FácilZap (`lib/facilzapClient.ts`)

**Fluxo de sync:**
1. Busca produtos da API FácilZap
2. Para cada produto:
   - Upsert em `produtos`
   - Extrai variações e salva em `variacoes_meta`
   - Atualiza estoque total (soma das variações)
3. Se estoque < 0: seta para 0 (proteção)

---

## 5. PONTOS CEGOS E PROBLEMAS IDENTIFICADOS

### 🔴 CRÍTICO

#### 5.1 Dois Sistemas de Vinculação Coexistindo
```
produtos_franqueadas (legado) ← API da loja usa este
reseller_products (novo)      ← Painel revendedora usa este
```
**Risco:** Produto pode estar ativo em um sistema e inativo no outro.

#### 5.2 Conflito entre Migrations 048 e 051
- Migration 048: produtos vinculados com `is_active=true, margin_percent=30`
- Migration 051: produtos vinculados com `is_active=false, margin_percent=0`
- **Resultado:** Comportamento depende de qual trigger está ativo

#### 5.3 Campo variacoes vs variacoes_meta
- Webhook MP usa `produto.variacoes` para baixa de estoque
- Sync FácilZap salva em `variacoes_meta`
- **Risco:** Baixa de estoque pode não funcionar corretamente

#### 5.4 Tipo de ID Inconsistente
- `produtos.id` = UUID
- `produtos_franqueadas.produto_id` = INTEGER
- **Risco:** JOIN pode falhar ou retornar resultados errados

---

### 🟠 IMPORTANTE

#### 5.5 Estoque pode ficar negativo
```typescript
// Em facilzapClient.ts linha 956
if (novoEstoque < 0) {
  // Só loga, não impede
}
```
**Problema:** Sistema permite estoque negativo, causando vendas de produtos indisponíveis.

#### 5.6 Falta de validação de peso/dimensões
- Produtos não têm campos individuais de peso/dimensões
- Frete calculado com valores padrão
- **Risco:** Cliente paga frete errado

#### 5.7 Sem log de alteração de preço/margem
- Não há auditoria de quem alterou preço
- Não há histórico de margens
- **Risco:** Difícil rastrear problemas de precificação

#### 5.8 Filtro "Sem Margem" pode mostrar dados incorretos
Conforme corrigido recentemente, mas ainda há riscos:
- `margin_percent = 0` vs `margin_percent IS NULL`
- `custom_price` não é considerado em alguns lugares

---

### 🟡 ATENÇÃO

#### 5.9 Duplicação de Status de Ativação
```
produtos.ativo                     → Ativo no admin
reseller_products.is_active        → Ativo na revendedora
produtos_franqueadas.ativo         → Ativo na franqueada (legado)
produtos_franqueadas_precos.ativo_no_site → Ativo no site (legado)
```
**Confusão:** 4 flags diferentes para controlar visibilidade.

#### 5.10 Estoque centralizado sem segregação
- Todas as lojas compartilham o mesmo estoque
- Não há reserva de estoque por loja
- **Risco:** Duas lojas vendem o último item simultaneamente

#### 5.11 Falta de tratamento para cancelamento parcial
- Não há lógica para cancelar apenas alguns itens do pedido
- Restauração de estoque é tudo ou nada

---

## 6. SUGESTÕES DE MELHORIA

### 🎯 Prioridade Alta

#### 6.1 Unificar Sistema de Vinculação
**Decisão necessária:** Usar apenas `reseller_products` ou `produtos_franqueadas`.

**Recomendação:**
1. Migrar dados de `produtos_franqueadas` para `reseller_products`
2. Atualizar API da loja para usar `reseller_products`
3. Deprecar tabelas `produtos_franqueadas*`

#### 6.2 Corrigir Campo de Variações
```sql
-- Padronizar nome do campo
ALTER TABLE produtos RENAME COLUMN variacoes TO variacoes_meta;
-- OU
-- Atualizar código para usar variacoes_meta consistentemente
```

#### 6.3 Definir Regra Única de Vinculação
**Proposta:**
```sql
-- Produtos SEMPRE vinculados com:
INSERT INTO reseller_products (
  is_active = false,        -- Revendedora precisa ativar
  margin_percent = NULL,    -- Revendedora precisa definir
  -- OU usar margem_padrao da loja se existir
)
```

---

### 🎯 Prioridade Média

#### 6.4 Adicionar Campos de Peso/Dimensões
```sql
ALTER TABLE produtos ADD COLUMN peso DECIMAL(10,3);
ALTER TABLE produtos ADD COLUMN altura DECIMAL(10,2);
ALTER TABLE produtos ADD COLUMN largura DECIMAL(10,2);
ALTER TABLE produtos ADD COLUMN comprimento DECIMAL(10,2);
```

#### 6.5 Implementar Auditoria de Preços
```sql
CREATE TABLE preco_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID,
  reseller_id UUID,
  margin_percent_anterior DECIMAL,
  margin_percent_novo DECIMAL,
  alterado_por UUID,
  alterado_em TIMESTAMPTZ DEFAULT NOW()
);
```

#### 6.6 Validação de Estoque não-negativo
```sql
ALTER TABLE produtos ADD CONSTRAINT estoque_nao_negativo CHECK (estoque >= 0);

-- Ou trigger para prevenir
CREATE OR REPLACE FUNCTION prevenir_estoque_negativo()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.estoque < 0 THEN
    NEW.estoque := 0;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

### 🎯 Prioridade Baixa

#### 6.7 Simplificar Flags de Status
**Proposta de consolidação:**
- `produtos.ativo` → Disponível para venda (admin)
- `reseller_products.is_active` → Exibido na loja (revendedora)
- Remover outros flags redundantes

#### 6.8 Implementar Reserva de Estoque
- Reservar estoque no checkout (antes do pagamento)
- Liberar após timeout ou cancelamento
- Confirmar baixa após pagamento aprovado

---

## 📊 RESUMO DA ARQUITETURA ATUAL

```
┌─────────────────────────────────────────────────────────────────┐
│                         FACILZAP (ORIGEM)                       │
│                              │                                  │
│                              ▼                                  │
│                    ┌─────────────────┐                          │
│                    │  sync-produtos  │                          │
│                    └────────┬────────┘                          │
│                              │                                  │
│                              ▼                                  │
│                    ┌─────────────────┐                          │
│                    │    produtos     │  ← Fonte única           │
│                    │  (admin=false)  │                          │
│                    └────────┬────────┘                          │
│                              │                                  │
│                    Admin APROVA                                 │
│                              │                                  │
│                              ▼                                  │
│                    ┌─────────────────┐                          │
│                    │    produtos     │                          │
│                    │  (admin=true)   │                          │
│                    └────────┬────────┘                          │
│                              │                                  │
│            ┌─────────────────┴─────────────────┐                │
│            │          TRIGGER AUTO-VINCULA     │                │
│            ▼                                   ▼                │
│   ┌──────────────────┐              ┌──────────────────┐        │
│   │ reseller_products│              │produtos_franqueadas│       │
│   │   (NOVO)         │              │   (LEGADO)        │        │
│   └────────┬─────────┘              └─────────┬────────┘        │
│            │                                  │                 │
│            ▼                                  ▼                 │
│   ┌──────────────────┐              ┌──────────────────┐        │
│   │  Painel          │              │  API Loja        │        │
│   │  Revendedora     │              │  (franqueadas)   │        │
│   └──────────────────┘              └──────────────────┘        │
│                                                                 │
│                         CHECKOUT                                │
│                              │                                  │
│                              ▼                                  │
│                    ┌─────────────────┐                          │
│                    │     vendas      │                          │
│                    └────────┬────────┘                          │
│                              │                                  │
│                    Pagamento APROVADO                           │
│                              │                                  │
│                              ▼                                  │
│                    ┌─────────────────┐                          │
│                    │  Baixa Estoque  │                          │
│                    │  (variacoes!)   │ ← ⚠️ Campo errado?       │
│                    └─────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✅ PRÓXIMOS PASSOS RECOMENDADOS

1. **Decidir:** Qual sistema de vinculação manter (reseller_products vs produtos_franqueadas)
2. **Verificar:** Qual trigger está ativo no banco de produção (048 vs 051)
3. **Corrigir:** Campo de variações usado no webhook MP
4. **Implementar:** Constraint de estoque não-negativo
5. **Testar:** Fluxo completo de produto novo → aprovação → vinculação → venda → baixa estoque

---

**Documento gerado para análise técnica. Não foram feitas alterações de código.**
