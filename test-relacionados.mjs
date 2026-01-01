import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testarProdutosRelacionados() {
  console.log('🔍 Testando Produtos Relacionados...\n');
  
  // 1. Buscar uma revendedora aprovada
  const { data: reseller } = await supabase
    .from('resellers')
    .select('id, slug, store_name')
    .eq('status', 'aprovada')
    .limit(1)
    .single();
  
  if (!reseller) {
    console.log('❌ Nenhuma revendedora aprovada encontrada');
    return;
  }
  
  console.log(`✅ Revendedora: ${reseller.store_name} (${reseller.slug})`);
  
  // 2. Buscar produtos vinculados ATIVOS
  const { data: produtosAtivos, count: countAtivos } = await supabase
    .from('reseller_products')
    .select('product_id, margin_percent, is_active', { count: 'exact' })
    .eq('reseller_id', reseller.id)
    .eq('is_active', true);
  
  console.log(`📦 Produtos ATIVOS vinculados: ${countAtivos || 0}`);
  
  if (!produtosAtivos || produtosAtivos.length === 0) {
    console.log('⚠️  Revendedora não tem produtos ATIVOS!');
    console.log('   Para produtos relacionados aparecerem, precisa:');
    console.log('   1. Definir margem de lucro nos produtos');
    console.log('   2. Ativar os produtos (is_active = true)\n');
  }
  
  // 3. Buscar TODOS produtos vinculados (ativos ou não)
  const { data: todosProdutos, count: countTotal } = await supabase
    .from('reseller_products')
    .select('product_id, margin_percent, is_active', { count: 'exact' })
    .eq('reseller_id', reseller.id);
  
  console.log(`📦 TOTAL de produtos vinculados: ${countTotal || 0}`);
  
  if (todosProdutos && todosProdutos.length > 0) {
    const desativados = todosProdutos.filter(p => !p.is_active).length;
    const semMargem = todosProdutos.filter(p => p.margin_percent === 0).length;
    
    console.log(`   - Desativados: ${desativados}`);
    console.log(`   - Sem margem definida: ${semMargem}`);
  }
  
  // 4. Se tem produtos ativos, pegar um produto e ver categorias
  if (produtosAtivos && produtosAtivos.length > 0) {
    const primeiroProduto = produtosAtivos[0];
    
    const { data: produto } = await supabase
      .from('produtos')
      .select('id, nome, categorias')
      .eq('id', primeiroProduto.product_id)
      .single();
    
    if (produto) {
      console.log(`\n🔍 Testando produto: ${produto.nome}`);
      console.log(`   Categoria: ${produto.categorias}`);
      
      // Buscar produtos relacionados (mesma categoria)
      const { data: relacionados } = await supabase
        .from('reseller_products')
        .select(`
          product_id,
          margin_percent,
          produtos:product_id (
            id,
            nome,
            categorias
          )
        `)
        .eq('reseller_id', reseller.id)
        .eq('is_active', true)
        .neq('product_id', produto.id);
      
      if (relacionados) {
        const mesmaCategoria = relacionados.filter(item => {
          const prod = Array.isArray(item.produtos) ? item.produtos[0] : item.produtos;
          return prod?.categorias === produto.categorias;
        });
        
        console.log(`   ✨ Produtos relacionados (mesma categoria): ${mesmaCategoria.length}`);
        
        if (mesmaCategoria.length > 0) {
          console.log('   ✅ PRODUTOS RELACIONADOS ENCONTRADOS!');
          mesmaCategoria.slice(0, 3).forEach(item => {
            const prod = Array.isArray(item.produtos) ? item.produtos[0] : item.produtos;
            console.log(`      - ${prod?.nome}`);
          });
        } else {
          console.log('   ⚠️  Nenhum produto com a mesma categoria encontrado');
        }
      }
    }
  }
  
  console.log('\n📋 RESUMO:');
  if (!produtosAtivos || produtosAtivos.length === 0) {
    console.log('❌ Produtos relacionados NÃO vão aparecer');
    console.log('   Motivo: Nenhum produto ATIVO');
    console.log('\n💡 SOLUÇÃO:');
    console.log('   1. Execute: SCRIPT_VINCULAR_PRODUTOS_REVENDEDORAS_EXISTENTES.sql');
    console.log('   2. Acesse /revendedora/produtos/novos');
    console.log('   3. Defina margem de lucro e ATIVE os produtos');
  } else {
    console.log('✅ Produtos relacionados devem aparecer (se houver mesma categoria)');
  }
}

testarProdutosRelacionados().catch(console.error);
