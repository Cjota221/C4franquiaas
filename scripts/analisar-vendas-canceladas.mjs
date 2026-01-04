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

console.log('🔍 Analisando vendas canceladas e rejeitadas...\n');

// Buscar vendas canceladas ou rejeitadas
const { data: vendas, error } = await supabase
  .from('vendas')
  .select('*')
  .in('status_pagamento', ['cancelled', 'rejected'])
  .order('created_at', { ascending: false });

if (error) {
  console.error('❌ Erro ao buscar vendas:', error);
  process.exit(1);
}

console.log(`📊 Total de vendas canceladas/rejeitadas: ${vendas?.length || 0}\n`);

if (!vendas || vendas.length === 0) {
  console.log('✅ Nenhuma venda cancelada encontrada!\n');
  process.exit(0);
}

console.log('─'.repeat(80));

let totalItens = 0;
let totalEstoqueDevolver = 0;
const vendasParaCorrigir = [];

for (const venda of vendas) {
  const items = typeof venda.items === 'string' ? JSON.parse(venda.items) : venda.items;
  
  if (!Array.isArray(items) || items.length === 0) continue;

  console.log(`\n🔴 Venda #${venda.id.substring(0, 8)}`);
  console.log(`   Cliente: ${venda.cliente_nome}`);
  console.log(`   Data: ${new Date(venda.created_at).toLocaleString('pt-BR')}`);
  console.log(`   Status: ${venda.status_pagamento}`);
  console.log(`   Valor: R$ ${Number(venda.valor_total).toFixed(2)}`);
  console.log(`   Itens: ${items.length}`);

  const itensParaRestaurar = [];

  for (const item of items) {
    totalItens++;
    
    // Buscar produto
    const { data: produto } = await supabase
      .from('produtos')
      .select('id, nome, variacoes')
      .eq('id', item.id)
      .single();

    if (!produto) {
      console.log(`   ⚠️  Produto ${item.nome} não encontrado no banco`);
      continue;
    }

    // Encontrar variação
    const variacoes = produto.variacoes;

    const variacao = variacoes.find(v => 
      v.tamanho === item.tamanho && v.sku === item.sku
    );

    if (!variacao) {
      console.log(`   ⚠️  Variação ${item.tamanho} não encontrada`);
      continue;
    }

    totalEstoqueDevolver += item.quantidade;
    itensParaRestaurar.push({
      produto: item.nome,
      tamanho: item.tamanho,
      quantidade: item.quantidade,
      estoqueAtual: variacao.estoque
    });

    console.log(`   📦 ${item.nome} (${item.tamanho}) - Devolver: ${item.quantidade} un`);
    console.log(`      Estoque atual: ${variacao.estoque} → Após correção: ${variacao.estoque + item.quantidade}`);
  }

  if (itensParaRestaurar.length > 0) {
    vendasParaCorrigir.push({
      id: venda.id,
      cliente: venda.cliente_nome,
      itens: itensParaRestaurar
    });
  }
}

console.log('\n' + '─'.repeat(80));
console.log('\n📊 RESUMO:\n');
console.log(`   Vendas canceladas/rejeitadas: ${vendas.length}`);
console.log(`   Vendas que precisam correção: ${vendasParaCorrigir.length}`);
console.log(`   Total de itens para restaurar: ${totalItens}`);
console.log(`   Total de unidades a devolver: ${totalEstoqueDevolver}`);

if (vendasParaCorrigir.length > 0) {
  console.log('\n⚠️  ATENÇÃO: Este script está em modo PREVIEW (somente leitura)');
  console.log('\n💡 Para corrigir automaticamente, você pode:');
  console.log('   1. Usar o endpoint: POST /api/admin/vendas/cancelar');
  console.log('   2. Ou executar via admin panel (adicionar botão "Restaurar Estoque")');
  console.log('   3. Ou rodar SQL manualmente no Supabase\n');

  console.log('📋 Lista de vendas para corrigir:\n');
  for (const venda of vendasParaCorrigir.slice(0, 10)) {
    console.log(`   - Venda #${venda.id.substring(0, 8)} (${venda.cliente})`);
    console.log(`     curl -X POST http://localhost:3000/api/admin/vendas/cancelar \\`);
    console.log(`          -H "Content-Type: application/json" \\`);
    console.log(`          -d '{"vendaId": "${venda.id}", "motivo": "Correção automática de estoque"}'`);
    console.log('');
  }

  if (vendasParaCorrigir.length > 10) {
    console.log(`   ... e mais ${vendasParaCorrigir.length - 10} vendas\n`);
  }
}

console.log('\n✨ Análise concluída!\n');
