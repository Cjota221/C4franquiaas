-- Atualizar token do Melhor Envio com data de expiração
-- Execute este SQL no Supabase SQL Editor

UPDATE config_melhorenvio
SET expires_at = '2026-11-02 00:00:00'
WHERE id = 1;

-- Verificar
SELECT id, 
       LEFT(access_token, 50) as token_preview, 
       token_type, 
       expires_at,
       created_at, 
       updated_at 
FROM config_melhorenvio 
WHERE id = 1;
