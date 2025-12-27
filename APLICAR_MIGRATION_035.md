# 🛒 Aplicar Migration 035 - Carrinhos Abandonados e Promoções# Migration 035 - Sincronização Automática de Produtos

## 📋 O que foi criado## 📋 Descrição

### Tabelas no Banco de Dados:Esta migration implementa a **regra de negócio crítica** de sincronização automática entre o catálogo master (Admin) e os sites das franqueadas/revendedoras.

1. **abandoned_carts** - Carrinhos abandonados

2. **abandoned_cart_items** - Itens dos carrinhos## 🎯 Regras de Negócio Implementadas

3. **promotions** - Promoções (cupons, frete grátis, leve+pague)

4. **promotion_uses** - Registro de usos das promoções| Ação no Admin | Efeito Automático no Site da Franqueada |

| -------------------------------------- | -------------------------------------------------------------- |

### Novas Páginas:| Produto **desativado** (ativo = false) | ✅ Desativa automaticamente (ativo_no_site = false) |

- `/revendedora/carrinhos-abandonados` - Gerenciar carrinhos abandonados| **Estoque zerado** (estoque = 0) | ✅ Desativa automaticamente (ativo_no_site = false) |

- `/revendedora/promocoes` - Criar e gerenciar promoções| Produto **reativado** (ativo = true) | ⏸️ Marca como "pronto para ativar" (NÃO ativa automaticamente) |

| **Estoque reposto** (estoque > 0) | ⏸️ Marca como "pronto para ativar" (NÃO ativa automaticamente) |

### APIs Criadas:

- `POST/GET/PATCH/DELETE /api/carrinho-abandonado`## 🔧 Componentes da Migration

- `POST/GET/PATCH/DELETE /api/promocoes`

### 1. Função de Trigger

### Menu da Sidebar Atualizado:

- ✅ Carrinhos Abandonados- **Nome:** `sync_product_availability_to_franchisees()`

- ✅ Promoções- **Gatilho:** Mudanças nos campos `ativo` ou `estoque` da tabela `produtos`

- **Ação:** Atualiza `ativo_no_site` em `produtos_franqueadas_precos`

---

### 2. Trigger

## 🚀 Aplicar a Migration

- **Nome:** `trg_sync_product_availability`

### Passo 1: Abra o Supabase- **Tabela:** `produtos`

Acesse: https://supabase.com/dashboard/project/seu-projeto/sql- **Tipo:** AFTER UPDATE

- **Condição:** Quando `ativo` ou `estoque` mudam de valor

### Passo 2: Execute o SQL

Copie e cole o conteúdo do arquivo:### 3. Coluna Adicional

````

migrations/035_abandoned_carts_and_promotions.sql- **Nome:** `ultima_sincronizacao`

```- **Tabela:** `produtos_franqueadas_precos`

- **Tipo:** TIMESTAMP

### Passo 3: Desabilitar RLS (se necessário)- **Propósito:** Auditoria e debugging

Se tiver problemas de permissão, execute:

### 4. Função Helper

```sql

-- Desabilitar RLS temporariamente para testes- **Nome:** `get_product_availability_status(produto_id)`

ALTER TABLE abandoned_carts DISABLE ROW LEVEL SECURITY;- **Retorno:** Status de disponibilidade (DESATIVADO_ADMIN, SEM_ESTOQUE, DISPONIVEL)

ALTER TABLE abandoned_cart_items DISABLE ROW LEVEL SECURITY;

ALTER TABLE promotions DISABLE ROW LEVEL SECURITY;## 📝 Como Aplicar

ALTER TABLE promotion_uses DISABLE ROW LEVEL SECURITY;

```### 1. No Supabase Dashboard



---```sql

-- Copie e cole o conteúdo de 035_add_sync_triggers.sql

## ✅ Validação-- no SQL Editor do Supabase e execute

````

Após aplicar, verifique se as tabelas foram criadas:

### 2. Via Linha de Comando (se configurado)

````sql

SELECT table_name FROM information_schema.tables ```bash

WHERE table_schema = 'public' psql $DATABASE_URL -f migrations/035_add_sync_triggers.sql

AND table_name IN ('abandoned_carts', 'abandoned_cart_items', 'promotions', 'promotion_uses');```

````

## ✅ Verificação

---

### Verificar se o trigger foi criado:

## 📱 Funcionalidades

````sql

### Carrinhos AbandonadosSELECT * FROM pg_trigger WHERE tgname = 'trg_sync_product_availability';

- Ver lista de carrinhos abandonados```

- Filtrar por status (abandonado, recuperado, convertido)

- Buscar por nome, telefone ou email### Verificar se a função existe:

- Enviar WhatsApp diretamente

- Marcar como contatado/recuperado/convertido```sql

- Ver detalhes dos itens no carrinhoSELECT proname, prosrc FROM pg_proc

- Estatísticas de recuperaçãoWHERE proname = 'sync_product_availability_to_franchisees';

````

### Promoções

- **Frete Grátis**: Com ou sem valor mínimo### Testar a sincronização:

- **Cupom de Desconto**: Percentual ou valor fixo

- **Leve X Pague Y**: Ex: Leve 3 Pague 2```sql

- **Desconto Percentual**: Em toda a loja-- 1. Escolha um produto que esteja vinculado a alguma franqueada

- **Desconto em Valor**: Valor fixo de descontoSELECT id, nome, ativo, estoque FROM produtos WHERE id = 1;

- Limitar número de usos

- Definir data de expiração-- 2. Desative o produto

- Ativar/desativar promoçõesUPDATE produtos SET ativo = false WHERE id = 1;

----- 3. Verifique se foi desativado automaticamente nas franqueadas

SELECT pf.id, pf.produto_id, pfp.ativo_no_site, pfp.ultima_sincronizacao

## 🔗 Próximos PassosFROM produtos_franqueadas pf

JOIN produtos_franqueadas_precos pfp ON pfp.produto_franqueada_id = pf.id

Para integrar ao catálogo (quando cliente adicionar ao carrinho):WHERE pf.produto_id = 1;

1. Chamar API `/api/carrinho-abandonado` com:-- Resultado esperado: ativo_no_site = false

   - reseller_id```

   - customer_phone

   - customer_name### Testar função helper:

   - product_id, product_name, product_price, quantity

`````sql

2. Para aplicar promoções no checkout:SELECT * FROM get_product_availability_status(1);

   - Buscar promoções ativas: `GET /api/promocoes?reseller_id=X&active=true````

   - Validar cupom: `GET /api/promocoes?coupon=CODIGO`

## 🔄 Comportamento Esperado

### Cenário 1: Admin desativa produto

`````

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

````

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
````

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
