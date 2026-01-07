import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verificarBannersRevendedoras() {
  console.log('🔍 Verificando banners das revendedoras...\n');

  try {
    // Buscar todas revendedoras com seus banners
    const { data: revendedoras, error } = await supabase
      .from('resellers')
      .select('id, name, store_name, slug, status, banner_url, banner_mobile_url, logo_url')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar revendedoras:', error);
      return;
    }

    if (!revendedoras || revendedoras.length === 0) {
      console.log('⚠️ Nenhuma revendedora encontrada');
      return;
    }

    console.log(`📊 Total de revendedoras: ${revendedoras.length}\n`);

    // Estatísticas
    let comBannerDesktop = 0;
    let comBannerMobile = 0;
    let comAmbos = 0;
    let comLogo = 0;
    let semNada = 0;

    console.log('=' .repeat(80));
    console.log('REVENDEDORAS E SEUS BANNERS:');
    console.log('='.repeat(80));

    revendedoras.forEach((rev, index) => {
      const hasBannerDesktop = !!(rev.banner_url && rev.banner_url.trim());
      const hasBannerMobile = !!(rev.banner_mobile_url && rev.banner_mobile_url.trim());
      const hasLogo = !!(rev.logo_url && rev.logo_url.trim());

      if (hasBannerDesktop) comBannerDesktop++;
      if (hasBannerMobile) comBannerMobile++;
      if (hasBannerDesktop && hasBannerMobile) comAmbos++;
      if (hasLogo) comLogo++;
      if (!hasBannerDesktop && !hasBannerMobile && !hasLogo) semNada++;

      console.log(`\n${index + 1}. ${rev.name} (${rev.store_name})`);
      console.log(`   Slug: /${rev.slug}`);
      console.log(`   Status: ${rev.status}`);
      console.log(`   Logo: ${hasLogo ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`   Banner Desktop: ${hasBannerDesktop ? '✅ SIM' : '❌ NÃO'}`);
      console.log(`   Banner Mobile: ${hasBannerMobile ? '✅ SIM' : '❌ NÃO'}`);

      if (hasBannerDesktop) {
        console.log(`   📎 URL Desktop: ${rev.banner_url?.substring(0, 60)}...`);
      }
      if (hasBannerMobile) {
        console.log(`   📎 URL Mobile: ${rev.banner_mobile_url?.substring(0, 60)}...`);
      }
      if (hasLogo) {
        console.log(`   📎 URL Logo: ${rev.logo_url?.substring(0, 60)}...`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('RESUMO:');
    console.log('='.repeat(80));
    console.log(`📊 Total de revendedoras: ${revendedoras.length}`);
    console.log(`🖼️  Com Logo: ${comLogo} (${((comLogo/revendedoras.length)*100).toFixed(1)}%)`);
    console.log(`🖥️  Com Banner Desktop: ${comBannerDesktop} (${((comBannerDesktop/revendedoras.length)*100).toFixed(1)}%)`);
    console.log(`📱 Com Banner Mobile: ${comBannerMobile} (${((comBannerMobile/revendedoras.length)*100).toFixed(1)}%)`);
    console.log(`✅ Com ambos banners: ${comAmbos} (${((comAmbos/revendedoras.length)*100).toFixed(1)}%)`);
    console.log(`⚠️  Sem nada: ${semNada} (${((semNada/revendedoras.length)*100).toFixed(1)}%)`);
    console.log('='.repeat(80));

    // Verificar se existem banners pendentes de moderação
    console.log('\n🔍 Verificando banners pendentes de aprovação...\n');

    const { data: pendentes, error: errPendentes } = await supabase
      .from('banner_submissions')
      .select('id, status, banner_type, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (errPendentes) {
      console.error('❌ Erro ao buscar banners pendentes:', errPendentes);
    } else if (pendentes && pendentes.length > 0) {
      console.log(`⏰ ${pendentes.length} banner(s) aguardando aprovação:`);
      pendentes.forEach((p, i) => {
        console.log(`   ${i+1}. Tipo: ${p.banner_type} | Data: ${new Date(p.created_at).toLocaleString('pt-BR')}`);
      });
    } else {
      console.log('✅ Nenhum banner pendente de aprovação');
    }

  } catch (err) {
    console.error('❌ Erro fatal:', err);
  }
}

verificarBannersRevendedoras();
