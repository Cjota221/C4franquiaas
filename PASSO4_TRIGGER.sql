-- PASSO 4: Criar trigger (EXECUTE DEPOIS DO PASSO 3)

CREATE OR REPLACE FUNCTION update_banner_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_banner_submissions_updated_at
  BEFORE UPDATE ON banner_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_banner_submissions_updated_at();
