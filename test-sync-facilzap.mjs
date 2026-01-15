// ============================================
// 🧪 TESTE MANUAL DE SINCRONIZAÇÃO
// ============================================
// Execute este script para testar se a API do FácilZap está respondendo
// e onde exatamente está quebrando o fluxo
// 
// COMO USAR:
// node test-sync-facilzap.mjs
// ============================================

const FACILZAP_TOKEN = process.env.FACILZAP_TOKEN;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 DIAGNÓSTICO DE SINCRONIZAÇÃO\n');
console.log('═'.repeat(50));

// 1️⃣ VERIFICAR VARIÁVEIS DE AMBIENTE
console.log('\n1️⃣ VERIFICANDO CONFIGURAÇÃO...');
console.log(`   ✓ FACILZAP_TOKEN: ${FACILZAP_TOKEN ? '✅ Presente' : '❌ FALTANDO'}`);
console.log(`   ✓ SUPABASE_URL: ${SUPABASE_URL ? '✅ Presente' : '❌ FALTANDO'}`);
console.log(`   ✓ SUPABASE_KEY: ${SUPABASE_KEY ? '✅ Presente' : '❌ FALTANDO'}`);

if (!FACILZAP_TOKEN) {
  console.error('\n❌ ERRO CRÍTICO: Token do FácilZap não encontrado!');
  console.error('   Configure a variável FACILZAP_TOKEN no .env.local');
  process.exit(1);
}

// 2️⃣ TESTAR CONEXÃO COM FACILZAP
console.log('\n2️⃣ TESTANDO CONEXÃO COM FACILZAP...');
console.log('   Fazendo requisição para: https://api.facilzap.com/produtos');

try {
  const response = await fetch('https://api.facilzap.com/produtos?page=1&length=5', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${FACILZAP_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  console.log(`   Status HTTP: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    console.error(`\n❌ ERRO: API retornou status ${response.status}`);
    
    if (response.status === 401) {
      console.error('   🔑 TOKEN INVÁLIDO ou EXPIRADO!');
      console.error('   Solução: Renove o token do FácilZap');
    } else if (response.status === 403) {
      console.error('   🚫 TOKEN SEM PERMISSÃO!');
      console.error('   Solução: Verifique permissões da API Key');
    } else if (response.status === 500) {
      console.error('   ⚠️ ERRO NO SERVIDOR DO FACILZAP!');
      console.error('   Solução: Aguarde ou contate suporte FácilZap');
    }
    
    const errorText = await response.text();
    console.error(`   Resposta: ${errorText}`);
    process.exit(1);
  }

  const data = await response.json();
  
  console.log(`\n   ✅ SUCESSO! API respondendo normalmente`);
  console.log(`   📦 Total de produtos recebidos: ${data.data?.length || 0}`);
  console.log(`   📄 Página: ${data.current_page || 1} de ${data.last_page || '?'}`);
  console.log(`   🔢 Total geral: ${data.total || '?'} produtos`);
  
  if (data.data && data.data.length > 0) {
    const produto = data.data[0];
    console.log('\n   📝 Exemplo de produto:');
    console.log(`      - ID: ${produto.id}`);
    console.log(`      - Nome: ${produto.nome || produto.name}`);
    console.log(`      - Estoque: ${produto.estoque || produto.stock}`);
    console.log(`      - Preço: R$ ${produto.preco_base || produto.preco}`);
    console.log(`      - Ativo: ${produto.ativo}`);
  }

} catch (error) {
  console.error('\n❌ ERRO AO CONECTAR COM FACILZAP:');
  console.error(`   ${error.message}`);
  
  if (error.code === 'ENOTFOUND') {
    console.error('   🌐 ERRO DE DNS - Verifique sua conexão com internet');
  } else if (error.code === 'ECONNREFUSED') {
    console.error('   🔌 CONEXÃO RECUSADA - API pode estar fora do ar');
  }
  
  process.exit(1);
}

// 3️⃣ TESTAR CONEXÃO COM SUPABASE
console.log('\n3️⃣ TESTANDO CONEXÃO COM SUPABASE...');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('   ❌ Configuração do Supabase incompleta');
  process.exit(1);
}

try {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const { data: _data, error } = await supabase
    .from('produtos')
    .select('count')
    .limit(1)
    .single();
  
  if (error) {
    console.error(`   ❌ ERRO ao conectar com Supabase: ${error.message}`);
    process.exit(1);
  }
  
  const { count } = await supabase
    .from('produtos')
    .select('*', { count: 'exact', head: true });
  
  console.log(`   ✅ SUCESSO! Conexão com Supabase OK`);
  console.log(`   📊 Total de produtos no banco: ${count || 0}`);
  
} catch (error) {
  console.error(`   ❌ ERRO: ${error.message}`);
  process.exit(1);
}

// 4️⃣ TESTAR SINCRONIZAÇÃO REAL
console.log('\n4️⃣ TESTANDO SINCRONIZAÇÃO COMPLETA...');
console.log('   Chamando API local: /api/sync-produtos');

try {
  const syncResponse = await fetch('http://localhost:3000/api/sync-produtos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ page: 1, length: 10 }),
  });
  
  if (!syncResponse.ok) {
    console.error(`   ❌ ERRO: Status ${syncResponse.status}`);
    const errorText = await syncResponse.text();
    console.error(`   Resposta: ${errorText}`);
    process.exit(1);
  }
  
  const syncData = await syncResponse.json();
  
  console.log(`\n   ✅ SINCRONIZAÇÃO CONCLUÍDA!`);
  console.log(`   📥 Produtos importados: ${syncData.imported || 0}`);
  console.log(`   🆕 Novos: ${syncData.new || 0}`);
  console.log(`   🔄 Atualizados: ${syncData.updated || 0}`);
  console.log(`   ⏭️ Sem mudanças: ${syncData.unchanged || 0}`);
  
} catch (error) {
  console.error(`\n   ❌ ERRO na sincronização: ${error.message}`);
  
  if (error.code === 'ECONNREFUSED') {
    console.error('   ⚠️ Servidor local não está rodando!');
    console.error('   Execute: npm run dev');
  }
  
  process.exit(1);
}

// 5️⃣ VERIFICAR ÚLTIMA SINCRONIZAÇÃO NO BANCO
console.log('\n5️⃣ VERIFICANDO ÚLTIMA SINCRONIZAÇÃO NO BANCO...');

try {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const { data: ultimaSync } = await supabase
    .from('produtos')
    .select('ultima_sincronizacao')
    .order('ultima_sincronizacao', { ascending: false })
    .limit(1)
    .single();
  
  if (ultimaSync?.ultima_sincronizacao) {
    const dataSync = new Date(ultimaSync.ultima_sincronizacao);
    const agora = new Date();
    const diffMs = agora - dataSync;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMin / 60);
    
    console.log(`   📅 Última sincronização: ${dataSync.toLocaleString('pt-BR')}`);
    console.log(`   ⏰ Há ${diffHoras > 0 ? `${diffHoras}h ${diffMin % 60}min` : `${diffMin} minutos`} atrás`);
    
    if (diffHoras > 2) {
      console.warn(`\n   ⚠️ ATENÇÃO: Sincronização está muito antiga!`);
      console.warn(`   Produtos podem estar desatualizados.`);
    }
  }
  
} catch (error) {
  console.error(`   ❌ Erro: ${error.message}`);
}

console.log('\n' + '═'.repeat(50));
console.log('🏁 DIAGNÓSTICO CONCLUÍDO\n');
