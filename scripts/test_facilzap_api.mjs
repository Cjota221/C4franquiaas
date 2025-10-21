#!/usr/bin/env node
import axios from 'axios';

const token = process.argv[2] || process.env.FACILZAP_TOKEN;

if (!token) {
  console.error('❌ FACILZAP_TOKEN não configurado');
  process.exit(1);
}

async function testFacilZap() {
  console.log('🔍 Buscando produto 3469603 da API FácilZap...\n');
  
  try {
    const client = axios.create({
      baseURL: 'https://api.facilzap.app.br',
      timeout: 10000,
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const resp = await client.get('/produtos/3469603');
    const produto = resp.data;
    
    console.log('📦 Produto recebido:\n');
    console.log('Nome:', produto.nome);
    console.log('ID:', produto.id);
    console.log('\n🔍 Campos disponíveis no produto:');
    console.log(Object.keys(produto).join(', '));
    
    console.log('\n📋 Produto cod_barras:');
    console.log(JSON.stringify(produto.cod_barras, null, 2));
    
    console.log('\n📋 Variações:');
    if (produto.variacoes && Array.isArray(produto.variacoes)) {
      console.log(`Total: ${produto.variacoes.length}\n`);
      
      produto.variacoes.forEach((v, idx) => {
        console.log(`Variação ${idx + 1}:`);
        console.log('  Nome:', v.nome);
        console.log('  SKU:', v.sku);
        console.log('  cod_barras:', JSON.stringify(v.cod_barras));
        console.log('');
      });
    } else {
      console.log('❌ Nenhuma variação encontrada');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.data || error.message);
  }
}

testFacilZap();
