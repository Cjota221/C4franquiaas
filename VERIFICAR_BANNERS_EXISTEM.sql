-- ============================================================================
-- VERIFICAR SE OS BANNERS APROVADOS EXISTEM
-- ============================================================================
-- Execute esta query para confirmar que seus banners NÃO foram deletados

-- Ver TODOS os banners aprovados que existem
SELECT 
  bs.id,
  bs.created_at,
  bs.approved_at,
  bs.titulo,
  bs.subtitulo,
  bs.status,
  bt.nome as template_nome,
  r.store_name as loja
FROM banner_submissions bs
LEFT JOIN banner_templates bt ON bs.template_id = bt.id
LEFT JOIN resellers r ON r.user_id = bs.user_id
WHERE bs.status = 'approved'
ORDER BY bs.approved_at DESC;

-- Ver se os banners estão sincronizados com a tabela resellers
SELECT 
  r.store_name,
  r.banner_url as tem_banner_desktop,
  r.banner_mobile_url as tem_banner_mobile,
  bs.titulo as banner_titulo,
  bs.approved_at
FROM resellers r
LEFT JOIN banner_submissions bs ON r.user_id = bs.user_id AND bs.status = 'approved'
WHERE bs.id IS NOT NULL;
