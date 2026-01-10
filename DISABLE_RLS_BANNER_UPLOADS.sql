-- 🔧 DESABILITAR RLS NO BUCKET BANNER-UPLOADS (TEMPORÁRIO)

-- Tornar o bucket completamente público (sem RLS)
UPDATE storage.buckets 
SET public = true,
    file_size_limit = NULL,
    allowed_mime_types = NULL
WHERE id = 'banner-uploads';

-- Verificar
SELECT id, name, public, file_size_limit, allowed_mime_types 
FROM storage.buckets 
WHERE id = 'banner-uploads';
