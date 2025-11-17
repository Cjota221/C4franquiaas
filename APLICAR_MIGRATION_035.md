# Migration 035 - Sincronização Automática de Produtos

## 📋 Descrição

Esta migration implementa a **regra de negócio crítica** de sincronização automática entre o catálogo master (Admin) e os sites das franqueadas/revendedoras.

## 🎯 Regras de Negócio Implementadas

| Ação no Admin                          | Efeito Automático no Site da Franqueada                        |
| -------------------------------------- | -------------------------------------------------------------- |
| Produto **desativado** (ativo = false) | ✅ Desativa automaticamente (ativo_no_site = false)            |
| **Estoque zerado** (estoque = 0)       | ✅ Desativa automaticamente (ativo_no_site = false)            |
| Produto **reativado** (ativo = true)   | ⏸️ Marca como "pronto para ativar" (NÃO ativa automaticamente) |
| **Estoque reposto** (estoque > 0)      | ⏸️ Marca como "pronto para ativar" (NÃO ativa automaticamente) |

## 🔧 Componentes da Migration

### 1. Função de Trigger

- **Nome:** `sync_product_availability_to_franchisees()`
- **Gatilho:** Mudanças nos campos `ativo` ou `estoque` da tabela `produtos`
- **Ação:** Atualiza `ativo_no_site` em `produtos_franqueadas_precos`

### 2. Trigger

- **Nome:** `trg_sync_product_availability`
- **Tabela:** `produtos`
- **Tipo:** AFTER UPDATE
- **Condição:** Quando `ativo` ou `estoque` mudam de valor

### 3. Coluna Adicional

- **Nome:** `ultima_sincronizacao`
- **Tabela:** `produtos_franqueadas_precos`
- **Tipo:** TIMESTAMP
- **Propósito:** Auditoria e debugging

### 4. Função Helper

- **Nome:** `get_product_availability_status(produto_id)`
- **Retorno:** Status de disponibilidade (DESATIVADO_ADMIN, SEM_ESTOQUE, DISPONIVEL)

## 📝 Como Aplicar

### 1. No Supabase Dashboard

```sql
-- Copie e cole o conteúdo de 035_add_sync_triggers.sql
-- no SQL Editor do Supabase e execute
```

### 2. Via Linha de Comando (se configurado)

```bash
psql $DATABASE_URL -f migrations/035_add_sync_triggers.sql
```

## ✅ Verificação

### Verificar se o trigger foi criado:

```sql
SELECT * FROM pg_trigger WHERE tgname = 'trg_sync_product_availability';
```

### Verificar se a função existe:

```sql
SELECT proname, prosrc FROM pg_proc
WHERE proname = 'sync_product_availability_to_franchisees';
```

### Testar a sincronização:

```sql
-- 1. Escolha um produto que esteja vinculado a alguma franqueada
SELECT id, nome, ativo, estoque FROM produtos WHERE id = 1;

-- 2. Desative o produto
UPDATE produtos SET ativo = false WHERE id = 1;

-- 3. Verifique se foi desativado automaticamente nas franqueadas
SELECT pf.id, pf.produto_id, pfp.ativo_no_site, pfp.ultima_sincronizacao
FROM produtos_franqueadas pf
JOIN produtos_franqueadas_precos pfp ON pfp.produto_franqueada_id = pf.id
WHERE pf.produto_id = 1;

-- Resultado esperado: ativo_no_site = false
```

### Testar função helper:

```sql
SELECT * FROM get_product_availability_status(1);
```

## 🔄 Comportamento Esperado

### Cenário 1: Admin desativa produto

```
Admin: ativo = true → false
Trigger: Detecta mudança
Ação: UPDATE produtos_franqueadas_precos SET ativo_no_site = false
Resultado: Produto some de TODOS os sites das franqueadas
```

### Cenário 2: Estoque acaba

```
Admin: estoque = 10 → 0
Trigger: Detecta mudança
Ação: UPDATE produtos_franqueadas_precos SET ativo_no_site = false
Resultado: Produto some de TODOS os sites das franqueadas
```

### Cenário 3: Admin reativa produto

```
Admin: ativo = false → true
Trigger: Detecta mudança
Ação: UPDATE produtos_franqueadas_precos SET atualizado_em = NOW()
Resultado: Produto fica disponível para reativação, mas NÃO aparece automaticamente
Franqueada: Deve acessar painel e clicar no toggle para reativar
```

## 🚨 Importante

- ✅ A sincronização é **instantânea** (trigger AFTER UPDATE)
- ✅ Afeta **todas as franqueadas** que têm o produto vinculado
- ✅ A franqueada **não pode ativar** produtos desativados pelo admin ou sem estoque
- ✅ A franqueada **deve ativar manualmente** quando o produto volta a ficar disponível
- ✅ Logs são gerados via `RAISE NOTICE` para debugging

## 🔍 Troubleshooting

### Trigger não está funcionando?

```sql
-- Verificar se o trigger está habilitado
SELECT tgenabled FROM pg_trigger WHERE tgname = 'trg_sync_product_availability';
-- Resultado esperado: 'O' (Origem/Always enabled)
```

### Ver logs do trigger:

```sql
-- No PostgreSQL, os RAISE NOTICE aparecem no log do servidor
-- No Supabase, pode não ser visível, mas a ação é executada
```

### Rollback (se necessário):

```sql
DROP TRIGGER IF EXISTS trg_sync_product_availability ON produtos;
DROP FUNCTION IF EXISTS sync_product_availability_to_franchisees();
DROP FUNCTION IF EXISTS get_product_availability_status(BIGINT);
ALTER TABLE produtos_franqueadas_precos DROP COLUMN IF EXISTS ultima_sincronizacao;
```

## 📊 Impacto

- **Performance:** Mínimo (trigger só executa quando ativo/estoque mudam)
- **Tabelas afetadas:** `produtos`, `produtos_franqueadas_precos`
- **Breaking changes:** Nenhum
- **Compatibilidade:** Totalmente compatível com código existente

## 🎯 Próximos Passos

Após aplicar esta migration:

1. ✅ Testar a sincronização manualmente (seguir seção Verificação)
2. ✅ Implementar UI no painel da franqueada para mostrar status
3. ✅ Adicionar badge "Produto reativado pela franqueadora" quando apropriado
4. ✅ Criar notification system para avisar franqueadas de produtos reativados

---

**Status:** ✅ Pronto para aplicar  
**Dependências:** Migrations 007 (produtos_franqueadas) e 009 (produtos_franqueadas_precos)  
**Reversível:** Sim (ver seção Rollback)
