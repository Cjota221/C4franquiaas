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

    // 1. Buscar categoria do produto atual através da tabela produto_categorias
    const { data: categoriaAtual, error: erroCategoriaAtual } = await supabase
      .from('produto_categorias')
      .select('categoria_id')
      .eq('produto_id', produtoId)
      .single();

    if (erroCategoriaAtual) {
      console.warn('[API Relacionados] Produto sem categoria:', produtoId);
    }

    // 2. Buscar informações do produto atual
    const { data: produtoAtual, error: erroProduto } = await supabase
      .from('produtos')
      .select('id, nome, preco_base, cores')
      .eq('id', produtoId)
      .single();

    if (erroProduto || !produtoAtual) {
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    const categoriaIdAtual = categoriaAtual?.categoria_id || null;
    const precoMin = produtoAtual.preco_base * 0.7;
    const precoMax = produtoAtual.preco_base * 1.3;

    // 3. Buscar produtos relacionados (busca ampla baseada em preço)
    const { data: produtosRelacionados, error: erroRelacionados } = await supabase
      .from('produtos')
      .select(`
        id,
        nome,
        preco_base,
        cores,
        imagens,
        slug
      `)
      .neq('id', produtoId) // Não incluir o próprio produto
      .eq('ativo', true) // Apenas produtos ativos
      .gte('preco_base', precoMin * 0.5) // Busca mais ampla
      .lte('preco_base', precoMax * 1.5)
      .limit(20); // Buscar mais produtos para ter opções

    if (erroRelacionados) {
      console.error('[API Relacionados] Erro ao buscar:', erroRelacionados);
      return NextResponse.json(
        { error: 'Erro ao buscar produtos relacionados' },
        { status: 500 }
      );
    }

    // 4. Buscar categorias dos produtos relacionados
    const produtoIds = (produtosRelacionados || []).map(p => p.id);
    const { data: produtoCategorias } = await supabase
      .from('produto_categorias')
      .select('produto_id, categoria_id')
      .in('produto_id', produtoIds);

    // Criar mapa de produto_id -> categoria_id
    const categoriasMap = new Map<string, string>();
    produtoCategorias?.forEach(pc => {
      if (!categoriasMap.has(pc.produto_id)) {
        categoriasMap.set(pc.produto_id, pc.categoria_id);
      }
    });

    // 5. Calcular score de relevância para cada produto
    const produtosComScore = (produtosRelacionados || []).map((produto) => {
      let score = 0;

      // Mesma categoria: +10 pontos
      const categoriaProduto = categoriasMap.get(produto.id);
      if (categoriaProduto && categoriaProduto === categoriaIdAtual) {
        score += 10;
      }

      // Preço similar: +5 pontos
      if (produto.preco_base >= precoMin && produto.preco_base <= precoMax) {
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

    // 6. Ordenar por score e pegar top 6, incluindo categoria_id do Map
    const topProdutos = produtosComScore
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { score, ...produto } = item;
        return {
          ...produto,
          preco: produto.preco_base, // Compatibilidade com frontend
          categoria_id: categoriasMap.get(produto.id) || null,
        };
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
