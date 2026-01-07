# 🚨 RELATÓRIO DE PROBLEMAS - Promoções

## 📊 RESUMO GERAL

- **Total de promoções:** 5
- **Ativas:** 3
- **Inativas:** 2
- **Expiradas (mas ainda ativas):** 1

---

## ❌ PROBLEMAS ENCONTRADOS

### **PROBLEMA 1: Promoção incompleta**

**Promoção:** "Promo de Janeiro" (ID: 267469ce-44da-4d14-8bc8-0dc9e0b56304)

- **Tipo:** Leve Mais Pague Menos (`leve_pague`)
- **Status:** ✅ Ativa
- **Problema:** ❌ **Não tem configuração de desconto progressivo NEM leve X pague Y**
  - Campo `progressive_discounts`: vazio ou null
  - Campos `buy_quantity` e `pay_quantity`: vazios
- **Impacto:** Promoção **NÃO FUNCIONA** no catálogo (não calcula desconto)
- **Revendedora:** 29657534-930c-4df0-82c5-f63177b39fa4

**✅ SOLUÇÃO:**

1. Editar a promoção no painel
2. Configurar as faixas de desconto:
   - Ex: 2 peças = 10% OFF
   - Ex: 3 peças = 15% OFF
3. OU desativar se não for mais necessária

---

### **PROBLEMA 2: Cupom expirado ainda ativo**

**Promoção:** "primeira compra" (ID: 973ccae2-8862-4fc4-b7ba-423df338d71c)

- **Tipo:** Cupom de Desconto
- **Código:** BEMVINDA
- **Desconto:** 5%
- **Data de expiração:** 10/01/2026 (JÁ PASSOU!)
- **Status:** ✅ Ainda está ativa
- **Problema:** Cliente pode tentar usar, mas sistema deve rejeitar por estar expirada
- **Revendedora:** f98cb0c0-7806-411f-aeb8-f4dea3618605

**✅ SOLUÇÃO:**

1. Desativar manualmente a promoção no painel
2. OU implementar job automático que desativa promoções expiradas

---

### **PROBLEMA 3: Dois cupons com mesmo código**

**Conflito:**

- Cupom "Boas Vindas" (revendedora A): Código **BEMVINDA** - 10% OFF
- Cupom "primeira compra" (revendedora B): Código **BEMVINDA** - 5% OFF

**Problema:** Se as revendedoras forem diferentes, não há problema (escopo por revendedora). Mas se for a mesma, pode confundir.

**✅ SOLUÇÃO:**
Verificar se são revendedoras diferentes (parecem ser IDs diferentes, então está OK).

---

## ✅ PROMOÇÕES QUE ESTÃO OK

### 1. **"Boas Vindas"** (ID: 78706fb7-7856-4384-93ce-996875a6f65d)

- ✅ Tipo: Cupom de Desconto
- ✅ Código: BEMVINDA
- ✅ Desconto: 10%
- ✅ Expira: 21/01/2026 (ainda válido)
- ✅ Aplicar: Todos os produtos

### 2. **Promoção de desconto em valor** (1 inativa)

- Parece estar desativada intencionalmente

---

## 🔧 AÇÕES RECOMENDADAS

### **AÇÃO 1: Corrigir "Promo de Janeiro"**

```sql
-- Opção A: Adicionar desconto progressivo
UPDATE promotions
SET progressive_discounts = '[
  {"min_items": 2, "discount_percent": 10},
  {"min_items": 3, "discount_percent": 15},
  {"min_items": 5, "discount_percent": 20}
]'::jsonb
WHERE id = '267469ce-44da-4d14-8bc8-0dc9e0b56304';

-- OU Opção B: Desativar
UPDATE promotions
SET is_active = false
WHERE id = '267469ce-44da-4d14-8bc8-0dc9e0b56304';
```

### **AÇÃO 2: Desativar cupom expirado**

```sql
UPDATE promotions
SET is_active = false
WHERE id = '973ccae2-8862-4fc4-b7ba-423df338d71c';
```

### **AÇÃO 3: Implementar job de limpeza automática**

Criar uma função que roda diariamente e desativa promoções expiradas:

```sql
-- Função para desativar promoções expiradas
CREATE OR REPLACE FUNCTION desativar_promocoes_expiradas()
RETURNS void AS $$
BEGIN
  UPDATE promotions
  SET is_active = false
  WHERE is_active = true
    AND ends_at IS NOT NULL
    AND ends_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## 📈 ESTATÍSTICAS

### Promoções por Revendedora:

- **Revendedora A** (29657534...): 2 promoções (1 OK, 1 problema)
- **Revendedora B** (f98cb0c0...): 1 promoção (expirada)

### Tipos mais usados:

1. Cupom de Desconto: 2
2. Leve Mais Pague Menos: 2
3. Desconto em Valor: 1

---

## ✅ CHECKLIST DE CORREÇÃO

- [ ] Corrigir ou desativar "Promo de Janeiro"
- [ ] Desativar cupom "primeira compra" (expirado)
- [ ] (Opcional) Implementar job de limpeza automática
- [ ] Testar promoções restantes no catálogo
- [ ] Documentar para revendedoras como configurar corretamente

---

**QUER QUE EU EXECUTE AS CORREÇÕES AGORA?** 🛠️

Posso:

1. Gerar o SQL para corrigir
2. Aplicar as correções no banco
3. Testar as promoções corrigidas
