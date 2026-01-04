-- PASSO 2: Adicionar foreign keys (EXECUTE DEPOIS DO PASSO 1)
-- ⚠️ PULAR ESTE PASSO POR ENQUANTO - foreign keys causando erro
-- Vamos adicionar depois quando descobrir o nome correto da tabela de usuários

-- ALTER TABLE banner_submissions
--   ADD CONSTRAINT fk_banner_submissions_user 
--   FOREIGN KEY (user_id) REFERENCES perfil(id) ON DELETE CASCADE;

ALTER TABLE banner_submissions
  ADD CONSTRAINT fk_banner_submissions_template 
  FOREIGN KEY (template_id) REFERENCES banner_templates(id) ON DELETE CASCADE;

-- NOTA: Se precisar descobrir o nome da tabela de usuários, execute:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE '%user%' OR table_name LIKE '%perfil%' OR table_name LIKE '%revend%';
