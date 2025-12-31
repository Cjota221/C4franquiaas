# ✅ FLUXO DE APROVAÇÃO DE PRODUTOS - IMPLEMENTAÇÃO COMPLETA

## 📋 Visão Geral

Sistema completo de **aprovação em 2 níveis** para controle de produtos entre Admin → Franqueadas → Sites Públicos.

**Status: IMPLEMENTADO E PRONTO PARA TESTES** ✅

---

## 🎯 Problema Resolvido

### Antes
- ❌ Produtos do FácilZap iam direto para as franqueadas sem controle
- ❌ Revendedoras tinham produtos inadequados (ex: Kit Empreendedora)
- ❌ Sem visibilidade de produtos novos
- ❌ Sem rastreabilidade de aprovações

### Depois
- ✅ Admin aprova produtos antes de ir para franqueadas
- ✅ Franqueadas ativam produtos com margem personalizada
- ✅ Notificações em tempo real
- ✅ Badge contador de produtos novos
- ✅ Rastreabilidade completa (quem aprovou, quando ativou)

---

## 🗂️ Estrutura Implementada

### 1️⃣ DATABASE (Migration 049)
**Arquivo:** `migrations/049_fluxo_aprovacao_produtos.sql`

#### Campos Adicionados à Tabela `produtos`:
```sql
admin_aprovado BOOLEAN DEFAULT false         -- Admin aprovou?
admin_rejeitado BOOLEAN DEFAULT false        -- Admin rejeitou?
admin_data_aprovacao TIMESTAMP               -- Quando foi aprovado?
admin_aprovado_por UUID                      -- Quem aprovou? (ref: auth.users)
admin_notas TEXT                             -- Motivo da rejeição/observações
eh_produto_novo BOOLEAN DEFAULT false        -- Produto veio do sync recente?
```

#### Campos Adicionados à Tabela `reseller_products`:
```sql
vista_pela_franqueada BOOLEAN DEFAULT false  -- Franqueada já viu o produto?
data_ativacao TIMESTAMP                      -- Quando foi ativado no site?
```

#### Funções PL/pgSQL Criadas:

**`aprovar_produtos(produto_ids UUID[], admin_user_id UUID, notas TEXT)`**
- Marca produtos como `admin_aprovado = true`
- Cria entradas em `reseller_products` com margem padrão (20%)
- Envia notificação para todas franqueadas aprovadas
- Retorna quantidade de produtos aprovados

**`rejeitar_produtos(produto_ids UUID[], admin_user_id UUID, notas TEXT)`**
- Marca produtos como `admin_rejeitado = true`
- Desativa produtos (`ativo = false`)
- Armazena motivo em `admin_notas`
- Retorna quantidade de produtos rejeitados

**`ativar_produto_franqueada(p_product_id UUID, p_reseller_id UUID, p_margem DECIMAL, p_custom_price DECIMAL)`**
- Ativa produto no catálogo da franqueada
- Aplica margem ou preço customizado
- Marca produto como visto
- Registra data de ativação
- Ativa estoque inicial

#### Views Criadas:

**`produtos_pendentes_aprovacao`**
```sql
SELECT * FROM produtos 
WHERE NOT admin_aprovado 
  AND NOT admin_rejeitado 
  AND eh_produto_novo = true
```
- Mostra produtos aguardando aprovação do admin
- Usada no painel `/admin/produtos/pendentes`

**`produtos_novos_franqueada`**
```sql
SELECT p.*, rp.margem_percent, rp.vista_pela_franqueada
FROM produtos p
JOIN reseller_products rp ON rp.product_id = p.id
WHERE p.admin_aprovado = true
  AND rp.ativo = false
  AND rp.reseller_id = auth.uid()
```
- Mostra produtos aprovados pelo admin mas ainda não ativados pela franqueada
- Usada no painel `/revendedora/produtos/novos`

#### RLS Policies:
- Admin tem acesso total para aprovar/rejeitar
- Franqueadas veem apenas produtos aprovados para elas
- Views aplicam filtros automáticos por usuário logado

---

### 2️⃣ SYNC MODIFICADO
**Arquivo:** `app/api/sync-produtos/route.ts`

#### Lógica Implementada:
```typescript
// NOVOS PRODUTOS → Ficam PENDENTES
const ativo = false;
const admin_aprovado = false;
const eh_produto_novo = true;

// PRODUTOS EXISTENTES → Preserva status
// Se já foi aprovado e reestocado → reativa automaticamente
```

**Resultado:**
- Produtos novos do FácilZap **não vão direto** para franqueadas
- Admin precisa aprovar antes
- Produtos já aprovados que reestocam → reativam automaticamente

---

### 3️⃣ PAINEL ADMIN
**URL:** `/admin/produtos/pendentes`
**Arquivo:** `app/admin/produtos/pendentes/page.tsx`

#### Funcionalidades:
- 📦 Grid visual de produtos pendentes
- ☑️ Seleção múltipla (checkboxes)
- ✅ Botão "Aprovar Selecionados" (verde)
- ❌ Botão "Rejeitar Selecionados" (vermelho, pede motivo)
- 🔄 Atualização automática após ações
- 📊 Mostra: imagem, nome, categorias, preço base

**API Endpoint:** `/api/admin/produtos/aprovar`
```typescript
POST /api/admin/produtos/aprovar
{
  "produto_ids": ["uuid1", "uuid2"],
  "acao": "aprovar" | "rejeitar",
  "notas": "Motivo da rejeição (opcional)"
}
```

---

### 4️⃣ PAINEL FRANQUEADA
**URL:** `/revendedora/produtos/novos`
**Arquivo:** `app/revendedora/produtos/novos/page.tsx`

#### Funcionalidades:
- 🆕 Badge "NOVO" nos produtos
- 📦 Grid visual de produtos aprovados
- 💰 Ajuste de margem por produto (slider/input)
- 🧮 Cálculo automático do preço final: `base × (1 + margem/100)`
- 💵 Preview do lucro: `final - base`
- ✅ Botão "Ativar no Meu Site" individual
- ☑️ Botão "Ativar Todos" (bulk)
- 📊 Mostra: imagem, nome, categorias, preço base

**API Endpoint:** `/api/revendedora/produtos/ativar`
```typescript
POST /api/revendedora/produtos/ativar
{
  "product_id": "uuid",
  "margem_percent": 25,
  "custom_price": 30.00 // opcional
}
```

---

### 5️⃣ BADGE CONTADOR NO MENU
**Arquivo:** `components/revendedora/SidebarRevendedora.tsx`
**Hook:** `hooks/useNewProductsCount.ts`

#### Funcionalidades:
- 🔴 Badge vermelho animado com contagem
- 🔄 Atualização automática a cada 30 segundos
- ✨ Ícone "Sparkles" no item "Produtos Novos"
- 👁️ Visível apenas quando há produtos novos

**Menu Atualizado:**
```
Dashboard
Produtos
🆕 Produtos Novos [3] ← Badge contador
Carrinhos Abandonados
Promoções
Personalização
Configurações
```

---

## 🔄 Fluxo Completo

```
┌─────────────────┐
│  FácilZap API   │
└────────┬────────┘
         │ (sync automático)
         ▼
┌─────────────────────────────┐
│  Produtos Pendentes Admin   │
│  admin_aprovado = false     │
│  ativo = false              │
└────────┬────────────────────┘
         │
         │ Admin acessa /admin/produtos/pendentes
         │ Admin seleciona e clica "Aprovar"
         ▼
┌─────────────────────────────┐
│  Produtos Aprovados         │
│  admin_aprovado = true      │
│  reseller_products criados  │
│  Notificação enviada        │
└────────┬────────────────────┘
         │
         │ Franqueada vê badge [3] no menu
         │ Franqueada acessa /revendedora/produtos/novos
         │ Franqueada ajusta margem e clica "Ativar"
         ▼
┌─────────────────────────────┐
│  Produto Ativo no Site      │
│  reseller_products.ativo    │
│  Visível no catálogo público│
└─────────────────────────────┘
```

---

## 📝 Commits Realizados

```bash
c43511d feat: Implementar fluxo de aprovação no sync FácilZap
28d1043 feat: Criar página Admin e API para aprovar/rejeitar produtos
70bd254 feat: Adicionar badge contador de produtos novos no menu da franqueada
```

---

## ✅ Checklist de Implementação

- [x] Migration 049 aplicada em produção
- [x] Sync modificado (novos produtos pendentes)
- [x] Painel Admin criado (`/admin/produtos/pendentes`)
- [x] API Admin criada (`/api/admin/produtos/aprovar`)
- [x] Painel Franqueada criado (`/revendedora/produtos/novos`)
- [x] API Franqueada criada (`/api/revendedora/produtos/ativar`)
- [x] Badge contador no menu
- [x] Hook de contagem automática
- [x] Notificações funcionais
- [x] RLS policies aplicadas
- [x] Views de filtragem criadas
- [x] Código commitado e pushed

---

## 🧪 Como Testar

### 1. Criar Produto de Teste
```sql
INSERT INTO produtos (
  nome, 
  descricao, 
  preco_base, 
  estoque, 
  ativo, 
  admin_aprovado, 
  admin_rejeitado, 
  eh_produto_novo
) VALUES (
  'Produto Teste Aprovação',
  'Teste do fluxo de aprovação',
  50.00,
  10,
  false,
  false,
  false,
  true
);
```

### 2. Admin Aprova
1. Login como admin
2. Acessar `/admin/produtos/pendentes`
3. Selecionar "Produto Teste Aprovação"
4. Clicar "Aprovar Selecionados"
5. ✅ Verificar notificação de sucesso

### 3. Franqueada Ativa
1. Login como franqueada
2. Ver badge **[1]** no menu "Produtos Novos"
3. Acessar `/revendedora/produtos/novos`
4. Ajustar margem (ex: 30%)
5. Verificar cálculo: R$ 50 × 1.30 = R$ 65
6. Clicar "Ativar no Meu Site"
7. ✅ Produto aparece no catálogo público

### 4. Verificar no Site Público
1. Acessar `https://seu-slug.sualoja.com.br/catalogo`
2. ✅ Produto "Teste Aprovação" visível
3. ✅ Preço mostrado: R$ 65,00

---

## 📊 Queries de Monitoramento

### Ver produtos pendentes de aprovação:
```sql
SELECT * FROM produtos_pendentes_aprovacao;
```

### Ver produtos novos para franqueada específica:
```sql
SELECT * FROM produtos_novos_franqueada 
WHERE reseller_id = 'UUID_DA_FRANQUEADA';
```

### Ver histórico de aprovações:
```sql
SELECT 
  p.nome,
  p.admin_aprovado,
  p.admin_rejeitado,
  p.admin_data_aprovacao,
  u.email as aprovado_por
FROM produtos p
LEFT JOIN auth.users u ON u.id = p.admin_aprovado_por
WHERE p.admin_data_aprovacao IS NOT NULL
ORDER BY p.admin_data_aprovacao DESC;
```

### Contar produtos novos por franqueada:
```sql
SELECT 
  r.name as franqueada,
  COUNT(*) as produtos_novos
FROM produtos_novos_franqueada pnf
JOIN resellers r ON r.id = pnf.reseller_id
GROUP BY r.name;
```

---

## 🚀 Próximos Passos (Opcional)

### Melhorias Futuras:
- [ ] Filtros no painel admin (categoria, preço, estoque)
- [ ] Busca por nome no painel franqueada
- [ ] Histórico de ativações
- [ ] Dashboard com métricas (% aprovação, tempo médio)
- [ ] Notificações push (Web Push API)
- [ ] Bulk edit de margens
- [ ] Templates de margem por categoria

### Migration Realtime (já pronta):
```bash
# Aplicar quando quiser updates instantâneos
psql -h <host> -U postgres -d postgres -f migrations/APLICAR_REALTIME_CATALOGO.sql
```

---

## 📞 Suporte

### Arquivos Importantes:
- `migrations/049_fluxo_aprovacao_produtos.sql` - Estrutura do banco
- `app/api/sync-produtos/route.ts` - Lógica de sync
- `app/admin/produtos/pendentes/page.tsx` - Painel admin
- `app/revendedora/produtos/novos/page.tsx` - Painel franqueada
- `hooks/useNewProductsCount.ts` - Contador automático

### Em Caso de Problemas:
1. Verificar RLS policies ativas: `SELECT * FROM pg_policies WHERE tablename IN ('produtos', 'reseller_products')`
2. Verificar migration aplicada: `SELECT * FROM schema_migrations WHERE version = '049'`
3. Logs do sync: Verificar console em `/api/sync-produtos`
4. Testar views manualmente no SQL Editor

---

**🎉 SISTEMA PRONTO PARA PRODUÇÃO!**
