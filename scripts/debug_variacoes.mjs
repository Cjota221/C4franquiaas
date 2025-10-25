/**
 * Script de Debug para Verificar Variações de Produtos
 * 
 * USO:
 * node scripts/debug_variacoes.mjs "Rasteira Feminina Viena Nude"
 * ou
 * node scripts/debug_variacoes.mjs --id=PRODUTO_ID
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente manualmente
const envPath = join(__dirname, '..', '.env.local');
let supabaseUrl, supabaseKey;

try {
  const envFile = readFileSync(envPath, 'utf8');
  const lines = envFile.split('\n');
  
  lines.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').trim();
    
    if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') {
      supabaseUrl = value;
    } else if (key.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
      supabaseKey = value;
    }
  });
} catch (error) {
  console.error('❌ Erro ao ler .env.local:', error.message);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProduto(nomeProduto, produtoId) {
  console.log('\n🔍 ===== DEBUG DE VARIAÇÕES DE PRODUTO =====\n');

  try {
    let query = supabase
      .from('produtos')
      .select('*');

    if (produtoId) {
      query = query.eq('id', produtoId);
      console.log(`📌 Buscando produto por ID: ${produtoId}`);
    } else if (nomeProduto) {
      query = query.ilike('nome', `%${nomeProduto}%`);
      console.log(`📌 Buscando produto por nome: "${nomeProduto}"`);
    } else {
      console.error('❌ Por favor, forneça um nome de produto ou ID');
      process.exit(1);
    }

    const { data: produtos, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar produto:', error);
      process.exit(1);
    }

    if (!produtos || produtos.length === 0) {
      console.error('❌ Produto não encontrado');
      process.exit(1);
    }

    if (produtos.length > 1) {
      console.log(`\n⚠️  Encontrados ${produtos.length} produtos com esse nome:\n`);
      produtos.forEach((p, idx) => {
        console.log(`${idx + 1}. ${p.nome} (ID: ${p.id})`);
      });
      console.log('\n💡 Use o ID para buscar um produto específico: --id=PRODUTO_ID\n');
      return;
    }

    const produto = produtos[0];

    console.log('✅ Produto encontrado:\n');
    console.log(`   📦 Nome: ${produto.nome}`);
    console.log(`   🆔 ID: ${produto.id}`);
    console.log(`   💰 Preço Base: R$ ${produto.preco_base?.toFixed(2) || '0.00'}`);
    console.log(`   📊 Estoque (campo direto): ${produto.estoque || 0}`);
    console.log(`   📁 Categoria ID: ${produto.categoria_id || 'N/A'}`);
    console.log(`   🏷️  Código de Barras: ${produto.codigo_barras || 'N/A'}`);

    console.log('\n📸 Imagens:');
    if (produto.imagem) {
      console.log(`   - Principal: ${produto.imagem.substring(0, 60)}...`);
    }
    if (produto.imagens && Array.isArray(produto.imagens)) {
      console.log(`   - Array: ${produto.imagens.length} imagens`);
      produto.imagens.forEach((img, idx) => {
        console.log(`     ${idx + 1}. ${img.substring(0, 60)}...`);
      });
    } else {
      console.log('   - Array: Não é um array válido');
    }

    console.log('\n🔢 ===== VARIAÇÕES (variacoes_meta JSONB) =====\n');
    
    if (!produto.variacoes_meta) {
      console.log('❌ Campo variacoes_meta é NULL ou não existe');
      console.log('\n💡 SOLUÇÃO:');
      console.log('   Execute o script de sincronização:');
      console.log('   node scripts/sync_variacoes_from_facilzap.mjs --apply');
      return;
    }

    if (!Array.isArray(produto.variacoes_meta)) {
      console.log('❌ variacoes_meta NÃO é um array');
      console.log('   Tipo:', typeof produto.variacoes_meta);
      console.log('   Valor:', JSON.stringify(produto.variacoes_meta, null, 2));
      return;
    }

    if (produto.variacoes_meta.length === 0) {
      console.log('⚠️  variacoes_meta é um array VAZIO');
      console.log('\n💡 SOLUÇÃO:');
      console.log('   Execute o script de sincronização:');
      console.log('   node scripts/sync_variacoes_from_facilzap.mjs --apply');
      return;
    }

    console.log(`✅ Encontradas ${produto.variacoes_meta.length} variações:\n`);

    let estoqueTotal = 0;
    produto.variacoes_meta.forEach((variacao, idx) => {
      const estoque = typeof variacao.estoque === 'number' ? variacao.estoque : 0;
      const disponivel = estoque > 0;
      estoqueTotal += estoque;

      console.log(`   ${idx + 1}. ${variacao.nome || 'Sem nome'}`);
      console.log(`      SKU: ${variacao.sku || 'N/A'}`);
      console.log(`      Estoque: ${estoque} unidades ${disponivel ? '✅' : '❌ (indisponível)'}`);
      console.log(`      Código de Barras: ${variacao.codigo_barras || 'N/A'}`);
      
      if (variacao.preco) {
        console.log(`      Preço: R$ ${variacao.preco}`);
      }
      
      console.log('');
    });

    console.log(`📊 ESTOQUE TOTAL: ${estoqueTotal} unidades\n`);

    // Simular o processamento da API
    console.log('🔄 ===== SIMULAÇÃO DO PROCESSAMENTO DA API =====\n');
    
    const variacoesAPI = produto.variacoes_meta.map((variacao, idx) => {
      const estoqueVariacao = typeof variacao.estoque === 'number' ? variacao.estoque : 0;
      const disponivel = estoqueVariacao > 0;
      
      return {
        sku: variacao.sku || `SKU-${produto.id}-${idx}`,
        tamanho: variacao.nome || variacao.sku?.split('-').pop() || `Variação ${idx + 1}`,
        estoque: estoqueVariacao,
        disponivel,
        codigo_barras: variacao.codigo_barras || null
      };
    });

    console.log('Variações que serão retornadas pela API:\n');
    console.log(JSON.stringify(variacoesAPI, null, 2));

    // Verificar se há variações indisponíveis
    const indisponiveis = variacoesAPI.filter(v => !v.disponivel);
    const disponiveis = variacoesAPI.filter(v => v.disponivel);

    console.log(`\n✅ Disponíveis: ${disponiveis.length}`);
    console.log(`❌ Indisponíveis: ${indisponiveis.length}`);

    if (indisponiveis.length > 0) {
      console.log('\n⚠️  Variações sem estoque (não aparecerão como selecionáveis):');
      indisponiveis.forEach(v => {
        console.log(`   - ${v.tamanho} (SKU: ${v.sku})`);
      });
    }

    console.log('\n✅ Diagnóstico concluído!\n');

  } catch (error) {
    console.error('❌ Erro durante o debug:', error);
    process.exit(1);
  }
}

// Processar argumentos da linha de comando
const args = process.argv.slice(2);
let nomeProduto = null;
let produtoId = null;

args.forEach(arg => {
  if (arg.startsWith('--id=')) {
    produtoId = arg.split('=')[1];
  } else if (!arg.startsWith('--')) {
    nomeProduto = arg;
  }
});

debugProduto(nomeProduto, produtoId);
