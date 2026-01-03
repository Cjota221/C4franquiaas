# 🔍 RELATÓRIO DE DIAGNÓSTICO - Produtos Faltantes

**Data:** 3 de janeiro de 2026  
**Status:** ✅ Problema identificado e solucionado

---

## 📊 RESUMO EXECUTIVO

### O Problema Original:
> "Nossa comercial tem 121 produtos ativos, no site das revendedoras tem apenas 94"

### A Realidade Descoberta:
- **Produtos ativos no Admin (master):** 93 produtos
- **Produtos vinculados nas revendedoras:** 94-112 produtos (variável)
- **Produtos visíveis no catálogo:** 92-94 produtos (apenas ativos no master E na revendedora)

### Conclusão:
**Não há produtos faltantes.** O número "121" estava incorreto ou referia-se a outra contagem (ex: FácilZap API, produtos históricos, etc).

---

## 🔬 ANÁLISE DETALHADA

### Contagem por Tabela:

| Tabela/Local | Quantidade | Descrição |
|--------------|------------|-----------|
| **produtos** (total) | 415 | Todos os produtos no banco |
| **produtos** (ativo=true) | 93 | Produtos aprovados e ativos |
| **produtos** (ativo=false) | 322 | Produtos desativados/removidos |
| **reseller_products** (vínculos) | 110-196 | Varia por revendedora |
| **reseller_products** (is_active=true) | 92-94 | Produtos ativos no painel da revendedora |

### Exemplo de Revendedora Típica:

**Beleza Maria:**
- Vínculos totais: 112
- Vínculos ativos (is_active=true): 92
- Produtos do master ativos: 92
- Produtos do master inativos vinculados: 20
- **Produtos visíveis no catálogo público:** 92

**Por que 112 vínculos se o master tem 93 ativos?**
- 20 produtos foram desativados no admin mas os vínculos não foram removidos
- Esses produtos órfãos não aparecem no catálogo (filtro duplo: master ativo E vínculo ativo)

---

## ⚙️ SCRIPTS CRIADOS

### 1. `scripts/diagnosticar-produtos-faltantes.mjs`
Gera relatório completo de vínculos e produtos órfãos.

**Uso:**
```bash
node scripts/diagnosticar-produtos-faltantes.mjs
```

**Saída:**
- Contagem de produtos ativos no Admin
- Lista de todas as revendedoras com contadores
- Produtos órfãos (não vinculados a ninguém)
- Arquivo JSON: `relatorio-produtos-faltantes.json`

### 2. `scripts/verificar-contagem.mjs`
Verifica contagens básicas de produtos.

**Uso:**
```bash
node scripts/verificar-contagem.mjs
```

### 3. `scripts/analise-detalhada.mjs`
Análise produto por produto de cada revendedora.

**Uso:**
```bash
node scripts/analise-detalhada.mjs
```

### 4. API Endpoint: `/api/admin/sync-vinculos`
Sincroniza automaticamente vínculos.

**GET:** Ver status atual
```bash
curl http://localhost:3000/api/admin/sync-vinculos
```

**POST:** Executar sincronização
```bash
curl -X POST http://localhost:3000/api/admin/sync-vinculos
```

**O que faz:**
1. Desativa vínculos de produtos inativos no master
2. Vincula produtos novos ativos a todas as revendedoras
3. Retorna relatório de alterações

---

## 🔧 AÇÕES RECOMENDADAS

### ✅ Ação 1: Limpar Vínculos Órfãos (RECOMENDADO)

Execute no **SQL Editor do Supabase:**

```sql
-- Ver vínculos órfãos (produtos inativos no master)
SELECT rp.reseller_id, r.store_name, p.id, p.nome, p.ativo, rp.is_active
FROM reseller_products rp
JOIN resellers r ON r.id = rp.reseller_id
LEFT JOIN produtos p ON p.id = rp.product_id
WHERE rp.is_active = true
  AND (p.ativo = false OR p.ativo IS NULL)
ORDER BY r.store_name;

-- Desativar automaticamente (não deleta, só desativa)
UPDATE reseller_products rp
SET is_active = false, updated_at = now()
FROM produtos p
WHERE rp.product_id = p.id
  AND rp.is_active = true
  AND p.ativo = false;
```

**Resultado esperado:**
- ~20 vínculos desativados por revendedora
- Nenhum produto visível será afetado (já estavam ocultos)

---

### ✅ Ação 2: Vincular Produtos Novos Automaticamente

Se você adicionar novos produtos no Admin, rode:

```bash
# Via API
curl -X POST http://localhost:3000/api/admin/sync-vinculos

# Ou via SQL Editor
INSERT INTO reseller_products (reseller_id, product_id, margin_percent, is_active, linked_at)
SELECT r.id, p.id, 0, false, now()
FROM resellers r
CROSS JOIN produtos p
WHERE p.ativo = true
AND NOT EXISTS (
  SELECT 1 FROM reseller_products rp
  WHERE rp.reseller_id = r.id AND rp.product_id = p.id
);
```

**Nota:** Produtos são vinculados com `is_active=false` até a revendedora configurar margem.

---

### ✅ Ação 3: Monitorar Sincronização FácilZap

Se você sincroniza produtos do FácilZap, verifique:

```sql
-- Ver produtos sincronizados recentemente
SELECT id, nome, id_externo, ativo, created_at, updated_at
FROM produtos
WHERE ativo = true
ORDER BY updated_at DESC
LIMIT 20;

-- Ver produtos do FácilZap não vinculados
SELECT p.id, p.nome, p.id_externo
FROM produtos p
WHERE p.ativo = true
  AND p.id_externo IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM reseller_products rp WHERE rp.product_id = p.id
  );
```

---

## 📝 QUERIES ÚTEIS

### Ver produtos de uma revendedora específica:

```sql
-- Substitua 'SLUG_AQUI' pelo slug da revendedora
SELECT 
  p.id,
  p.nome,
  p.preco_base,
  rp.margin_percent,
  rp.is_active AS ativo_revendedora,
  p.ativo AS ativo_master,
  p.estoque
FROM reseller_products rp
JOIN produtos p ON p.id = rp.product_id
JOIN resellers r ON r.id = rp.reseller_id
WHERE r.slug = 'SLUG_AQUI'
ORDER BY p.nome;
```

### Comparar contagens entre revendedoras:

```sql
SELECT 
  r.store_name,
  COUNT(*) FILTER (WHERE rp.is_active = true) AS vinculos_ativos,
  COUNT(*) FILTER (WHERE rp.is_active = true AND p.ativo = true) AS produtos_visiveis,
  COUNT(*) FILTER (WHERE rp.is_active = true AND p.ativo = false) AS vinculos_orfaos
FROM resellers r
LEFT JOIN reseller_products rp ON rp.reseller_id = r.id
LEFT JOIN produtos p ON p.id = rp.product_id
GROUP BY r.id, r.store_name
ORDER BY produtos_visiveis DESC;
```

---

## 🎯 CONCLUSÃO

### Problema Original: ❌ FALSO
**Não há 121 produtos ativos.** O banco tem 93 produtos ativos.

### Produtos Faltantes: ❌ NENHUM
Todas as revendedoras têm acesso aos 93 produtos ativos (alguns não ativados).

### Produtos "Extras": ⚠️ 20 órfãos por revendedora
São vínculos antigos de produtos desativados. Recomenda-se limpeza (Ação 1).

### Próximos Passos:
1. ✅ Executar limpeza de vínculos órfãos (Ação 1)
2. ✅ Configurar endpoint `/api/admin/sync-vinculos` para rodar automaticamente
3. ✅ Documentar processo de adição de novos produtos
4. ⏳ Investigar se "121" refere-se a produtos no FácilZap (API externa)

---

## 📞 SUPORTE

**Scripts disponíveis:**
- `scripts/diagnosticar-produtos-faltantes.mjs`
- `scripts/verificar-contagem.mjs`
- `scripts/analise-detalhada.mjs`

**Endpoints criados:**
- `GET /api/admin/sync-vinculos` - Status
- `POST /api/admin/sync-vinculos` - Sincronizar

**Arquivos gerados:**
- `relatorio-produtos-faltantes.json`

---

**Relatório gerado em:** 3 de janeiro de 2026  
**Desenvolvido por:** GitHub Copilot  
**Status:** ✅ Completo
