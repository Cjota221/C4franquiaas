/**
 * Script para verificar configuração do Melhor Envio no banco
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ylmmxsdxmovlkpfqamvh.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsbW14c2R4bW92bGtwZnFhbXZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMzkyMDEwMSwiZXhwIjoyMDM5NDk2MTAxfQ.RM7IPQE-PgXW6xAZugFqJU1bCpcUb7xrOvPXOApOXuQ';

async function verificarConfig() {
  console.log('🔍 Verificando configuração do Melhor Envio...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Buscar configuração
    const { data, error } = await supabase
      .from('config_melhorenvio')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar:', error.message);
      console.log('\n💡 A tabela existe? Rode a migration 029 primeiro!');
      return;
    }

    if (!data) {
      console.log('⚠️ Nenhuma configuração encontrada!');
      console.log('💡 Execute o SQL SALVAR_TOKEN_SUPABASE.sql');
      return;
    }

    console.log('✅ Configuração encontrada!');
    console.log('\n📋 Detalhes:');
    console.log('─'.repeat(60));
    console.log(`ID: ${data.id}`);
    console.log(`Token Type: ${data.token_type || 'N/A'}`);
    console.log(`Access Token (primeiros 50 chars): ${data.access_token?.substring(0, 50)}...`);
    console.log(`Refresh Token: ${data.refresh_token || 'N/A'}`);
    console.log(`Expires At: ${data.expires_at || 'N/A'}`);
    console.log(`Scopes: ${data.scopes || 'N/A'}`);
    console.log(`Created: ${data.created_at}`);
    console.log(`Updated: ${data.updated_at}`);
    console.log('─'.repeat(60));

    // Verificar se o token parece válido
    if (data.access_token && data.access_token.startsWith('eyJ')) {
      console.log('\n✅ Token parece ser um JWT válido (começa com eyJ)');
    } else {
      console.log('\n⚠️ Token NÃO parece ser um JWT válido!');
    }

    // Teste rápido de autenticação
    console.log('\n🧪 Testando autenticação com Melhor Envio...');
    
    const isSandbox = process.env.MELHORENVIO_SANDBOX === 'true';
    const baseUrl = isSandbox 
      ? 'https://sandbox.melhorenvio.com.br/api/v2'
      : 'https://melhorenvio.com.br/api/v2';

    const testResponse = await fetch(`${baseUrl}/me`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${data.access_token}`,
        'Content-Type': 'application/json',
      }
    });

    if (testResponse.ok) {
      const userData = await testResponse.json();
      console.log('✅ AUTENTICAÇÃO OK!');
      console.log(`👤 Usuário: ${userData.firstname} ${userData.lastname}`);
      console.log(`📧 Email: ${userData.email}`);
    } else {
      const errorText = await testResponse.text();
      console.log('❌ FALHA NA AUTENTICAÇÃO!');
      console.log(`Status: ${testResponse.status}`);
      console.log(`Erro: ${errorText}`);
      console.log('\n💡 O token pode ter expirado. Gere um novo!');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

verificarConfig();
