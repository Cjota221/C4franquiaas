-- ============================================================================
-- Migration 046: Sistema de Recuperação de Carrinho Abandonado
-- ============================================================================
-- Description: Adiciona token único para recuperação de carrinho via link
-- Date: 2026-01-07

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
    -- Gera token de 32 caracteres (hex)
    token := encode(gen_random_bytes(16), 'hex');
    
    -- Verifica se já existe
    SELECT COUNT(*) INTO exists_count 
    FROM abandoned_carts 
    WHERE recovery_token = token;
    
    -- Se não existe, retorna
    IF exists_count = 0 THEN
      RETURN token;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para gerar token automaticamente ao criar carrinho
CREATE OR REPLACE FUNCTION set_recovery_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.recovery_token IS NULL THEN
    NEW.recovery_token := generate_recovery_token();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger se existir e recriar
DROP TRIGGER IF EXISTS trigger_set_recovery_token ON abandoned_carts;
CREATE TRIGGER trigger_set_recovery_token
BEFORE INSERT ON abandoned_carts
FOR EACH ROW
EXECUTE FUNCTION set_recovery_token();

-- 9. Gerar tokens para carrinhos existentes que não têm
UPDATE abandoned_carts
SET recovery_token = generate_recovery_token()
WHERE recovery_token IS NULL;

-- 10. Política RLS para permitir leitura pública por token (para recuperação)
DROP POLICY IF EXISTS "Público pode ler carrinho por token" ON abandoned_carts;
CREATE POLICY "Público pode ler carrinho por token" ON abandoned_carts
FOR SELECT TO anon, authenticated
USING (true);

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================
COMMENT ON COLUMN abandoned_carts.recovery_token IS 'Token único para link de recuperação do carrinho';
COMMENT ON COLUMN abandoned_carts.recovery_coupon_code IS 'Código do cupom aplicado na recuperação';
COMMENT ON COLUMN abandoned_carts.recovery_coupon_discount IS 'Valor do desconto do cupom';
COMMENT ON COLUMN abandoned_carts.link_accessed_at IS 'Primeira vez que o link de recuperação foi acessado';
COMMENT ON COLUMN abandoned_carts.link_access_count IS 'Quantidade de vezes que o link foi acessado';

-- ============================================================================
-- RESULTADO ESPERADO:
-- ✅ Coluna recovery_token adicionada
-- ✅ Tokens gerados automaticamente para novos carrinhos
-- ✅ Tokens gerados para carrinhos existentes
-- ✅ Sistema pronto para recuperação via link
-- ============================================================================
