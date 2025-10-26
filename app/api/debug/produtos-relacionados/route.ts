import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Endpoint de DEBUG para verificar estado dos produtos relacionados
 * Acesse: /api/debug/produtos-relacionados
 */
export async function GET() {
  try {
    console.log('\n🔍 [DEBUG] Verificando produtos relacionados...\n');

    // 1. Contar produtos ativos
    const { count: totalProdutos } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    console.log(`📦 Total de produtos ativos: ${totalProdutos}`);

    // 2. Buscar alguns produtos para exemplo
    const { data: produtosExemplo } = await supabase
      .from('produtos')
      .select('id, nome, preco_base, cores, ativo')
      .eq('ativo', true)
      .limit(5);

    console.log('📋 Exemplos de produtos:', produtosExemplo);

    // 3. Contar vinculações produto-categoria
    const { count: totalVinculacoes } = await supabase
      .from('produto_categorias')
      .select('*', { count: 'exact', head: true });

    console.log(`🏷️ Total de vinculações produto-categoria: ${totalVinculacoes}`);

    // 4. Buscar vinculações dos produtos de exemplo
    if (produtosExemplo && produtosExemplo.length > 0) {
      const produtoIds = produtosExemplo.map(p => p.id);
      const { data: vinculacoesExemplo } = await supabase
        .from('produto_categorias')
        .select('produto_id, categoria_id')
        .in('produto_id', produtoIds);

      console.log('🔗 Vinculações dos produtos exemplo:', vinculacoesExemplo);
    }

    // 5. Contar categorias
    const { count: totalCategorias } = await supabase
      .from('categorias')
      .select('*', { count: 'exact', head: true });

    console.log(`📂 Total de categorias: ${totalCategorias}`);

    // 6. Buscar categorias
    const { data: categoriasExemplo } = await supabase
      .from('categorias')
      .select('id, nome, slug')
      .limit(5);

    console.log('📋 Exemplos de categorias:', categoriasExemplo);

    // 7. Testar busca de produtos relacionados para o primeiro produto
    if (produtosExemplo && produtosExemplo.length > 0) {
      const primeiroProduto = produtosExemplo[0];
      const precoMin = primeiroProduto.preco_base * 0.7 * 0.5;
      const precoMax = primeiroProduto.preco_base * 1.3 * 1.5;

      const { data: relacionadosTest, count: countRelacionados } = await supabase
        .from('produtos')
        .select('id, nome, preco_base', { count: 'exact' })
        .neq('id', primeiroProduto.id)
        .eq('ativo', true)
        .gte('preco_base', precoMin)
        .lte('preco_base', precoMax)
        .limit(20);

      console.log(`\n🎯 Teste de busca relacionados para "${primeiroProduto.nome}":`);
      console.log(`   Preço: R$ ${primeiroProduto.preco_base}`);
      console.log(`   Faixa: R$ ${precoMin.toFixed(2)} - R$ ${precoMax.toFixed(2)}`);
      console.log(`   Encontrados: ${countRelacionados} produtos`);
      console.log('   Produtos:', relacionadosTest?.map(p => `${p.nome} (R$ ${p.preco_base})`));
    }

    return NextResponse.json({
      sucesso: true,
      dados: {
        produtos: {
          total: totalProdutos,
          exemplos: produtosExemplo,
        },
        categorias: {
          total: totalCategorias,
          exemplos: categoriasExemplo,
        },
        vinculacoes: {
          total: totalVinculacoes,
          exemplos: produtosExemplo && produtosExemplo.length > 0 
            ? await supabase
                .from('produto_categorias')
                .select('produto_id, categoria_id')
                .in('produto_id', produtosExemplo.map(p => p.id))
                .then(r => r.data)
            : [],
        },
      },
      mensagem: 'Verifique o console do servidor para logs detalhados',
    });

  } catch (error) {
    console.error('❌ [DEBUG] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar dados' },
      { status: 500 }
    );
  }
}
