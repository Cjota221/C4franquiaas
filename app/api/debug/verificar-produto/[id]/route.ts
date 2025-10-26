import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Endpoint de DEBUG para verificar um produto específico
 * Acesse: /api/debug/verificar-produto/[id]
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: produtoId } = await context.params;
    console.log('\n🔍 [DEBUG] Verificando produto:', produtoId, '\n');

    // 1. Buscar dados do produto
    const { data: produto, error: erroProduto } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', produtoId)
      .single();

    if (erroProduto) {
      console.error('❌ Erro ao buscar produto:', erroProduto);
      return NextResponse.json({
        erro: 'Produto não encontrado',
        detalhes: erroProduto,
      }, { status: 404 });
    }

    console.log('📦 Produto encontrado:', {
      id: produto.id,
      nome: produto.nome,
      preco_base: produto.preco_base,
      ativo: produto.ativo,
      cores: produto.cores,
    });

    // 2. Buscar categoria do produto
    const { data: categoria, error: erroCategoria } = await supabase
      .from('produto_categorias')
      .select('categoria_id')
      .eq('produto_id', produtoId)
      .single();

    let categoriaInfo = null;
    if (!erroCategoria && categoria) {
      const { data: catData } = await supabase
        .from('categorias')
        .select('id, nome, slug')
        .eq('id', categoria.categoria_id)
        .single();
      
      categoriaInfo = catData;
      console.log('📂 Categoria:', catData);
    } else {
      console.warn('⚠️ Produto SEM categoria vinculada');
    }

    // 3. Buscar produtos na mesma faixa de preço
    const precoMin = produto.preco_base * 0.7 * 0.5;
    const precoMax = produto.preco_base * 1.3 * 1.5;

    const { data: produtosFaixaPreco, count: countFaixaPreco } = await supabase
      .from('produtos')
      .select('id, nome, preco_base, ativo', { count: 'exact' })
      .neq('id', produtoId)
      .gte('preco_base', precoMin)
      .lte('preco_base', precoMax);

    console.log(`\n💰 Produtos na faixa de preço (R$ ${precoMin.toFixed(2)} - R$ ${precoMax.toFixed(2)}):`);
    console.log(`   Total: ${countFaixaPreco}`);
    console.log(`   Ativos: ${produtosFaixaPreco?.filter(p => p.ativo).length}`);

    // 4. Se produto tem categoria, buscar produtos da mesma categoria
    let produtosMesmaCategoria = null;
    if (categoria?.categoria_id) {
      const { data: vinculacoesMesmaCategoria } = await supabase
        .from('produto_categorias')
        .select('produto_id')
        .eq('categoria_id', categoria.categoria_id)
        .neq('produto_id', produtoId);

      if (vinculacoesMesmaCategoria && vinculacoesMesmaCategoria.length > 0) {
        const ids = vinculacoesMesmaCategoria.map(v => v.produto_id);
        const { data: prods } = await supabase
          .from('produtos')
          .select('id, nome, preco_base, ativo')
          .in('id', ids);
        
        produtosMesmaCategoria = prods || [];
      } else {
        produtosMesmaCategoria = [];
      }
      
      console.log(`\n📂 Produtos na mesma categoria (${categoriaInfo?.nome || 'N/A'}):`);
      console.log(`   Total: ${produtosMesmaCategoria.length}`);
      console.log(`   Ativos: ${produtosMesmaCategoria.filter(p => p?.ativo).length}`);
    }

    // 5. Simular busca de relacionados
    const relacionadosTest = produtosFaixaPreco
      ?.filter(p => p.ativo)
      .slice(0, 20);

    console.log(`\n🎯 Simulação de produtos relacionados:`);
    console.log(`   Candidatos (faixa de preço + ativos): ${relacionadosTest?.length || 0}`);
    
    if (relacionadosTest && relacionadosTest.length > 0) {
      console.log('   Top 6:');
      relacionadosTest.slice(0, 6).forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.nome} - R$ ${p.preco_base}`);
      });
    }

    return NextResponse.json({
      sucesso: true,
      produto: {
        id: produto.id,
        nome: produto.nome,
        preco_base: produto.preco_base,
        ativo: produto.ativo,
        cores: produto.cores,
      },
      categoria: categoria && categoriaInfo ? {
        id: categoria.categoria_id,
        nome: categoriaInfo.nome,
        slug: categoriaInfo.slug,
      } : null,
      estatisticas: {
        produtosNaFaixaDePreco: {
          total: countFaixaPreco,
          ativos: produtosFaixaPreco?.filter(p => p.ativo).length,
          faixa: `R$ ${precoMin.toFixed(2)} - R$ ${precoMax.toFixed(2)}`,
        },
        produtosNaMesmaCategoria: produtosMesmaCategoria ? {
          total: produtosMesmaCategoria.length,
          ativos: produtosMesmaCategoria.filter(p => p?.ativo).length,
        } : null,
        relacionadosSimulacao: relacionadosTest?.length || 0,
      },
      exemplos: {
        faixaPreco: produtosFaixaPreco?.slice(0, 5),
        mesmaCategoria: produtosMesmaCategoria?.slice(0, 5),
        relacionados: relacionadosTest?.slice(0, 6),
      },
    });

  } catch (error) {
    console.error('❌ [DEBUG] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao verificar produto' },
      { status: 500 }
    );
  }
}
