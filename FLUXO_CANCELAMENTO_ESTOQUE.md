# 🔄 Fluxo de Controle de Estoque - Pedidos e Cancelamentos

## 📊 DIAGNÓSTICO COMPLETO

### **Situação Atual do Sistema:**

✅ **Quando um pedido é APROVADO (pago):**
- Webhook do Mercado Pago recebe notificação
- Sistema dá baixa automaticamente no estoque
- Arquivo: `app/api/webhook/mercadopago/route.ts`
- Função: `darBaixaNoEstoque()`

❌ **Quando um pedido é CANCELADO/REJEITADO:**
- Sistema atualiza status para `'cancelled'` ou `'rejected'`
- **MAS NÃO DEVOLVE O ESTOQUE AUTOMATICAMENTE** ⚠️
- Produtos ficam "presos" em pedidos cancelados

---

## 🎯 PROBLEMA IDENTIFICADO

### **Cenário Real (o seu caso):**

1. Cliente faz pedido de 3 produtos
2. Mercado Pago aprova pagamento
3. Sistema dá baixa: Estoque vai de 10 → 7
4. **Você cancela o pedido manualmente** (cliente desistiu, erro, etc)
5. Status muda para `'cancelled'`
6. **Estoque continua em 7** (não volta para 10!) ❌

**Resultado:** Produtos aparecem como esgotados mesmo tendo estoque físico disponível

---

## ✅ SOLUÇÃO IMPLEMENTADA

### **1. Endpoint de Cancelamento com Devolução Automática**

**Arquivo:** `app/api/admin/vendas/cancelar/route.ts`

**Como usar:**

```bash
curl -X POST http://localhost:3000/api/admin/vendas/cancelar \
  -H "Content-Type: application/json" \
  -d '{
    "vendaId": "uuid-da-venda-aqui",
    "motivo": "Cliente desistiu da compra"
  }'
```

**O que faz:**
1. ✅ Busca dados da venda
2. ✅ Verifica se já está cancelada (evita dupla devolução)
3. ✅ **Devolve estoque de TODOS os itens do pedido**
4. ✅ Atualiza status para `'cancelled'`
5. ✅ Registra log do cancelamento

**Resposta de sucesso:**
```json
{
  "success": true,
  "message": "Venda cancelada e estoque restaurado com sucesso",
  "estoqueRestaurado": [
    {
      "produto": "Rasteirinha Feminina Isis",
      "tamanho": "37",
      "quantidade": 2,
      "estoqueAnterior": 5,
      "estoqueNovo": 7
    }
  ]
}
```

---

### **2. Script de Análise de Vendas Canceladas**

**Arquivo:** `scripts/analisar-vendas-canceladas.mjs`

**Como usar:**

```bash
node scripts/analisar-vendas-canceladas.mjs
```

**O que faz:**
- ✅ Lista todas as vendas com status `'cancelled'` ou `'rejected'`
- ✅ Mostra quantos itens/unidades precisam ter estoque devolvido
- ✅ Gera comandos `curl` prontos para corrigir cada venda
- ✅ Modo somente leitura (não altera nada)

**Output esperado:**
```
📊 RESUMO:
   Vendas canceladas/rejeitadas: 5
   Vendas que precisam correção: 5
   Total de itens para restaurar: 12
   Total de unidades a devolver: 28

📋 Lista de vendas para corrigir:
   - Venda #abc12345 (Maria Silva)
     curl -X POST http://localhost:3000/api/admin/vendas/cancelar \
          -H "Content-Type: application/json" \
          -d '{"vendaId": "abc12345-...", "motivo": "Correção automática"}'
```

---

## 🚀 COMO USAR (PASSO A PASSO)

### **Cenário 1: Cancelar Uma Venda Agora**

1. Acesse a página de vendas do admin: `/admin/vendas`
2. Encontre a venda que deseja cancelar
3. Copie o ID da venda (UUID)
4. Execute o comando:

```bash
curl -X POST http://localhost:3000/api/admin/vendas/cancelar \
  -H "Content-Type: application/json" \
  -d '{
    "vendaId": "COLE-O-ID-AQUI",
    "motivo": "Cliente solicitou cancelamento"
  }'
```

5. ✅ Estoque será devolvido automaticamente!

---

### **Cenário 2: Corrigir Vendas Já Canceladas (Passado)**

Se você cancelou vendas no passado e o estoque não voltou:

1. Execute o script de análise:
```bash
node scripts/analisar-vendas-canceladas.mjs
```

2. O script vai mostrar todas as vendas que precisam correção

3. **IMPORTANTE:** O endpoint `cancelar` verifica se a venda já está cancelada. Para vendas antigas, você precisa:
   - Rodar SQL direto no Supabase para restaurar estoque
   - Ou criar endpoint específico de "restaurar estoque" (sem mudar status)

---

### **Cenário 3: SQL Manual (Para Vendas Antigas)**

Se preferir rodar SQL diretamente no Supabase:

```sql
-- 1. LISTAR vendas canceladas (para ver o que precisa corrigir)
SELECT 
  id,
  cliente_nome,
  created_at,
  valor_total,
  items::text,
  status_pagamento
FROM vendas
WHERE status_pagamento IN ('cancelled', 'rejected')
ORDER BY created_at DESC
LIMIT 50;

-- 2. Para restaurar estoque manualmente (NÃO RODAR SEM ADAPTAR):
-- Você precisa:
--   a) Identificar o produto_id e variação
--   b) Somar a quantidade de volta ao estoque
--   c) Atualizar a coluna variacoes (JSONB)

-- Exemplo (ADAPTAR COM DADOS REAIS):
UPDATE produtos
SET variacoes = jsonb_set(
  variacoes,
  '{0,estoque}',  -- Índice da variação (0, 1, 2, etc)
  to_jsonb((variacoes->0->>'estoque')::int + 2)  -- +2 unidades
)
WHERE id = 'ID_DO_PRODUTO';
```

---

## 🔧 PRÓXIMOS PASSOS (FUTURO)

### **1. Adicionar Botão na Interface Admin**

Modificar `app/admin/vendas/page.tsx` para adicionar botão "Cancelar Venda" em cada linha da tabela.

**Código sugerido:**
```tsx
<button
  onClick={() => cancelarVenda(venda.id)}
  className="text-red-600 hover:text-red-800"
  disabled={venda.status_pagamento === 'cancelled'}
>
  {venda.status_pagamento === 'cancelled' ? '✓ Cancelada' : 'Cancelar'}
</button>
```

---

### **2. Endpoint de "Restaurar Estoque" (Sem Cancelar)**

Para casos onde o pedido JÁ está cancelado mas precisa só restaurar estoque:

```typescript
// app/api/admin/vendas/restaurar-estoque/route.ts
POST /api/admin/vendas/restaurar-estoque
{
  "vendaId": "uuid",
  "motivo": "Correção de estoque histórico"
}
```

---

### **3. Sincronização Bidirecional com FácilZap**

Se você usa integração com FácilZap:
- Quando cancela no C4 Admin → avisar FácilZap para devolver estoque lá também
- Quando cancela no FácilZap → webhook avisa C4 Admin para devolver estoque aqui

---

## ⚠️ AVISOS IMPORTANTES

### **Dupla Devolução de Estoque:**
O endpoint verifica se venda já está cancelada e **bloqueia** se tentar cancelar novamente. Isso evita devolver estoque 2x.

### **Produtos Deletados:**
Se o produto foi deletado do banco DEPOIS do pedido, o script vai avisar mas não vai conseguir devolver estoque (produto não existe mais).

### **Variações Não Encontradas:**
Se a variação (tamanho/SKU) mudou ou foi removida, o script pula esse item com aviso.

### **Logs de Cancelamento:**
Todos os cancelamentos são registrados na tabela `logs_cancelamento` (precisa criar migration):

```sql
CREATE TABLE IF NOT EXISTS logs_cancelamento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venda_id UUID NOT NULL REFERENCES vendas(id),
  motivo TEXT,
  itens_restaurados JSONB,
  cancelado_por TEXT,
  cancelado_em TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

- [x] Endpoint `/api/admin/vendas/cancelar` criado
- [x] Script `analisar-vendas-canceladas.mjs` criado
- [x] Documentação completa
- [ ] Adicionar botão de cancelar na UI do admin
- [ ] Criar migration para tabela `logs_cancelamento`
- [ ] Endpoint de "restaurar estoque" para vendas antigas
- [ ] Sincronização com FácilZap (se usar)
- [ ] Testes automatizados

---

## 🎯 RESUMO EXECUTIVO

**Antes:**
- Pedido aprovado → Estoque cai ✅
- Pedido cancelado → Estoque **NÃO volta** ❌

**Depois:**
- Pedido aprovado → Estoque cai ✅
- Pedido cancelado via endpoint → **Estoque volta automaticamente** ✅

**Como usar agora:**
```bash
# Ver vendas canceladas que precisam correção
node scripts/analisar-vendas-canceladas.mjs

# Cancelar uma venda (e devolver estoque)
curl -X POST http://localhost:3000/api/admin/vendas/cancelar \
  -H "Content-Type: application/json" \
  -d '{"vendaId": "UUID", "motivo": "Descrição"}'
```

---

**Data:** 4 de janeiro de 2026  
**Arquivo:** `FLUXO_CANCELAMENTO_ESTOQUE.md`
