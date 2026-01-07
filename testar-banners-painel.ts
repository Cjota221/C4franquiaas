import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testarRevendedorasComBanner() {
  console.log('🔍 Buscando revendedoras que TÊM banners...\n');

  const { data, error } = await supabase
    .from('resellers')
    .select('id, name, store_name, slug, status, banner_url, banner_mobile_url, logo_url')
    .or('banner_url.neq.null,banner_mobile_url.neq.null')
    .order('name');

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ Nenhuma revendedora com banner encontrada');
    return;
  }

  console.log(`✅ Encontradas ${data.length} revendedoras com banners:\n`);
  console.log('='.repeat(80));

  data.forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.name} - ${r.store_name}`);
    console.log(`   Slug: /${r.slug}`);
    console.log(`   Status: ${r.status}`);
    
    if (r.logo_url) {
      console.log(`   ✅ Logo: ${r.logo_url.substring(0, 70)}...`);
    }
    if (r.banner_url) {
      console.log(`   ✅ Banner Desktop: ${r.banner_url.substring(0, 70)}...`);
    }
    if (r.banner_mobile_url) {
      console.log(`   ✅ Banner Mobile: ${r.banner_mobile_url.substring(0, 70)}...`);
    }
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\n📝 PARA TESTAR NO PAINEL:`);
  console.log(`   1. Acesse: http://localhost:3000/admin/revendedoras`);
  console.log(`   2. Busque por: "${data[0].name}"`);
  console.log(`   3. Clique na SETA para expandir`);
  console.log(`   4. Você DEVE ver a seção "📸 Personalização Enviada"`);
  console.log('='.repeat(80));
}

testarRevendedorasComBanner();
