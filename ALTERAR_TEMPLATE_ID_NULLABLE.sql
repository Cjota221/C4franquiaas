-- Permitir que template_id seja NULL para banners customizados (upload próprio)
-- Execute este SQL no Supabase SQL Editor

ALTER TABLE banner_submissions 
ALTER COLUMN template_id DROP NOT NULL;

-- Comentário: Agora banners customizados podem ser salvos sem template_id
