import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Endpoint de teste para debug de produtos relacionados
 * Acesse: /api/test/produtos-relacionados?produto_id=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const produtoId = searchParams.get('produto_id');

    if (!produtoId) {
      return NextResponse.json({
        error: 'Parâmetro produto_id é obrigatório',
        exemplo: '/api/test/produtos-relacionados?produto_id=72518877-5775-4cc3-9c61-60f3bd88ae65',
      }, { status: 400 });
    }

    console.log('\n🔍 [TEST] Testando produtos relacionados para:', produtoId, '\n');

    // 1. Verificar se produto existe
    const { data: produto, error: erroProduto } = await supabase
      .from('produtos')
      .select('*')
      .eq('id', produtoId)
      .single();

    if (erroProduto || !produto) {
      return NextResponse.json({
        error: 'Produto não encontrado',
        produto_id: produtoId,
        erro_supabase: erroProduto?.message,
      }, { status: 404 });
    }

    console.log('✅ Produto encontrado:', produto.nome);

    // 2. Buscar categoria do produto
    const { data: categoria } = await supabase
      .from('produto_categorias')
      .select('categoria_id, categorias(nome)')
      .eq('produto_id', produtoId)
      .single();

    console.log('📂 Categoria:', categoria);

    // 3. Contar produtos ativos totais
    const { count: totalAtivos } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    console.log('📊 Total de produtos ativos no sistema:', totalAtivos);

    // 4. Testar estratégia 1: Mesma categoria
    let produtosMesmaCategoria = null;
    if (categoria?.categoria_id) {
      const { data: vinculacoes } = await supabase
        .from('produto_categorias')
        .select('produto_id')
        .eq('categoria_id', categoria.categoria_id)
        .neq('produto_id', produtoId);

      if (vinculacoes && vinculacoes.length > 0) {
        const ids = vinculacoes.map(v => v.produto_id);
        const { data: prods } = await supabase
          .from('produtos')
          .select('id, nome, preco_base, ativo')
          .in('id', ids)
          .eq('ativo', true);
        
        produtosMesmaCategoria = prods;
        console.log(`🎯 Estratégia 1 (mesma categoria): ${prods?.length || 0} produtos`);
      }
    }

    // 5. Testar estratégia 2: Faixa de preço
    const precoBase = produto.preco_base || 100;
    const precoMin = precoBase * 0.7 * 0.5;
    const precoMax = precoBase * 1.3 * 1.5;

    const { data: produtosPorPreco } = await supabase
      .from('produtos')
      .select('id, nome, preco_base, ativo')
      .neq('id', produtoId)
      .eq('ativo', true)
      .gte('preco_base', precoMin)
      .lte('preco_base', precoMax);

    console.log(`💰 Estratégia 2 (faixa de preço R$${precoMin.toFixed(2)} - R$${precoMax.toFixed(2)}): ${produtosPorPreco?.length || 0} produtos`);

    // 6. Testar estratégia 3: Qualquer produto
    const { data: produtosGenericos, count: countGenericos } = await supabase
      .from('produtos')
      .select('id, nome, preco_base, ativo', { count: 'exact' })
      .neq('id', produtoId)
      .eq('ativo', true)
      .limit(20);

    console.log(`🌐 Estratégia 3 (genéricos): ${produtosGenericos?.length || 0} produtos (total: ${countGenericos})`);

    // 7. Chamar API real de produtos relacionados
    const apiUrl = new URL(`/api/produtos/relacionados/${produtoId}`, request.url);
    const apiResponse = await fetch(apiUrl.toString());
    const apiData = await apiResponse.json();

    console.log('📡 Resposta da API real:', apiData);

    return NextResponse.json({
      sucesso: true,
      produto: {
        id: produto.id,
        nome: produto.nome,
        preco_base: produto.preco_base,
        ativo: produto.ativo,
      },
      categoria: categoria ? {
        id: categoria.categoria_id,
        nome: Array.isArray(categoria.categorias) 
          ? categoria.categorias[0]?.nome || 'N/A' 
          : (categoria.categorias as {nome?: string})?.nome || 'N/A',
      } : null,
      estatisticas: {
        total_produtos_ativos: totalAtivos,
        produtos_mesma_categoria: produtosMesmaCategoria?.length || 0,
        produtos_faixa_preco: produtosPorPreco?.length || 0,
        produtos_genericos: produtosGenericos?.length || 0,
      },
      estrategias: {
        estrategia_1_mesma_categoria: {
          qtd: produtosMesmaCategoria?.length || 0,
          produtos: produtosMesmaCategoria?.slice(0, 5),
        },
        estrategia_2_faixa_preco: {
          faixa: `R$ ${precoMin.toFixed(2)} - R$ ${precoMax.toFixed(2)}`,
          qtd: produtosPorPreco?.length || 0,
          produtos: produtosPorPreco?.slice(0, 5),
        },
        estrategia_3_genericos: {
          qtd: produtosGenericos?.length || 0,
          produtos: produtosGenericos?.slice(0, 5),
        },
      },
      api_real: {
        status: apiResponse.status,
        ok: apiResponse.ok,
        data: apiData,
      },
    });

  } catch (error) {
    console.error('❌ [TEST] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: String(error) },
      { status: 500 }
    );
  }
}
