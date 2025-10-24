-- ============================================================================
-- MIGRATION 017: Customização Avançada da Logomarca
-- ============================================================================
-- Adiciona campos para customização visual completa da logo no painel admin
-- ============================================================================

BEGIN;

-- Adiciona campos de customização da logo
ALTER TABLE lojas
ADD COLUMN IF NOT EXISTS logo_largura_max INTEGER DEFAULT 280,
ADD COLUMN IF NOT EXISTS logo_altura_max INTEGER DEFAULT 80,
ADD COLUMN IF NOT EXISTS logo_formato VARCHAR(20) DEFAULT 'horizontal',
ADD COLUMN IF NOT EXISTS logo_padding INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS logo_fundo_tipo VARCHAR(20) DEFAULT 'transparente',
ADD COLUMN IF NOT EXISTS logo_fundo_cor VARCHAR(50) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS logo_border_radius INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS logo_mostrar_sombra BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN lojas.logo_largura_max IS 'Largura máxima da logo em pixels (padrão: 280px)';
COMMENT ON COLUMN lojas.logo_altura_max IS 'Altura máxima da logo em pixels (padrão: 80px)';
COMMENT ON COLUMN lojas.logo_formato IS 'Formato de exibição da logo: horizontal ou redondo';
COMMENT ON COLUMN lojas.logo_padding IS 'Espaçamento interno da logo em pixels (padrão: 0px)';
COMMENT ON COLUMN lojas.logo_fundo_tipo IS 'Tipo de fundo: transparente, solido, redondo';
COMMENT ON COLUMN lojas.logo_fundo_cor IS 'Cor de fundo em hexadecimal (ex: #FFFFFF) - usado quando logo_fundo_tipo = solido ou redondo';
COMMENT ON COLUMN lojas.logo_border_radius IS 'Arredondamento das bordas em pixels (0 = quadrado, 50 = circular)';
COMMENT ON COLUMN lojas.logo_mostrar_sombra IS 'Se deve exibir sombra ao redor da logo';

COMMIT;

-- ✅ Migration 017 concluída
-- Próximos passos:
-- 1. Aplicar esta migration no Supabase
-- 2. Atualizar o componente LojaHeader para consumir essas configurações
-- 3. Criar UI no painel admin para configurar esses valores
