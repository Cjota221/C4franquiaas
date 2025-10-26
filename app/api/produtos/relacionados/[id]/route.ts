import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: produtoId } = await context.params;

    // 1. Buscar informações do produto atual
    const { data: produtoAtual, error: erroProduto } = await supabase
      .from('produtos')
      .select('id, nome, categoria_id, preco, cores')
      .eq('id', produtoId)
      .single();

    if (erroProduto || !produtoAtual) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    // 2. Buscar produtos relacionados
    // Prioridade:
    // - Mesma categoria (peso maior)
    // - Cores similares
    // - Faixa de preço próxima (+/- 30%)
    const precoMin = produtoAtual.preco * 0.7;
    const precoMax = produtoAtual.preco * 1.3;

    const { data: produtosRelacionados, error: erroRelacionados } = await supabase
      .from('produtos')
      .select(`
        id,
        nome,
        preco,
        categoria_id,
        cores,
        imagens,
        slug
      `)
      .neq('id', produtoId) // Não incluir o próprio produto
      .eq('ativo', true) // Apenas produtos ativos
      .or(`categoria_id.eq.${produtoAtual.categoria_id},preco.gte.${precoMin},preco.lte.${precoMax}`)
      .limit(12); // Buscar 12 produtos para ter opções

    if (erroRelacionados) {
      console.error('[API Relacionados] Erro ao buscar:', erroRelacionados);
      return NextResponse.json(
        { error: 'Erro ao buscar produtos relacionados' },
        { status: 500 }
      );
    }

    // 3. Calcular score de relevância para cada produto
    const produtosComScore = (produtosRelacionados || []).map((produto) => {
      let score = 0;

      // Mesma categoria: +10 pontos
      if (produto.categoria_id === produtoAtual.categoria_id) {
        score += 10;
      }

      // Preço similar: +5 pontos se estiver na faixa
      if (produto.preco >= precoMin && produto.preco <= precoMax) {
        score += 5;
      }

      // Cores em comum: +3 pontos por cor
      if (produtoAtual.cores && produto.cores) {
        const coresAtual = Array.isArray(produtoAtual.cores) 
          ? produtoAtual.cores 
          : [];
        const coresProduto = Array.isArray(produto.cores) 
          ? produto.cores 
          : [];
        
        const coresEmComum = coresAtual.filter((cor: string) => 
          coresProduto.includes(cor)
        );
        score += coresEmComum.length * 3;
      }

      return {
        ...produto,
        score,
      };
    });

    // 4. Ordenar por score (maior primeiro) e pegar os top 6
    const topProdutos = produtosComScore
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { score, ...produto } = item;
        return produto;
      });

    return NextResponse.json({
      produtos: topProdutos,
      total: topProdutos.length,
    });

  } catch (error) {
    console.error('[API Relacionados] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
