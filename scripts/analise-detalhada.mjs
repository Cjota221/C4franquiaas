#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Ler .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('\n🔍 ANÁLISE DETALHADA - Onde estão os produtos?\n');
console.log('═'.repeat(80));

// 1. Produtos na tabela principal
const { data: produtos, count: totalProdutos } = await supabase
  .from('produtos')
  .select('id, nome, ativo', { count: 'exact' });

const ativos = produtos.filter(p => p.ativo);
const inativos = produtos.filter(p => !p.ativo);

console.log('\n📊 TABELA PRODUTOS (master):');
console.log(`   Total: ${totalProdutos}`);
console.log(`   Ativos: ${ativos.length}`);
console.log(`   Inativos: ${inativos.length}`);

// 2. Produtos vinculados às revendedoras
const { data: resellers } = await supabase
  .from('resellers')
  .select('id, store_name, slug')
  .order('store_name');

console.log(`\n📊 REVENDEDORAS (${resellers.length} lojas):\n`);

for (const reseller of resellers) {
  // Contar vínculos
  const { data: vinculos } = await supabase
    .from('reseller_products')
    .select('product_id, is_active')
    .eq('reseller_id', reseller.id);

  const vinculados = vinculos?.length || 0;
  const vinculadosAtivos = vinculos?.filter(v => v.is_active).length || 0;

  // Verificar quantos desses produtos vinculados estão ativos no master
  const produtoIds = vinculos?.map(v => v.product_id) || [];
  
  if (produtoIds.length > 0) {
    const { data: produtosVinculados } = await supabase
      .from('produtos')
      .select('id, ativo')
      .in('id', produtoIds);

    const masterAtivos = produtosVinculados?.filter(p => p.ativo).length || 0;
    const masterInativos = produtosVinculados?.filter(p => !p.ativo).length || 0;

    const diff = vinculados - ativos.length;
    const emoji = diff > 0 ? '⚠️ ' : '✅';
    
    console.log(`${emoji} ${reseller.store_name.padEnd(30)} | Vínculos: ${vinculados.toString().padStart(3)} | Ativos no vínculo: ${vinculadosAtivos.toString().padStart(3)} | Master ativos: ${masterAtivos.toString().padStart(3)} | Master inativos: ${masterInativos.toString().padStart(3)}`);
  } else {
    console.log(`❌ ${reseller.store_name.padEnd(30)} | Sem produtos vinculados`);
  }
}

console.log('\n' + '═'.repeat(80));
console.log('\n💡 EXPLICAÇÃO:\n');
console.log('A revendedora com 112 produtos vinculados tem mais produtos do que');
console.log('os 93 ativos no master porque:');
console.log('  1. Produtos foram desativados no master mas o vínculo permaneceu');
console.log('  2. Produtos antigos que foram removidos ainda têm vínculos órfãos');
console.log('');
console.log('Quando você vê "94 produtos" no catálogo da revendedora, são aqueles');
console.log('onde product vinculado E master ativo E revendedora is_active = true');
