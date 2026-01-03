#!/usr/bin/env node

/**
 * Script de Diagnóstico - Produtos Faltantes nas Revendedoras
 * 
 * Descobre produtos ativos no Admin que não estão vinculados nas revendedoras
 * e gera relatório detalhado com instruções de correção.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Ler variáveis do .env.local
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

console.log('\n🔍 DIAGNÓSTICO DE PRODUTOS FALTANTES\n');
console.log('═'.repeat(80));

async function main() {
  try {
    // 1. Contar produtos ativos no Admin (base master)
    console.log('\n📊 PASSO 1: Contando produtos ativos no Admin...');
    const { data: adminProducts, error: adminError } = await supabase
      .from('produtos')
      .select('id', { count: 'exact', head: true })
      .eq('ativo', true);

    if (adminError) throw adminError;

    const totalAdmin = adminProducts?.length || 0;
    console.log(`   ✅ Total de produtos ativos no Admin: ${totalAdmin}`);

    // 2. Buscar todas as revendedoras
    console.log('\n📊 PASSO 2: Buscando todas as revendedoras...');
    const { data: resellers, error: resellersError } = await supabase
      .from('resellers')
      .select('id, slug, store_name, email')
      .order('store_name');

    if (resellersError) throw resellersError;

    console.log(`   ✅ Total de revendedoras: ${resellers.length}`);

    // 3. Analisar cada revendedora
    console.log('\n📊 PASSO 3: Analisando vínculos de cada revendedora...\n');
    console.log('─'.repeat(80));

    const relatorio = [];

    for (const reseller of resellers) {
      // Contar produtos vinculados (ativos e inativos)
      const { data: linkedProducts, error: linkedError } = await supabase
        .from('reseller_products')
        .select('product_id, is_active', { count: 'exact' })
        .eq('reseller_id', reseller.id);

      if (linkedError) {
        console.error(`   ❌ Erro ao buscar produtos de ${reseller.store_name}:`, linkedError.message);
        continue;
      }

      const totalLinked = linkedProducts?.length || 0;
      const totalActive = linkedProducts?.filter(p => p.is_active).length || 0;
      const faltantes = totalAdmin - totalLinked;

      relatorio.push({
        store_name: reseller.store_name,
        slug: reseller.slug,
        email: reseller.email,
        reseller_id: reseller.id,
        total_linked: totalLinked,
        total_active: totalActive,
        faltantes: faltantes
      });

      const emoji = faltantes > 0 ? '⚠️ ' : '✅';
      console.log(`${emoji} ${reseller.store_name.padEnd(30)} | Vinculados: ${totalLinked.toString().padStart(3)} | Ativos: ${totalActive.toString().padStart(3)} | Faltantes: ${faltantes.toString().padStart(3)}`);
    }

    // 4. Identificar produtos que não estão vinculados em NENHUMA revendedora
    console.log('\n📊 PASSO 4: Buscando produtos órfãos (não vinculados a ninguém)...');
    
    const { data: allLinkedIds } = await supabase
      .from('reseller_products')
      .select('product_id');

    const linkedSet = new Set(allLinkedIds?.map(p => p.product_id) || []);

    const { data: allActiveProducts } = await supabase
      .from('produtos')
      .select('id, nome, id_externo, categorias, created_at')
      .eq('ativo', true);

    const orphans = allActiveProducts?.filter(p => !linkedSet.has(p.id)) || [];

    console.log(`   ${orphans.length > 0 ? '⚠️' : '✅'} Produtos órfãos (sem vínculo): ${orphans.length}`);

    if (orphans.length > 0) {
      console.log('\n   📋 Lista de produtos órfãos (primeiros 20):');
      orphans.slice(0, 20).forEach((p, i) => {
        console.log(`      ${(i + 1).toString().padStart(2)}. ${p.nome} (ID: ${p.id_externo || p.id})`);
      });
    }

    // 5. Resumo final
    console.log('\n' + '═'.repeat(80));
    console.log('📈 RESUMO FINAL\n');
    console.log(`   Total de produtos ativos no Admin:     ${totalAdmin}`);
    console.log(`   Total de revendedoras:                 ${resellers.length}`);
    console.log(`   Produtos órfãos (sem vínculo):         ${orphans.length}`);
    
    const revendedorasComFaltantes = relatorio.filter(r => r.faltantes > 0);
    console.log(`   Revendedoras com produtos faltantes:   ${revendedorasComFaltantes.length}`);

    if (revendedorasComFaltantes.length > 0) {
      console.log('\n   ⚠️  Revendedoras com mais produtos faltantes:');
      revendedorasComFaltantes
        .sort((a, b) => b.faltantes - a.faltantes)
        .slice(0, 10)
        .forEach((r, i) => {
          console.log(`      ${(i + 1).toString().padStart(2)}. ${r.store_name.padEnd(30)} - ${r.faltantes} faltantes`);
        });
    }

    // 6. Gerar queries de correção
    console.log('\n' + '═'.repeat(80));
    console.log('🔧 AÇÕES RECOMENDADAS\n');

    if (orphans.length > 0) {
      console.log('1️⃣  VINCULAR PRODUTOS ÓRFÃOS A TODAS AS REVENDEDORAS\n');
      console.log('   Execute no SQL Editor do Supabase:\n');
      console.log('   -- Vincular produtos órfãos (is_active=false, margin=0)');
      console.log('   INSERT INTO reseller_products (reseller_id, product_id, margin_percent, is_active, linked_at)');
      console.log('   SELECT r.id, p.id, 0, false, now()');
      console.log('   FROM resellers r');
      console.log('   CROSS JOIN produtos p');
      console.log('   WHERE p.ativo = true');
      console.log('   AND NOT EXISTS (');
      console.log('     SELECT 1 FROM reseller_products rp');
      console.log('     WHERE rp.reseller_id = r.id AND rp.product_id = p.id');
      console.log('   );');
      console.log('');
    }

    if (revendedorasComFaltantes.length > 0) {
      console.log('2️⃣  VINCULAR PRODUTOS FALTANTES PARA REVENDEDORA ESPECÍFICA\n');
      console.log('   Substitua RESELLER_ID pelo ID da revendedora:\n');
      console.log('   INSERT INTO reseller_products (reseller_id, product_id, margin_percent, is_active, linked_at)');
      console.log("   SELECT 'RESELLER_ID', p.id, 0, false, now()");
      console.log('   FROM produtos p');
      console.log('   WHERE p.ativo = true');
      console.log('   AND NOT EXISTS (');
      console.log('     SELECT 1 FROM reseller_products rp');
      console.log("     WHERE rp.reseller_id = 'RESELLER_ID' AND rp.product_id = p.id");
      console.log('   );');
      console.log('');
    }

    console.log('3️⃣  USAR ENDPOINT DE VINCULAÇÃO AUTOMÁTICA\n');
    console.log('   Para vincular todos os produtos aprovados a todas as revendedoras:');
    console.log('   POST /api/admin/produtos/vincular-todas-revendedoras');
    console.log('');

    console.log('4️⃣  LISTAR PRODUTOS FALTANTES DE UMA REVENDEDORA\n');
    console.log('   Substitua RESELLER_ID pelo ID da revendedora:\n');
    console.log('   SELECT p.id, p.nome, p.id_externo, p.categorias, p.preco_base, p.created_at');
    console.log('   FROM produtos p');
    console.log('   WHERE p.ativo = true');
    console.log('   AND NOT EXISTS (');
    console.log('     SELECT 1 FROM reseller_products rp');
    console.log("     WHERE rp.product_id = p.id AND rp.reseller_id = 'RESELLER_ID'");
    console.log('   )');
    console.log('   ORDER BY p.created_at DESC;');
    console.log('');

    // 7. Exportar relatório como JSON
    console.log('═'.repeat(80));
    console.log('💾 Salvando relatório detalhado...\n');

    const reportData = {
      timestamp: new Date().toISOString(),
      admin_total: totalAdmin,
      total_resellers: resellers.length,
      orphan_products: orphans.length,
      orphan_list: orphans.map(p => ({
        id: p.id,
        id_externo: p.id_externo,
        nome: p.nome,
        categorias: p.categorias,
        created_at: p.created_at
      })),
      resellers_report: relatorio
    };

    const fs = await import('fs');
    const reportPath = './relatorio-produtos-faltantes.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2), 'utf-8');
    
    console.log(`   ✅ Relatório salvo em: ${reportPath}`);
    console.log('\n' + '═'.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    process.exit(1);
  }
}

main();
