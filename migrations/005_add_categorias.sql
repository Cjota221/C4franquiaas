-- Migration: add categorias and produto_categorias (many-to-many)
BEGIN;

CREATE TABLE IF NOT EXISTS categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  descricao text,
  criado_em timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS produto_categorias (
  produto_id uuid NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  categoria_id uuid NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  criado_em timestamptz DEFAULT now(),
  PRIMARY KEY (produto_id, categoria_id)
);

COMMIT;
