#!/usr/bin/env node
/**
 * 🧪 Script de teste direto da API FácilZap
 * 
 * USO:
 * 1. Configure FACILZAP_TOKEN no arquivo .env
 * 2. Execute: node test-facilzap-direct.mjs
 */

import axios from 'axios';

const FACILZAP_API = 'https://api.facilzap.app.br';
const FACILZAP_TOKEN = process.env.FACILZAP_TOKEN;

console.log('\n🔍 TESTE DE CONEXÃO FACILZAP\n');
console.log('====================================');
console.log(`API: ${FACILZAP_API}`);
console.log(`Token presente: ${!!FACILZAP_TOKEN ? '✅ SIM' : '❌ NÃO'}`);
if (FACILZAP_TOKEN) {
  console.log(`Token (primeiros 20 chars): ${FACILZAP_TOKEN.substring(0, 20)}...`);
}
console.log('====================================\n');

if (!FACILZAP_TOKEN) {
  console.error('❌ ERRO: FACILZAP_TOKEN não configurado!');
  console.log('\n📝 Configure no Netlify:');
  console.log('   Site → Site settings → Environment variables');
  console.log('   Adicione: FACILZAP_TOKEN = seu_token_aqui\n');
  process.exit(1);
}

async function testAPI() {
  console.log('1️⃣ Testando GET /produtos?page=1&length=10...\n');
  
  try {
    const response = await axios.get(`${FACILZAP_API}/produtos`, {
      params: { page: 1, length: 10 },
      headers: {
        'Authorization': `Bearer ${FACILZAP_TOKEN}`,
        'Accept': 'application/json',
      },
      timeout: 15000,
    });

    console.log('✅ SUCESSO! API respondeu\n');
    console.log('Status:', response.status);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('\n📦 Estrutura da resposta:');
    console.log(JSON.stringify(response.data, null, 2).substring(0, 1000));
    
    // Analisar estrutura
    if (response.data) {
      console.log('\n📊 Análise:');
      console.log(`Tipo: ${typeof response.data}`);
      console.log(`É array: ${Array.isArray(response.data)}`);
      
      if (typeof response.data === 'object' && response.data !== null) {
        console.log(`Chaves disponíveis: ${Object.keys(response.data).join(', ')}`);
        
        // Verificar onde estão os produtos
        if (response.data.data) {
          console.log(`\n✅ Produtos encontrados em 'data':`);
          console.log(`   Total: ${Array.isArray(response.data.data) ? response.data.data.length : 'N/A'}`);
          if (Array.isArray(response.data.data) && response.data.data.length > 0) {
            console.log(`\n🔍 Primeiro produto:`);
            console.log(JSON.stringify(response.data.data[0], null, 2));
          }
        } else if (Array.isArray(response.data)) {
          console.log(`\n✅ Resposta é array direto:`);
          console.log(`   Total: ${response.data.length}`);
          if (response.data.length > 0) {
            console.log(`\n🔍 Primeiro produto:`);
            console.log(JSON.stringify(response.data[0], null, 2));
          }
        }
      }
    }

  } catch (error) {
    console.error('\n❌ ERRO ao chamar API:\n');
    
    if (error.response) {
      // Resposta do servidor com erro
      console.error(`Status: ${error.response.status} ${error.response.statusText}`);
      console.error(`Headers:`, error.response.headers);
      console.error(`Dados:`, JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.error('\n🔑 ERRO 401: Token inválido ou expirado!');
        console.error('   → Renove o token no painel do FácilZap');
        console.error('   → Atualize FACILZAP_TOKEN no Netlify');
      } else if (error.response.status === 429) {
        console.error('\n⏱️ ERRO 429: Rate limit atingido!');
        console.error('   → Aguarde alguns minutos antes de tentar novamente');
      } else if (error.response.status === 403) {
        console.error('\n🚫 ERRO 403: Acesso negado!');
        console.error('   → Verifique permissões do token');
      }
    } else if (error.request) {
      // Requisição foi feita mas sem resposta
      console.error('Sem resposta do servidor');
      console.error('Request:', error.request);
      console.error('\n🌐 Possíveis causas:');
      console.error('   → API do FácilZap fora do ar');
      console.error('   → Problemas de rede');
      console.error('   → Timeout (limite: 15s)');
    } else {
      // Erro na configuração da requisição
      console.error('Erro:', error.message);
    }
    
    console.error('\n📚 Stack trace:', error.stack);
    process.exit(1);
  }
}

testAPI();
