# 🔄 Aplicar Migration 042 - Desconto Progressivo

## O que foi implementado

### Sistema "Leve Mais Pague Menos" (Desconto Progressivo)

Agora você pode criar promoções com faixas de desconto por quantidade:
- **2 peças** = 10% de desconto
- **3 peças** = 20% de desconto  
- **5 peças** = 30% de desconto
- etc.

### Melhorias Visuais

1. **Tag de promoção redesenhada**: 
   - Agora é um badge pequeno e arredondado no canto superior direito da foto
   - Cores mais sutis com transparência
   - Não "polui" mais a imagem

2. **Cronômetro reposicionado**:
   - Agora aparece em uma linha fina entre a foto e as informações do produto
   - Design discreto e elegante

### Cálculo Automático no Carrinho

O sistema calcula automaticamente o desconto baseado na quantidade de itens:
- Se o cliente adicionar 3 peças de produtos em promoção, ganha o desconto da faixa de 3 peças
- O desconto maior se aplica quando a quantidade atinge a próxima faixa

---

## 📋 Passo a Passo

### 1. Executar no SQL Editor do Supabase

Acesse: https://supabase.com/dashboard/project/SEU_PROJETO/sql/new

Cole e execute:

```sql
-- Migration 042: Sistema de Desconto Progressivo
ALTER TABLE promotions 
ADD COLUMN IF NOT EXISTS progressive_discounts JSONB DEFAULT NULL;

COMMENT ON COLUMN promotions.progressive_discounts IS 'Faixas de desconto progressivo. Formato: [{"min_items": 2, "discount_percent": 10}, {"min_items": 3, "discount_percent": 20}]';
```

### 2. Testar

1. Vá em **Promoções** no painel da revendedora
2. Crie uma nova promoção do tipo **"Leve Mais Pague Menos"**
3. Adicione as faixas de desconto:
   - 2 peças = 10%
   - 3 peças = 20%
   - 5 peças = 30%
4. Selecione os produtos que participam
5. Salve e verifique no catálogo

---

## 🎯 Como funciona para o cliente

1. Cliente vê a tag sutil **"2+ peças = 10% OFF"** no produto
2. Se a promoção tiver data de término, aparece um timer discreto abaixo da foto
3. Ao adicionar produtos ao carrinho, o desconto é calculado automaticamente
4. O carrinho mostra: **"3 peças = 20% OFF"** quando aplicável

---

## ✅ Arquivos Modificados

- `migrations/042_desconto_progressivo.sql` - Nova migration
- `app/revendedora/promocoes/page.tsx` - Formulário com builder de faixas
- `app/catalogo/[slug]/layout.tsx` - Cálculo de descontos progressivos
- `app/catalogo/[slug]/page.tsx` - Tag e timer redesenhados
