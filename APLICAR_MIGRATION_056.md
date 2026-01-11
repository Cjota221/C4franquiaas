# 🚨 URGENTE: Aplicar Migration 056 - Desativar Produtos Margem Zero

## Problema Identificado
Produtos com `margin_percent = 0` estão aparecendo no site público das revendedoras com o **preço base** (sem margem), mesmo após as correções na API.

## Causa Raiz
- Produtos existentes têm `is_active = true` mas `margin_percent = 0`
- A API filtra por `is_active = true`, então eles aparecem
- O cálculo `preco_base * (1 + 0/100)` = preço base (sem lucro)

## Solução
Aplicar a migration `056_desativar_produtos_margem_zero.sql` que:
1. **Desativa** todos os produtos com margem 0% que estão ativos
2. **Cria trigger** que IMPEDE ativação futura sem margem

## Como Aplicar

### Opção 1: Via Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto C4
3. Vá em **SQL Editor**
4. Cole todo o conteúdo do arquivo `migrations/056_desativar_produtos_margem_zero.sql`
5. Execute (F5 ou botão Run)

### Opção 2: Via CLI (se disponível)
```bash
supabase db push --file migrations/056_desativar_produtos_margem_zero.sql
```

## Verificação Após Aplicar

Execute esta query para confirmar que funcionou:

```sql
-- Deve retornar ZERO linhas
SELECT COUNT(*) as produtos_problematicos
FROM reseller_products
WHERE is_active = true 
  AND (margin_percent IS NULL OR margin_percent = 0)
  AND (custom_price IS NULL OR custom_price = 0);
```

## Resultado Esperado
- ✅ Produtos com margem 0% serão desativados
- ✅ Eles NÃO aparecerão mais no site público
- ✅ Revendedora precisa definir margem ANTES de ativar
- ✅ Trigger previne ativação sem margem no futuro

## O Que a Revendedora Precisa Fazer
1. Acessar painel → Produtos
2. Ver lista de produtos desativados
3. Definir margem de lucro (ex: 30%)
4. Ativar o produto

---

**Data:** 10/01/2026  
**Status:** PENDENTE APLICAÇÃO
