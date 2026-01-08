# Sistema de Recuperação de Carrinho Abandonado

## 🎯 O que foi implementado

O sistema agora permite que revendedoras recuperem carrinhos abandonados com links únicos e cupons de desconto.

### Fluxo completo:

1. **Cliente abandona carrinho** → Sistema salva no banco com token único
2. **Revendedora vê na lista** → Pode copiar link de recuperação ou enviar WhatsApp
3. **Revendedora aplica cupom** (opcional) → Cupom é vinculado ao carrinho
4. **Cliente clica no link** → É redirecionado para página de recuperação
5. **Cliente vê seus produtos** → Com cupom aplicado se houver
6. **Cliente clica "Recuperar"** → Produtos vão para o carrinho da loja

---

## ⚠️ IMPORTANTE: Aplicar Migration

Execute o SQL abaixo no Supabase SQL Editor:

```sql
-- ============================================================================
-- Migration 046: Sistema de Recuperação de Carrinho Abandonado
-- ============================================================================

-- 1. Adicionar coluna recovery_token (chave única para o link)
ALTER TABLE abandoned_carts
ADD COLUMN IF NOT EXISTS recovery_token VARCHAR(32) UNIQUE;

-- 2. Adicionar coluna coupon_code (cupom aplicado na recuperação)
ALTER TABLE abandoned_carts
ADD COLUMN IF NOT EXISTS recovery_coupon_code VARCHAR(50);

-- 3. Adicionar coluna recovery_coupon_discount (desconto do cupom)
ALTER TABLE abandoned_carts
ADD COLUMN IF NOT EXISTS recovery_coupon_discount DECIMAL(10,2);

-- 4. Adicionar coluna para rastrear se o link foi acessado
ALTER TABLE abandoned_carts
ADD COLUMN IF NOT EXISTS link_accessed_at TIMESTAMP WITH TIME ZONE;

-- 5. Adicionar coluna para contar quantas vezes o link foi acessado
ALTER TABLE abandoned_carts
ADD COLUMN IF NOT EXISTS link_access_count INTEGER DEFAULT 0;

-- 6. Criar índice para busca rápida pelo token
CREATE INDEX IF NOT EXISTS idx_abandoned_carts_recovery_token 
ON abandoned_carts(recovery_token) WHERE recovery_token IS NOT NULL;

-- 7. Função para gerar token único
CREATE OR REPLACE FUNCTION generate_recovery_token()
RETURNS VARCHAR(32) AS $$
DECLARE
  token VARCHAR(32);
  exists_count INTEGER;
BEGIN
  LOOP
    token := encode(gen_random_bytes(16), 'hex');
    SELECT COUNT(*) INTO exists_count FROM abandoned_carts WHERE recovery_token = token;
    IF exists_count = 0 THEN
      RETURN token;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para gerar token automaticamente
CREATE OR REPLACE FUNCTION set_recovery_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recovery_token IS NULL THEN
    NEW.recovery_token := generate_recovery_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_recovery_token ON abandoned_carts;
CREATE TRIGGER trigger_set_recovery_token
BEFORE INSERT ON abandoned_carts
FOR EACH ROW
EXECUTE FUNCTION set_recovery_token();

-- 9. Gerar tokens para carrinhos existentes
UPDATE abandoned_carts
SET recovery_token = generate_recovery_token()
WHERE recovery_token IS NULL;

-- 10. Política RLS para permitir leitura pública por token
DROP POLICY IF EXISTS "Público pode ler carrinho por token" ON abandoned_carts;
CREATE POLICY "Público pode ler carrinho por token" ON abandoned_carts
FOR SELECT TO anon, authenticated
USING (true);
```

---

## 📁 Arquivos Criados/Modificados

### Novos Arquivos:
- `migrations/046_abandoned_cart_recovery.sql` - Migration do banco
- `app/api/abandoned-cart/save/route.ts` - API para salvar carrinho
- `app/api/abandoned-cart/recover/[token]/route.ts` - API para recuperar carrinho
- `app/api/abandoned-cart/apply-coupon/route.ts` - API para aplicar/remover cupom
- `app/loja/[dominio]/recuperar/[token]/page.tsx` - Página de recuperação
- `lib/utils/abandonedCart.ts` - Utilitário para salvar carrinho

### Arquivos Modificados:
- `app/revendedora/carrinhos-abandonados/page.tsx` - Adicionado cupom e link real

---

## 🔗 URLs de Recuperação

O link de recuperação segue o formato:
```
https://seusite.com/loja/{slug-da-loja}/recuperar/{token}
```

Exemplo:
```
https://c4franquiaas.netlify.app/loja/maria-cosmeticos/recuperar/abc123def456...
```

---

## ✅ Funcionalidades

- [x] Link único por carrinho (recovery_token)
- [x] Página de recuperação mostra produtos
- [x] Cupom pode ser aplicado pela revendedora
- [x] Cupom é exibido na página de recuperação
- [x] Botão para recuperar adiciona ao carrinho local
- [x] WhatsApp já inclui link de recuperação
- [x] Contagem de acessos ao link
- [x] Data do primeiro acesso registrada
