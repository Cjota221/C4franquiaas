#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

async function main() {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Variáveis de ambiente ausentes');
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { 
    auth: { persistSession: false } 
  });

  console.log('\n🔍 Verificando formatos de URLs das imagens...\n');

  const { data: produtos, error } = await supabase
    .from('produtos')
    .select('id, nome, imagem, imagens')
    .limit(20);

  if (error) {
    console.error('❌ Erro ao buscar produtos:', error);
    process.exit(1);
  }

  let comProxy = 0;
  let diretaFacilzap = 0;
  let semImagem = 0;
  let outros = 0;

  console.log('📊 ANÁLISE DE 20 PRODUTOS:\n');

  produtos.forEach((p, idx) => {
    console.log(`${idx + 1}. ${p.nome}`);
    
    if (!p.imagem && (!p.imagens || p.imagens.length === 0)) {
      console.log('   ❌ SEM IMAGEM\n');
      semImagem++;
      return;
    }

    const img = p.imagem || (p.imagens && p.imagens[0]);
    
    if (img.includes('.netlify/functions/proxy-facilzap-image')) {
      console.log('   ✅ Proxy Netlify (produção OK)');
      console.log(`   ${img.substring(0, 80)}...\n`);
      comProxy++;
    } else if (img.includes('arquivos.facilzap.app.br')) {
      console.log('   ⚠️  URL Direta Facilzap (problema em produção!)');
      console.log(`   ${img.substring(0, 80)}...\n`);
      diretaFacilzap++;
    } else {
      console.log(`   ❓ Outro formato: ${img.substring(0, 80)}...\n`);
      outros++;
    }
  });

  console.log('\n' + '='.repeat(50));
  console.log('📈 RESUMO:');
  console.log('='.repeat(50));
  console.log(`✅ Com Proxy Netlify:    ${comProxy}`);
  console.log(`⚠️  URL Direta Facilzap:  ${diretaFacilzap}`);
  console.log(`❌ Sem Imagem:           ${semImagem}`);
  console.log(`❓ Outros:               ${outros}`);
  console.log('='.repeat(50));

  if (diretaFacilzap > 0) {
    console.log('\n⚠️  PROBLEMA ENCONTRADO!');
    console.log('Alguns produtos têm URLs diretas do Facilzap.');
    console.log('Em produção (Netlify), essas URLs podem ser bloqueadas.');
    console.log('\n💡 SOLUÇÃO: Executar script replace_proxy_host.mjs');
  } else {
    console.log('\n✅ Tudo OK! Todas imagens usam proxy.');
  }
}

main();
