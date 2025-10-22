-- Migration 011: Fix produtos_franqueadas ID generation
-- Adiciona geração automática de UUID para o campo id

BEGIN;

-- Adicionar valor padrão para a coluna id
ALTER TABLE produtos_franqueadas 
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Adicionar comentário
COMMENT ON COLUMN produtos_franqueadas.id IS 'Primary key com geração automática de UUID';

COMMIT;

-- Após aplicar esta migration, tente aprovar a franqueada novamente
