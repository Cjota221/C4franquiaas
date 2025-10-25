import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Variáveis necessárias:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function fixUrl(url) {
  if (!url || typeof url !== 'string') return url;
  
  // Substituir domínio antigo pelo correto
  return url.replace(
    'https://cjotarasteirinhas.com.br/.netlify/functions/proxy-facilzap-image',
    'https://c4franquiaas.netlify.app/.netlify/functions/proxy-facilzap-image'
  );
}

async function run() {
  console.log('🔍 Buscando produtos com URLs antigas...\n');

  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('id, id_externo, nome, imagem, imagens')
    .ilike('imagem', '%cjotarasteirinhas.com.br%');

  if (error) {
    console.error('❌ Erro ao buscar produtos:', error.message);
    process.exit(1);
  }

  if (!produtos || produtos.length === 0) {
    console.log('✅ Nenhum produto com URL antiga encontrado!');
    return;
  }

  console.log(`📦 Encontrados ${produtos.length} produtos com URLs antigas:\n`);

  let updated = 0;
  let errors = 0;

  for (const produto of produtos) {
    const updates = {};
    let hasChanges = false;

    // Corrigir campo 'imagem'
    if (produto.imagem && produto.imagem.includes('cjotarasteirinhas.com.br')) {
      updates.imagem = fixUrl(produto.imagem);
      hasChanges = true;
    }

    // Corrigir array 'imagens'
    if (produto.imagens && Array.isArray(produto.imagens)) {
      const fixed = produto.imagens.map(fixUrl);
      if (JSON.stringify(fixed) !== JSON.stringify(produto.imagens)) {
        updates.imagens = fixed;
        hasChanges = true;
      }
    }

    if (!hasChanges) {
      console.log(`⚠️  ${produto.nome} - Nenhuma mudança necessária`);
      continue;
    }

    console.log(`🔧 ${produto.nome}`);
    console.log(`   Antes: ${produto.imagem?.substring(0, 80)}...`);
    console.log(`   Depois: ${updates.imagem?.substring(0, 80)}...`);

    const { error: updateError } = await supabase
      .from('produtos')
      .update(updates)
      .eq('id', produto.id);

    if (updateError) {
      console.error(`   ❌ Erro: ${updateError.message}`);
      errors++;
    } else {
      console.log(`   ✅ Corrigido!\n`);
      updated++;
    }
  }

  console.log('\n📊 RESUMO:');
  console.log(`   ✅ Atualizados: ${updated}`);
  console.log(`   ❌ Erros: ${errors}`);
  console.log(`   📦 Total: ${produtos.length}`);
}

run().catch(console.error);
