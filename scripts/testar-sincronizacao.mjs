#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Ler .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Analisando vínculos de produtos...\n');

// 1. Contar produtos ativos no master
const { count: totalProdutosAtivos } = await supabase
  .from('produtos')
  .select('*', { count: 'exact', head: true })
  .eq('ativo', true);

console.log(`📦 Total de produtos ativos no master: ${totalProdutosAtivos}\n`);

// 2. Buscar todas as revendedoras ativas
const { data: revendedoras } = await supabase
  .from('resellers')
  .select('id, store_name, slug')
  .eq('status', 'aprovada')
  .order('store_name');

console.log(`👥 Total de revendedoras ativas: ${revendedoras?.length}\n`);
console.log('─'.repeat(80));

let problemasEncontrados = 0;

// 3. Para cada revendedora, analisar vínculos
for (const revendedora of revendedoras || []) {
  console.log(`\n🏪 ${revendedora.store_name} (${revendedora.slug})`);
  
  // 3.1. Buscar vínculos
  const { data: vinculos } = await supabase
    .from('reseller_products')
    .select('product_id, is_active, margin_percent')
    .eq('reseller_id', revendedora.id);

  const vinculosAtivos = vinculos?.filter(v => v.is_active) || [];
  
  console.log(`   📊 Vínculos totais: ${vinculos?.length || 0}`);
  console.log(`   ✅ Vínculos ativos: ${vinculosAtivos.length}`);

  // 3.2. Verificar vínculos órfãos (produto vinculado mas inativo no master)
  const produtoIds = vinculos?.map(v => v.product_id) || [];
  let vinculosOrfaos = [];
  
  if (produtoIds.length > 0) {
    const { data: produtosVinculados } = await supabase
      .from('produtos')
      .select('id, nome, ativo')
      .in('id', produtoIds);

    const produtosInativos = produtosVinculados?.filter(p => !p.ativo) || [];
    vinculosOrfaos = vinculos?.filter(v => 
      v.is_active && produtosInativos.some(p => p.id === v.product_id)
    ) || [];

    if (vinculosOrfaos.length > 0) {
      console.log(`   🔴 PROBLEMA: ${vinculosOrfaos.length} vínculo(s) ativo(s) mas produto inativo no master`);
      problemasEncontrados++;
      
      for (const orfao of vinculosOrfaos) {
        const produto = produtosInativos.find(p => p.id === orfao.product_id);
        console.log(`      - ${produto?.nome || 'Produto desconhecido'}`);
      }
    }
  }

  // 3.3. Verificar produtos faltantes
  const { data: todosProdutosAtivos } = await supabase
    .from('produtos')
    .select('id, nome')
    .eq('ativo', true);

  const idsAtivos = todosProdutosAtivos?.map(p => p.id) || [];
  const idsVinculados = vinculos?.map(v => v.product_id) || [];
  const produtosFaltantes = todosProdutosAtivos?.filter(p => !idsVinculados.includes(p.id)) || [];

  if (produtosFaltantes.length > 0) {
    console.log(`   ⚠️  AVISO: ${produtosFaltantes.length} produto(s) ativo(s) no master mas não vinculado(s)`);
    problemasEncontrados++;
    
    if (produtosFaltantes.length <= 5) {
      for (const produto of produtosFaltantes) {
        console.log(`      - ${produto.nome}`);
      }
    } else {
      console.log(`      (Lista muito longa, mostrando apenas contagem)`);
    }
  }

  if (vinculosOrfaos?.length === 0 && produtosFaltantes.length === 0) {
    console.log(`   ✅ Sincronizada corretamente`);
  }
}

console.log('\n' + '─'.repeat(80));
console.log(`\n📊 RESUMO:`);
console.log(`   Produtos ativos no master: ${totalProdutosAtivos}`);
console.log(`   Revendedoras analisadas: ${revendedoras?.length}`);
console.log(`   Problemas encontrados: ${problemasEncontrados > 0 ? '🔴 ' + problemasEncontrados : '✅ Nenhum'}`);

if (problemasEncontrados > 0) {
  console.log(`\n💡 Para corrigir automaticamente, acesse:`);
  console.log(`   http://localhost:3000/api/admin/sincronizar-vinculos (preview)`);
  console.log(`   POST http://localhost:3000/api/admin/sincronizar-vinculos?executar=true (executar)`);
}

console.log('\n✨ Análise concluída!\n');
