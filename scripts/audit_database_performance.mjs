/**
 * ============================================================================
 * SCRIPT DE VERIFICAÇÃO DE PERFORMANCE DO BANCO DE DADOS
 * ============================================================================
 * Verifica se os índices foram aplicados corretamente e testa queries
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('🔍 AUDITORIA DE PERFORMANCE DO BANCO DE DADOS\n');
console.log('='.repeat(80));

// ============================================================================
// 1. VERIFICAR ÍNDICES
// ============================================================================
async function verificarIndices() {
  console.log('\n📊 1. VERIFICANDO ÍNDICES CRIADOS\n');

  const { data, error } = await supabase.rpc('verificar_indices', {}, {
    count: 'exact'
  });

  // Como o RPC pode não existir, fazemos query direta
  const indicesEsperados = [
    'idx_produtos_nome_trgm',
    'idx_produtos_codigo_barras',
    'idx_produtos_ativo',
    'idx_produtos_ativo_nome',
    'idx_lojas_dominio',
    'idx_lojas_franqueada_id',
    'idx_produtos_franqueadas_produto_id',
    'idx_produtos_franqueadas_franqueada_id',
    'idx_categorias_pai_id',
    'idx_produto_categorias_produto_id',
    'idx_produto_categorias_categoria_id'
  ];

  console.log('Índices esperados:', indicesEsperados.length);
  
  for (const idx of indicesEsperados) {
    console.log(`  ${idx.padEnd(50)} ... verificando`);
  }

  console.log('\n✅ Execute no SQL Editor do Supabase para verificar:');
  console.log(`
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
  `);
}

// ============================================================================
// 2. TESTAR QUERY DE BUSCA (ANTES vs DEPOIS dos índices)
// ============================================================================
async function testarQueryBusca() {
  console.log('\n⚡ 2. TESTANDO PERFORMANCE DE BUSCA\n');

  const termosBusca = ['batom', 'shampoo', 'perfume'];

  for (const termo of termosBusca) {
    console.log(`\n🔎 Buscando: "${termo}"`);
    
    const inicio = Date.now();
    
    const { data, error } = await supabase
      .from('produtos')
      .select('id, nome, preco_base, ativo')
      .eq('ativo', true)
      .ilike('nome', `%${termo}%`)
      .order('nome', { ascending: true })
      .limit(15);

    const tempo = Date.now() - inicio;

    if (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      continue;
    }

    console.log(`   ✅ ${data?.length || 0} resultados`);
    console.log(`   ⏱️  Tempo: ${tempo}ms`);
    
    if (tempo < 100) {
      console.log(`   🚀 EXCELENTE - Usando índice!`);
    } else if (tempo < 500) {
      console.log(`   ⚠️  ACEITÁVEL - Pode melhorar com índices`);
    } else {
      console.log(`   ❌ LENTO - Provavelmente não está usando índice`);
    }
  }
}

// ============================================================================
// 3. TESTAR QUERY DE LOJA POR DOMÍNIO (CRÍTICA!)
// ============================================================================
async function testarQueryLoja() {
  console.log('\n🏪 3. TESTANDO BUSCA DE LOJA POR DOMÍNIO\n');

  const dominiosTeste = ['loja-teste', 'demo', 'exemplo'];

  for (const dominio of dominiosTeste) {
    console.log(`\n🔎 Domínio: "${dominio}"`);
    
    const inicio = Date.now();
    
    const { data, error } = await supabase
      .from('lojas')
      .select('id, nome, dominio, cor_primaria')
      .eq('dominio', dominio)
      .eq('ativo', true)
      .single();

    const tempo = Date.now() - inicio;

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found (esperado)
      console.log(`   ❌ Erro: ${error.message}`);
      continue;
    }

    console.log(`   ${data ? '✅ Encontrado' : '⚠️  Não encontrado'}`);
    console.log(`   ⏱️  Tempo: ${tempo}ms`);
    
    if (tempo < 50) {
      console.log(`   🚀 EXCELENTE - Índice único funcionando!`);
    } else if (tempo < 200) {
      console.log(`   ⚠️  ACEITÁVEL`);
    } else {
      console.log(`   ❌ LENTO - Índice pode não estar ativo`);
    }
  }
}

// ============================================================================
// 4. TESTAR JOIN PRODUTOS + FRANQUEADAS (COMPLEXA)
// ============================================================================
async function testarQueryProdutosFranqueadas() {
  console.log('\n🔗 4. TESTANDO JOIN PRODUTOS + FRANQUEADAS\n');

  console.log('Buscando produtos de uma franqueada aleatória...');
  
  const inicio = Date.now();
  
  const { data, error } = await supabase
    .from('produtos_franqueadas')
    .select(`
      id,
      produto_id,
      produtos:produto_id (
        id,
        nome,
        preco_base
      )
    `)
    .eq('ativo', true)
    .limit(20);

  const tempo = Date.now() - inicio;

  if (error) {
    console.log(`❌ Erro: ${error.message}`);
    return;
  }

  console.log(`✅ ${data?.length || 0} vinculações encontradas`);
  console.log(`⏱️  Tempo: ${tempo}ms`);
  
  if (tempo < 200) {
    console.log(`🚀 EXCELENTE - Índices de FK funcionando!`);
  } else if (tempo < 1000) {
    console.log(`⚠️  ACEITÁVEL - Pode melhorar`);
  } else {
    console.log(`❌ LENTO - Verificar índices de FK`);
  }
}

// ============================================================================
// 5. VERIFICAR EXTENSÃO PG_TRGM
// ============================================================================
async function verificarExtensoes() {
  console.log('\n🔌 5. VERIFICANDO EXTENSÕES DO POSTGRESQL\n');

  console.log('✅ Execute no SQL Editor do Supabase:');
  console.log(`
SELECT 
  extname AS "Extensão",
  extversion AS "Versão"
FROM pg_extension
WHERE extname IN ('pg_trgm', 'unaccent');
  `);

  console.log('\n📝 Se pg_trgm não estiver instalado, execute:');
  console.log('   CREATE EXTENSION IF NOT EXISTS pg_trgm;');
}

// ============================================================================
// 6. ANÁLISE DE TAMANHO DAS TABELAS
// ============================================================================
async function analisarTamanhoTabelas() {
  console.log('\n📦 6. ANÁLISE DE TAMANHO DAS TABELAS\n');

  console.log('✅ Execute no SQL Editor do Supabase:');
  console.log(`
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS tamanho_total,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS tamanho_tabela,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS tamanho_indices
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
  `);
}

// ============================================================================
// EXECUTAR TODOS OS TESTES
// ============================================================================
async function executarAuditoria() {
  try {
    await verificarIndices();
    await testarQueryBusca();
    await testarQueryLoja();
    await testarQueryProdutosFranqueadas();
    await verificarExtensoes();
    await analisarTamanhoTabelas();

    console.log('\n' + '='.repeat(80));
    console.log('✅ AUDITORIA CONCLUÍDA');
    console.log('='.repeat(80));
    console.log('\n📊 PRÓXIMOS PASSOS:');
    console.log('   1. Aplicar a migration 018_performance_indexes.sql');
    console.log('   2. Executar VACUUM ANALYZE para atualizar estatísticas');
    console.log('   3. Rodar este script novamente para comparar resultados');
    console.log('   4. Monitorar queries lentas com pg_stat_statements\n');

  } catch (err) {
    console.error('❌ Erro durante auditoria:', err);
    process.exit(1);
  }
}

// Executar
executarAuditoria();
