# 🔄 Guia de Unificação das Páginas de Franqueadas

## 📋 O Que Foi Implementado

✅ **Migration 010** - Estrutura unificada criada  
✅ **Tabela `lojas`** - Criada para dados das lojas  
✅ **API List** - Atualizada para incluir dados de loja  
✅ **API Action** - Adicionada ação `toggle-loja`  
✅ **Página Unificada** - Criada em `/admin/franqueadas-unificado`  

---

## 🚀 Como Aplicar a Unificação

### **PASSO 1: Aplicar Migration 010**

**No Supabase Dashboard > SQL Editor:**

```sql
-- Cole o conteúdo de migrations/010_unify_franqueadas_structure.sql
-- Ou execute diretamente:

ALTER TABLE franqueadas ADD COLUMN IF NOT EXISTS vendas_total DECIMAL(10,2) DEFAULT 0;
ALTER TABLE franqueadas ADD COLUMN IF NOT EXISTS comissao_acumulada DECIMAL(10,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS lojas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franqueada_id UUID NOT NULL REFERENCES franqueadas(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  dominio VARCHAR(255) UNIQUE NOT NULL,
  logo TEXT,
  cor_primaria VARCHAR(7) DEFAULT '#DB1472',
  cor_secundaria VARCHAR(7) DEFAULT '#F8B81F',
  ativo BOOLEAN DEFAULT true,
  produtos_ativos INTEGER DEFAULT 0,
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),
  UNIQUE(franqueada_id)
);

CREATE INDEX IF NOT EXISTS idx_lojas_franqueada ON lojas(franqueada_id);
CREATE INDEX IF NOT EXISTS idx_lojas_dominio ON lojas(dominio);
CREATE INDEX IF NOT EXISTS idx_lojas_ativo ON lojas(ativo);

ALTER TABLE lojas ENABLE ROW LEVEL SECURITY;
```

---

### **PASSO 2: Testar a Nova Página**

1. Acesse: **http://localhost:3001/admin/franqueadas-unificado**
2. Verifique se as franqueadas aparecem
3. Teste filtros: Todos, Pendentes, Aprovadas, Ativas, Inativas
4. Teste busca por nome, email ou domínio
5. Teste aprovação (se houver pendentes)

---

### **PASSO 3: Substituir a Página Antiga (Quando Pronto)**

**Quando estiver satisfeito com a nova página:**

1. **Backup da antiga:**
   ```bash
   mv app/admin/franqueadas/page.tsx app/admin/franqueadas/page.OLD.tsx
   ```

2. **Mover a nova:**
   ```bash
   mv app/admin/franqueadas-unificado/page.tsx app/admin/franqueadas/page.tsx
   rmdir app/admin/franqueadas-unificado
   ```

3. **Ou simplesmente substitua o conteúdo:**
   - Copie todo o conteúdo de `app/admin/franqueadas-unificado/page.tsx`
   - Cole em `app/admin/franqueadas/page.tsx`

---

### **PASSO 4: Remover Páginas Redundantes**

**Depois de testar e confirmar que tudo funciona:**

1. **Remover /admin/franqueados:**
   ```bash
   rm -rf app/admin/franqueados
   rm -rf app/api/admin/franqueados
   ```

2. **Remover /admin/franquias:**
   ```bash
   rm -rf app/admin/franquias
   ```

3. **Atualizar Sidebar:**
   - Abrir `components/Sidebar.tsx`
   - Remover links "Franqueados" e "Franquias"
   - Manter apenas "Franqueadas"

---

## 📊 Comparação: Antes vs Depois

### **ANTES (Confuso):**
```
❌ /admin/franqueadas    → Aprovar/Rejeitar
❌ /admin/franqueados    → Lista com vendas
❌ /admin/franquias      → Domínio e logo
```

### **DEPOIS (Unificado):**
```
✅ /admin/franqueadas    → TUDO EM UM SÓ LUGAR!
   - Aprovação/Rejeição
   - Dados pessoais
   - Dados da loja
   - Vendas e comissões
   - Ativar/desativar loja
```

---

## 🎯 Funcionalidades da Página Unificada

### **Filtros:**
- 📊 Todos os Status
- ⏳ Pendentes (aguardando aprovação)
- ✓ Aprovadas
- ✕ Rejeitadas
- 🟢 Lojas Ativas (aprovadas + loja ativa)
- 🔴 Lojas Inativas (aprovadas + loja inativa)

### **Busca:**
- Por nome da franqueada
- Por email
- Por domínio da loja

### **Estatísticas (5 cards):**
- Pendentes (amarelo)
- Aprovadas (verde)
- Rejeitadas (vermelho)
- Lojas Ativas (azul)
- Lojas Inativas (cinza)

### **Informações Exibidas:**
**Dados Pessoais:**
- 📧 Email
- 📱 Telefone
- 🆔 CPF
- 📍 Cidade/Estado

**Dados da Loja:**
- 🏷️ Nome da loja
- 🌐 Domínio
- 📦 Produtos ativos

**Dados Financeiros:**
- 💵 Total de vendas
- 💸 Comissão acumulada
- 📅 Data de cadastro

### **Ações:**
**Para Pendentes:**
- ✓ Aprovar (vincula produtos automaticamente)
- ✕ Rejeitar (com campo de observação)

**Para Aprovadas:**
- 🟢/🔴 Ativar/Desativar Loja

---

## 🔄 Migração de Dados Existentes

Se você já tem dados nas tabelas antigas:

```sql
-- Migrar dados de franqueados para franqueadas (se necessário)
-- Executar apenas se tiver dados em 'franqueados'

-- Exemplo: copiar vendas_total se existir
UPDATE franqueadas f
SET vendas_total = (
  SELECT COALESCE(SUM(total), 0)
  FROM vendas v
  WHERE v.franqueada_id = f.id
);

-- Criar lojas para franqueadas aprovadas (exemplo)
INSERT INTO lojas (franqueada_id, nome, dominio, ativo)
SELECT 
  id as franqueada_id,
  nome || ' - Loja' as nome,
  LOWER(REPLACE(nome, ' ', '')) as dominio,
  true as ativo
FROM franqueadas
WHERE status = 'aprovada'
AND NOT EXISTS (
  SELECT 1 FROM lojas WHERE lojas.franqueada_id = franqueadas.id
);
```

---

## ✅ Checklist de Testes

- [ ] Migration 010 aplicada no Supabase
- [ ] Página `/admin/franqueadas-unificado` acessível
- [ ] Filtro "Todos" mostra todas as franqueadas
- [ ] Filtro "Pendentes" mostra apenas pendentes
- [ ] Filtro "Ativas" mostra apenas com loja ativa
- [ ] Busca funciona (nome/email/domínio)
- [ ] Estatísticas exibem valores corretos
- [ ] Botão "Aprovar" funciona
- [ ] Botão "Rejeitar" funciona
- [ ] Botão "Ativar/Desativar Loja" funciona
- [ ] Badges de status aparecem corretamente
- [ ] Logo da loja é exibida (se houver)

---

## 🐛 Troubleshooting

### **Erro: "Could not find the table 'lojas'"**
```sql
-- Aplicar migration 010
-- Ver: migrations/010_unify_franqueadas_structure.sql
```

### **Lojas não aparecem:**
```sql
-- Verificar se existem lojas
SELECT COUNT(*) FROM lojas;

-- Se zero, criar lojas de teste:
INSERT INTO lojas (franqueada_id, nome, dominio, ativo)
VALUES (
  (SELECT id FROM franqueadas WHERE status = 'aprovada' LIMIT 1),
  'Loja Teste',
  'lojateste',
  true
);
```

### **Filtros "Ativa/Inativa" não funcionam:**
- Certifique-se que migration 010 foi aplicada
- Verifique se existem lojas criadas
- Verifique campo `ativo` na tabela `lojas`

---

## 📁 Arquivos Criados/Modificados

**Novos:**
- `migrations/010_unify_franqueadas_structure.sql`
- `app/admin/franqueadas-unificado/page.tsx`
- `docs/UNIFICACAO_FRANQUEADAS.md` (este arquivo)

**Modificados:**
- `app/api/admin/franqueadas/list/route.ts` (join com lojas)
- `app/api/admin/franqueadas/action/route.ts` (ação toggle-loja)

**A Remover (depois de testar):**
- `app/admin/franqueados/` (diretório completo)
- `app/admin/franquias/` (diretório completo)
- `app/api/admin/franqueados/` (se existir)

---

**Criado em:** 21 de outubro de 2025  
**Status:** ✅ Pronto para testar
