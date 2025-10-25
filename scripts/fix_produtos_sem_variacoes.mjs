import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fetchProdutoFacilZapById } from '../lib/facilzapClient.ts';

// Carregar variáveis de ambiente
const envFile = readFileSync('.env.local', 'utf-8');
const envLines = envFile.split('\n');
envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    const value = valueParts.join('=').trim();
    process.env[key.trim()] = value;
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔧 CORRIGINDO: Produtos sem variações\n');

// Buscar TODOS os produtos sem variações
const { data: produtosSemVariacoes, error } = await supabase
  .from('produtos')
  .select('id, id_externo, nome, variacoes_meta')
  .or('variacoes_meta.is.null,variacoes_meta.eq.[]');

if (error) {
  console.error('❌ Erro ao buscar produtos:', error);
  process.exit(1);
}

console.log(`📦 Encontrados ${produtosSemVariacoes.length} produtos sem variações\n`);

if (produtosSemVariacoes.length === 0) {
  console.log('✅ Nenhum produto precisa de correção!');
  process.exit(0);
}

console.log('⏳ Iniciando sincronização...\n');

let sucessos = 0;
let falhas = 0;
const erros = [];

for (const produto of produtosSemVariacoes) {
  try {
    console.log(`\n📦 ${produto.nome} (ID Externo: ${produto.id_externo})`);
    
    if (!produto.id_externo) {
      console.log('   ⚠️  Produto sem ID externo, pulando...');
      falhas++;
      continue;
    }
    
    // Buscar no FácilZap
    console.log('   🔄 Buscando no FácilZap...');
    const facilzapData = await fetchProdutoFacilZapById(String(produto.id_externo));
    
    if (!facilzapData || !facilzapData.variacoes || facilzapData.variacoes.length === 0) {
      console.log('   ⚠️  FácilZap não retornou variações');
      falhas++;
      erros.push({
        produto: produto.nome,
        id: produto.id_externo,
        erro: 'Sem variações no FácilZap'
      });
      continue;
    }
    
    // Processar variações
    const variacoes_meta = [];
    let estoqueTotal = 0;
    
    for (const v of facilzapData.variacoes) {
      const id = v.id || v.variacao_id || null;
      const sku = v.sku || v.codigo || null;
      const nome = v.nome || v.name || null;
      const estoqueVariacao = parseInt(String(v.estoque || v.quantidade || 0), 10);
      const estoque = isNaN(estoqueVariacao) ? 0 : estoqueVariacao;
      const codigo_barras = v.codigo_barras || v.barcode || null;
      
      variacoes_meta.push({
        id,
        sku,
        nome,
        estoque,
        codigo_barras
      });
      
      estoqueTotal += estoque;
    }
    
    console.log(`   ✅ ${variacoes_meta.length} variações processadas (estoque total: ${estoqueTotal})`);
    
    // Atualizar no banco
    const { error: updateError } = await supabase
      .from('produtos')
      .update({
        variacoes_meta,
        estoque: estoqueTotal,
        last_synced_at: new Date().toISOString()
      })
      .eq('id', produto.id);
    
    if (updateError) {
      console.log(`   ❌ Erro ao atualizar: ${updateError.message}`);
      falhas++;
      erros.push({
        produto: produto.nome,
        id: produto.id_externo,
        erro: updateError.message
      });
    } else {
      console.log('   ✅ Atualizado com sucesso!');
      sucessos++;
    }
    
    // Delay para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 500));
    
  } catch (err) {
    console.log(`   ❌ Erro: ${err.message}`);
    falhas++;
    erros.push({
      produto: produto.nome,
      id: produto.id_externo,
      erro: err.message
    });
  }
}

console.log('\n' + '='.repeat(80));
console.log('📊 RESUMO:');
console.log(`   ✅ Sucessos: ${sucessos}`);
console.log(`   ❌ Falhas: ${falhas}`);
console.log(`   📦 Total: ${produtosSemVariacoes.length}`);

if (erros.length > 0) {
  console.log('\n❌ ERROS:');
  erros.forEach((e, i) => {
    console.log(`   ${i + 1}. ${e.produto} (ID: ${e.id}) - ${e.erro}`);
  });
}

console.log('\n✅ Processo concluído!\n');
