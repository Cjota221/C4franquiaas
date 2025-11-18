-- Migration: Adicionar suporte para Webhooks FácilZap
-- Data: 18/11/2025
-- Descrição: Adiciona campos e tabelas necessários para sincronização via webhook

-- 1. Adicionar coluna facilzap_id na tabela produtos (se não existir)
ALTER TABLE produtos 
ADD COLUMN IF NOT EXISTS facilzap_id VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS sincronizado_facilzap BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ultima_sincronizacao TIMESTAMP;

-- 2. Criar índice para busca rápida por facilzap_id
CREATE INDEX IF NOT EXISTS idx_produtos_facilzap_id ON produtos(facilzap_id);

-- 3. Criar tabela de logs de sincronização
CREATE TABLE IF NOT EXISTS logs_sincronizacao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL, -- 'estoque_zerado', 'produto_criado', 'produto_atualizado'
  produto_id UUID REFERENCES produtos(id) ON DELETE CASCADE,
  facilzap_id VARCHAR(255),
  descricao TEXT,
  payload JSONB, -- Armazena o payload completo do webhook
  timestamp TIMESTAMP DEFAULT NOW(),
  sucesso BOOLEAN DEFAULT true,
  erro TEXT
);

-- 4. Criar índices na tabela de logs
CREATE INDEX IF NOT EXISTS idx_logs_tipo ON logs_sincronizacao(tipo);
CREATE INDEX IF NOT EXISTS idx_logs_produto_id ON logs_sincronizacao(produto_id);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs_sincronizacao(timestamp DESC);

-- 5. Comentários nas colunas
COMMENT ON COLUMN produtos.facilzap_id IS 'ID do produto no sistema FácilZap para sincronização';
COMMENT ON COLUMN produtos.sincronizado_facilzap IS 'Indica se o produto está sincronizado com FácilZap';
COMMENT ON COLUMN produtos.ultima_sincronizacao IS 'Data/hora da última sincronização via webhook';

COMMENT ON TABLE logs_sincronizacao IS 'Registro de eventos de sincronização com FácilZap';
COMMENT ON COLUMN logs_sincronizacao.tipo IS 'Tipo de evento: estoque_zerado, produto_criado, produto_atualizado';
COMMENT ON COLUMN logs_sincronizacao.payload IS 'Payload JSON completo recebido do webhook';

-- 6. Criar função para limpar logs antigos (manter últimos 90 dias)
CREATE OR REPLACE FUNCTION limpar_logs_sincronizacao_antigos()
RETURNS void AS $$
BEGIN
  DELETE FROM logs_sincronizacao
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 7. Criar trigger para atualizar timestamp automaticamente
CREATE OR REPLACE FUNCTION atualizar_ultima_sincronizacao()
RETURNS TRIGGER AS $$
BEGIN
  NEW.ultima_sincronizacao = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_sincronizacao
  BEFORE UPDATE ON produtos
  FOR EACH ROW
  WHEN (NEW.sincronizado_facilzap = true)
  EXECUTE FUNCTION atualizar_ultima_sincronizacao();

-- 8. View para estatísticas de sincronização
CREATE OR REPLACE VIEW vw_estatisticas_sincronizacao AS
SELECT 
  COUNT(*) FILTER (WHERE sincronizado_facilzap = true) as produtos_sincronizados,
  COUNT(*) FILTER (WHERE sincronizado_facilzap = false) as produtos_nao_sincronizados,
  COUNT(*) FILTER (WHERE ultima_sincronizacao > NOW() - INTERVAL '1 hour') as sincronizados_ultima_hora,
  COUNT(*) FILTER (WHERE ultima_sincronizacao > NOW() - INTERVAL '24 hours') as sincronizados_ultimo_dia,
  MAX(ultima_sincronizacao) as ultima_sincronizacao_global
FROM produtos;

-- 9. Query útil: Produtos com estoque zero que precisam ser desativados
CREATE OR REPLACE VIEW vw_produtos_estoque_zero AS
SELECT 
  p.id,
  p.nome,
  p.facilzap_id,
  p.estoque,
  p.ultima_sincronizacao,
  COUNT(DISTINCT pfp.id) as franqueadas_ativas,
  COUNT(DISTINCT rp.reseller_id) as revendedoras_ativas
FROM produtos p
LEFT JOIN produtos_franqueadas_precos pfp ON pfp.produto_franqueada_id IN (
  SELECT pf.id FROM produtos_franqueadas pf WHERE pf.produto_id = p.id
) AND pfp.ativo_no_site = true
LEFT JOIN reseller_products rp ON rp.product_id = p.id AND rp.is_active = true
WHERE p.estoque = 0 
  AND p.sincronizado_facilzap = true
GROUP BY p.id, p.nome, p.facilzap_id, p.estoque, p.ultima_sincronizacao
HAVING COUNT(DISTINCT pfp.id) > 0 OR COUNT(DISTINCT rp.reseller_id) > 0;

-- 10. Política RLS para logs_sincronizacao (apenas admin pode ver)
ALTER TABLE logs_sincronizacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins podem ver logs" ON logs_sincronizacao
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM perfis
      WHERE perfis.id = auth.uid()
      AND perfis.papel = 'admin'
    )
  );

-- 11. Adicionar comentário final
COMMENT ON COLUMN produtos.facilzap_id IS 'ID único do produto no FácilZap. Usado para sincronização via webhook. Deve ser único.';

-- Finalizado!
-- Execute esta migration no Supabase SQL Editor
