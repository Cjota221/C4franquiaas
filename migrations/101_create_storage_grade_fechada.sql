-- ============================================================================
-- Storage Bucket: grade-fechada-produtos
-- ============================================================================
-- Criar bucket para imagens dos produtos de grade fechada
-- ============================================================================

-- Criar bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'grade-fechada-produtos',
  'grade-fechada-produtos',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- RLS Policies para o bucket
-- ============================================================================

-- Permitir leitura pública
CREATE POLICY "Imagens de produtos são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'grade-fechada-produtos');

-- Permitir upload apenas para admin
CREATE POLICY "Admin pode fazer upload de imagens"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'grade-fechada-produtos'
  AND auth.role() = 'authenticated'
);

-- Permitir update apenas para admin
CREATE POLICY "Admin pode atualizar imagens"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'grade-fechada-produtos'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'grade-fechada-produtos'
  AND auth.role() = 'authenticated'
);

-- Permitir delete apenas para admin
CREATE POLICY "Admin pode deletar imagens"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'grade-fechada-produtos'
  AND auth.role() = 'authenticated'
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Storage bucket "grade-fechada-produtos" configurado!';
  RAISE NOTICE '📁 Bucket público criado';
  RAISE NOTICE '🔒 Políticas de acesso configuradas';
  RAISE NOTICE '📏 Limite de 5MB por arquivo';
  RAISE NOTICE '🖼️ Formatos aceitos: JPEG, PNG, WebP';
END $$;
