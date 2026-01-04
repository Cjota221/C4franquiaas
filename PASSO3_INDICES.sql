-- PASSO 3: Criar índices (EXECUTE DEPOIS DO PASSO 2)

CREATE INDEX idx_banner_submissions_user ON banner_submissions(user_id);
CREATE INDEX idx_banner_submissions_status ON banner_submissions(status);
CREATE INDEX idx_banner_submissions_template ON banner_submissions(template_id);
CREATE INDEX idx_banner_submissions_created ON banner_submissions(created_at DESC);
