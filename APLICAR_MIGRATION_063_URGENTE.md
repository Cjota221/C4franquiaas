# 🚨 APLICAR MIGRATION 063 - VALIDAÇÃO DE EXCLUSÃO (URGENTE)

## 🎯 O QUE ESTA MIGRATION RESOLVE

### ❌ PROBLEMAS CRÍTICOS DESCOBERTOS:

1. **Vendas com referências órfãs**

   - Campo `vendas.items` (JSONB) contém IDs de produtos
   - Quando produto é excluído, histórico de vendas fica com referências inválidas
   - Impacto: Relatórios quebrados, auditoria comprometida

2. **Histórico de estoque sendo deletado**

   - `estoque_movimentacoes` tem CASCADE
   - Todo histórico de movimentações é perdido ao excluir produto
   - Impacto: Perda de dados de auditoria fiscal

3. **Carrinhos abandonados órfãos**

   - `abandoned_cart_items.product_id` é TEXT sem FK
   - Links de remarketing quebram
   - Impacto: Campanhas ineficazes, experiência ruim

4. **Promoções ativas com produtos inexistentes**

   - `promotions.product_ids` é ARRAY sem validação
   - Promoções continuam ativas após exclusão
   - Impacto: Erros 404, prejuízo financeiro

5. **Sem validação antes de excluir**
   - Função atual não verifica se produto está em uso
   - Exclusão é irreversível
   - Impacto: Perda de integridade referencial

---

## ✅ O QUE A MIGRATION FAZ

### 1. **Cria função de validação**

```sql
validar_exclusao_produto(produto_id UUID)
```

Verifica:

- ❌ **BLOQUEIA** se houver vendas registradas (CRÍTICO)
- ❌ **BLOQUEIA** se houver promoções ativas
- ⚠️ **AVISA** sobre carrinhos abandonados ativos (últimos 30 dias)
- ⚠️ **AVISA** sobre movimentações de estoque (últimos 90 dias)

### 2. **Atualiza função de exclusão**

- Valida cada produto ANTES de excluir
- **Soft delete** em carrinhos abandonados (prefixo `DELETED_`)
- **Desativa** promoções ao invés de deletar
- **MANTÉM** histórico de movimentações de estoque (não deleta!)
- **BLOQUEIA** exclusão se produto estiver em vendas

### 3. **Retorna detalhamento**

```json
{
  "success": true,
  "total_excluidos": 3,
  "total_bloqueados": 2,
  "resultados": [
    {
      "produto_id": "uuid-123",
      "excluido": false,
      "motivo": "Produto está em 15 venda(s) registrada(s). EXCLUSÃO BLOQUEADA."
    },
    {
      "produto_id": "uuid-456",
      "excluido": true,
      "avisos": "3 carrinho(s) abandonado(s) ativos nos últimos 30 dias."
    }
  ]
}
```

---

## 📋 COMO APLICAR

### 1. **Abrir Supabase SQL Editor**

https://supabase.com/dashboard/project/YOUR_PROJECT/sql

### 2. **Copiar e colar todo o conteúdo de:**

```
migrations/063_validacao_exclusao_produtos.sql
```

### 3. **Executar (Shift + Enter)**

### 4. **Verificar resultado**

Deve aparecer:

```
Success. No rows returned
```

---

## 🧪 TESTAR

### Teste 1: Validar produto SEM vendas

```sql
SELECT validar_exclusao_produto('ALGUM_PRODUTO_UUID'::UUID);
```

Esperado:

```json
{
  "pode_excluir": true,
  "total_vendas": 0,
  "erros": [],
  "avisos": []
}
```

### Teste 2: Validar produto COM vendas

```sql
-- Buscar produto que tem vendas
SELECT DISTINCT
  (items->0->>'id')::uuid as produto_id
FROM vendas
LIMIT 1;

-- Validar (deve BLOQUEAR)
SELECT validar_exclusao_produto('PRODUTO_ID_ACIMA'::UUID);
```

Esperado:

```json
{
  "pode_excluir": false,
  "total_vendas": 5,
  "erros": ["Produto está em 5 venda(s) registrada(s). EXCLUSÃO BLOQUEADA."]
}
```

### Teste 3: Excluir com validação

```sql
SELECT excluir_produtos_completo(ARRAY['PRODUTO_UUID']::UUID[]);
```

---

## ⚠️ AVISOS IMPORTANTES

### 🔴 PRODUTOS COM VENDAS **NÃO PODEM** SER EXCLUÍDOS

- Isso é intencional
- Protege integridade dos dados
- Se realmente precisa excluir: desative ao invés de deletar

### 🟡 PROMOÇÕES SÃO DESATIVADAS, NÃO DELETADAS

- Mantém histórico de campanhas
- Adiciona marcador `[PRODUTO EXCLUÍDO]`
- Impede novos usos

### 🟢 HISTÓRICO DE ESTOQUE É PRESERVADO

- Movimentações antigas NÃO são deletadas
- Importante para auditoria
- Ocupa espaço mínimo no banco

### 🔵 CARRINHOS ABANDONADOS: SOFT DELETE

- IDs são prefixados com `DELETED_`
- Permite análise histórica
- Não quebra relatórios

---

## 🚀 PRÓXIMOS PASSOS

Após aplicar esta migration:

1. ✅ Testar exclusão de produtos no admin
2. ✅ Verificar se mensagens de bloqueio aparecem corretamente
3. ✅ Confirmar que produtos com vendas NÃO são excluídos
4. ✅ Validar que histórico de estoque é mantido

---

## 🆘 SE DER ERRO

### Erro: "function already exists"

**Solução:** A function já existe, pode ignorar ou usar `DROP FUNCTION` antes

### Erro: "relation does not exist"

**Causa:** Alguma tabela não foi criada ainda
**Solução:** Verificar se migrations 020, 035 foram aplicadas

### Erro: "permission denied"

**Causa:** Usuário sem permissão de criar funções
**Solução:** Usar conta de admin do Supabase

---

## 📊 IMPACTO ESPERADO

| Métrica             | Antes       | Depois         |
| ------------------- | ----------- | -------------- |
| Vendas órfãs        | ❌ Possível | ✅ BLOQUEADO   |
| Histórico perdido   | ❌ Sim      | ✅ Preservado  |
| Promoções quebradas | ❌ Sim      | ✅ Desativadas |
| Carrinhos órfãos    | ❌ Sim      | ✅ Soft delete |
| Validação prévia    | ❌ Não      | ✅ Sim         |

---

## 💡 DICA PRÓ

Se quiser apenas **desativar** produtos ao invés de excluir permanentemente:

```sql
UPDATE produtos
SET ativo = false
WHERE id IN ('uuid1', 'uuid2');
```

Isso:

- Mantém todas as referências intactas
- Oculta do catálogo
- Preserva histórico completo
- É reversível

---

**PRIORIDADE:** 🔴 URGENTE - Aplique o mais rápido possível para proteger integridade dos dados
