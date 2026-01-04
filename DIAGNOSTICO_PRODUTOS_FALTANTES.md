# 🔍 Análise de Produtos Faltantes - Revendedoras

## 📊 DIAGNÓSTICO COMPLETO

### **Situação Encontrada:**

- **Total de produtos ativos no Admin Master:** 92
- **Total de revendedoras ativas:** 23
- **Problemas encontrados:** 23 (todas as revendedoras)

---

## 🎯 PROBLEMA IDENTIFICADO

### **1. Produto Faltante (22 revendedoras):**

**Produto:** `Rasteirinha Feminina Isís Basic Prata Branco`

**Afetadas:** 22 de 23 revendedoras (todas exceto CACAU SHOES e vivaz)

**Causa:** Produto foi adicionado ao master DEPOIS da última sincronização automática

**Impacto:** Revendedoras têm 91 produtos ao invés de 92

---

### **2. Produtos Órfãos (2 revendedoras):**

**Revendedoras:** CACAU SHOES e vivaz

**Produtos vinculados mas inativos no master:**

- `Kit 6 peças Grade Sandália Josie Off White`
- `Kit 6 peças Grade Sandália Bruna Prata`

**Causa:** Produtos foram desativados no master mas os vínculos não foram atualizados

**Impacto:** Essas 2 revendedoras mostram 93 produtos (incluindo 2 produtos mortos)

---

## ✅ SOLUÇÃO AUTOMÁTICA

Criamos um endpoint que corrige automaticamente ambos os problemas:

### **Modo 1: Preview (Seguro - Somente Leitura)**

```bash
GET http://localhost:3000/api/admin/sincronizar-vinculos
```

**O que faz:**

- ✅ Analisa todas as revendedoras
- ✅ Mostra relatório detalhado de problemas
- ❌ Não faz alterações no banco

---

### **Modo 2: Executar (Aplicar Correções)**

```bash
POST http://localhost:3000/api/admin/sincronizar-vinculos?executar=true
```

**O que faz:**

1. **Desativa vínculos órfãos:**
   - CACAU SHOES e vivaz: Remove 2 produtos inativos do catálogo
   - Define `is_active = false` para os vínculos
2. **Vincula produtos faltantes:**
   - Cria vínculo da "Rasteirinha Isís Basic" para todas as 22 revendedoras
   - Com `margin_percent = 0` e `is_active = false` (seguros até configurar)

**Resultado esperado:**

- ✅ Todas as 23 revendedoras terão exatamente 92 produtos sincronizados
- ✅ CACAU SHOES e vivaz: 93 → 92 (produtos mortos removidos)
- ✅ Outras 22: 91 → 92 (produto novo vinculado, mas inativo até configurar margem)

---

## 🚀 COMO EXECUTAR

### **Opção 1: Via Browser (Recomendado)**

1. Acesse: `http://localhost:3000/api/admin/sincronizar-vinculos`
2. Revise o relatório JSON
3. Se estiver OK, acesse: `http://localhost:3000/api/admin/sincronizar-vinculos?executar=true`

---

### **Opção 2: Via Terminal**

```bash
# 1. Iniciar servidor dev (se não estiver rodando)
npm run dev

# 2. Preview (em outro terminal)
node scripts/testar-sincronizacao.mjs

# 3. Se tudo OK, executar via API:
curl -X POST http://localhost:3000/api/admin/sincronizar-vinculos?executar=true
```

---

### **Opção 3: Via Script Direto no Banco**

Se preferir rodar SQL diretamente no Supabase:

```sql
-- 1. DESATIVAR VÍNCULOS ÓRFÃOS (CACAU SHOES + vivaz)
UPDATE reseller_products rp
SET is_active = false, updated_at = now()
FROM produtos p
WHERE rp.product_id = p.id
  AND rp.is_active = true
  AND p.ativo = false;

-- 2. VINCULAR PRODUTO FALTANTE (todas as revendedoras)
INSERT INTO reseller_products (reseller_id, product_id, margin_percent, is_active, linked_at)
SELECT r.id, p.id, 0, false, now()
FROM resellers r
CROSS JOIN produtos p
WHERE r.status = 'aprovada'
  AND p.nome = 'Rasteirinha Feminina Isís Basic Prata Branco'
  AND p.ativo = true
  AND NOT EXISTS (
    SELECT 1 FROM reseller_products rp
    WHERE rp.reseller_id = r.id AND rp.product_id = p.id
  );
```

---

## 📈 CONTADORES ESPERADOS APÓS CORREÇÃO

| Revendedora | Antes           | Depois | Status       |
| ----------- | --------------- | ------ | ------------ |
| CACAU SHOES | 93 (2 órfãos)   | 92     | ✅ Corrigido |
| vivaz       | 93 (2 órfãos)   | 92     | ✅ Corrigido |
| Outras 21   | 91 (1 faltando) | 92     | ✅ Corrigido |

**Total esperado:** Todas com **92 produtos ativos sincronizados**

---

## 🔧 FERRAMENTAS CRIADAS

### **Scripts:**

1. `scripts/testar-sincronizacao.mjs`

   - Análise detalhada de vínculos
   - Execução: `node scripts/testar-sincronizacao.mjs`

2. `scripts/analise-detalhada.mjs`

   - Análise básica de produtos
   - Execução: `node scripts/analise-detalhada.mjs`

3. `scripts/ver-status-revendedoras.mjs`
   - Lista status de todas as revendedoras
   - Execução: `node scripts/ver-status-revendedoras.mjs`

### **Endpoints:**

1. `GET /api/admin/sincronizar-vinculos`

   - Preview de sincronização

2. `POST /api/admin/sincronizar-vinculos?executar=true`
   - Executa sincronização

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

1. **Produto "Rasteirinha Isís Basic":**

   - Será vinculado com `is_active = false` e `margin_percent = 0`
   - Revendedoras precisarão ATIVAR manualmente e definir margem
   - Isso evita que apareça no catálogo sem configuração de preço

2. **Produtos Órfãos:**

   - Serão apenas DESATIVADOS (não deletados)
   - Histórico é preservado
   - Se reativar no master, reaparece automaticamente

3. **Backup Recomendado:**
   - Antes de executar, considere backup da tabela `reseller_products`
   - Ou execute primeiro em ambiente de teste

---

## 📝 PRÓXIMOS PASSOS

1. ✅ **Executar sincronização** (via endpoint ou SQL)
2. ✅ **Verificar contadores** (todas revendedoras devem ter 92 produtos)
3. ✅ **Ativar produto novo** em cada revendedora:

   - Acessar painel da revendedora
   - Ir em Produtos
   - Encontrar "Rasteirinha Isís Basic Prata Branco"
   - Definir margem de lucro
   - Ativar para venda

4. ✅ **Implementar sincronização automática** (futuro):
   - Criar trigger que vincula automaticamente novos produtos
   - Ou job agendado (cron) que roda sincronização diariamente

---

## 🎯 RESUMO DA CONFUSÃO INICIAL

**Você disse:** "121 produtos ativos no admin, mas revendedoras só têm 94"

**Realidade encontrada:**

- Admin: 92 produtos ativos (não 121)
- Revendedoras: 91-93 produtos (variando)

**Possível explicação do "121":**

- Pode estar contando produtos inativos também (93 ativos + ~28 inativos = 121)
- Ou contando variações/SKUs ao invés de produtos únicos
- Ou contando produtos do FácilZap que não foram sincronizados

**Para descobrir de onde vem "121", execute:**

```sql
-- Contar TODOS os produtos (ativos + inativos)
SELECT
  COUNT(*) FILTER (WHERE ativo = true) as ativos,
  COUNT(*) FILTER (WHERE ativo = false) as inativos,
  COUNT(*) as total
FROM produtos;
```

---

**Data da análise:** 3 de janeiro de 2026
**Arquivo:** `DIAGNOSTICO_PRODUTOS_FALTANTES.md`
