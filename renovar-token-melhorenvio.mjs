/**
 * Script para renovar token do Melhor Envio
 * 
 * COMO USAR:
 * 1. Acesse: https://melhorenvio.com.br/painel/gerenciar/tokens
 * 2. Clique em "Gerar novo token"
 * 3. Copie o token gerado
 * 4. Execute: node renovar-token-melhorenvio.mjs
 * 5. Cole o token quando solicitado
 */

import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.log('Configure: NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔄 Renovador de Token - Melhor Envio\n');
console.log('📝 PASSO A PASSO:');
console.log('1. Acesse: https://melhorenvio.com.br/painel/gerenciar/tokens');
console.log('2. Clique em "Gerar novo token"');
console.log('3. Copie o token gerado');
console.log('4. Cole aqui abaixo\n');

rl.question('🔑 Cole o novo token: ', async (token) => {
  if (!token || token.trim().length < 50) {
    console.error('❌ Token inválido! Deve ter pelo menos 50 caracteres.');
    rl.close();
    process.exit(1);
  }

  try {
    // Verificar se já existe configuração
    const { data: existing } = await supabase
      .from('config_melhorenvio')
      .select('*')
      .eq('id', 1)
      .single();

    let result;
    
    if (existing) {
      // Atualizar token existente
      result = await supabase
        .from('config_melhorenvio')
        .update({
          access_token: token.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', 1);
    } else {
      // Inserir novo
      result = await supabase
        .from('config_melhorenvio')
        .insert({
          id: 1,
          access_token: token.trim(),
        });
    }

    if (result.error) {
      console.error('❌ Erro ao salvar no banco:', result.error.message);
      rl.close();
      process.exit(1);
    }

    console.log('\n✅ Token atualizado com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('1. Teste novamente o cálculo de frete');
    console.log('2. Acesse: https://c4franquiaas.netlify.app/admin/configuracoes/melhorenvio/testes');
    console.log('3. Clique em "Calcular Frete"');
    
    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    rl.close();
    process.exit(1);
  }
});
