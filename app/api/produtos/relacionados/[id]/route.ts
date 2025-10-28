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
    console.log('\n🔍 [API Relacionados] Iniciando busca para produto:', produtoId);

    // 1. Buscar categoria do produto atual através da tabela produto_categorias
    const { data: categoriaAtual, error: erroCategoriaAtual } = await supabase
      .from('produto_categorias')
      .select('categoria_id')
      .eq('produto_id', produtoId)
      .single();

    console.log('📂 [API Relacionados] Categoria do produto:', categoriaAtual);
    if (erroCategoriaAtual) {
      console.warn('⚠️ [API Relacionados] Produto sem categoria:', produtoId, erroCategoriaAtual.message);
    }

    // 2. Buscar informações do produto atual
    const { data: produtoAtual, error: erroProduto } = await supabase
      .from('produtos')
      .select('id, nome, preco_base, cores, ativo')
      .eq('id', produtoId)
      .single();

    if (erroProduto || !produtoAtual) {
      console.warn('⚠️ [API Relacionados] Produto não encontrado:', produtoId);
      // Retornar lista vazia ao invés de 404
      return NextResponse.json({
        produtos: [],
        total: 0,
        mensagem: 'Produto não encontrado',
      });
    }

    if (!produtoAtual.ativo) {
      console.warn('⚠️ [API Relacionados] Produto inativo:', produtoId);
      // Retornar lista vazia para produtos inativos
      return NextResponse.json({
        produtos: [],
        total: 0,
        mensagem: 'Produto inativo',
      });
    }

    console.log('📦 [API Relacionados] Produto atual:', {
      id: produtoAtual.id,
      nome: produtoAtual.nome,
      preco_base: produtoAtual.preco_base,
      ativo: produtoAtual.ativo,
    });

    const categoriaIdAtual = categoriaAtual?.categoria_id || null;
    
    // Se não tiver preço_base, usar valor padrão para não quebrar
    const precoBase = produtoAtual.preco_base || 100;
    const precoMin = precoBase * 0.7 * 0.5;
    const precoMax = precoBase * 1.3 * 1.5;

    console.log('💰 [API Relacionados] Faixa de preço:', { 
      precoBase, 
      precoMin: precoMin.toFixed(2), 
      precoMax: precoMax.toFixed(2) 
    });

    // 3. Buscar produtos relacionados com estratégia em cascata
    let produtosRelacionados: Array<{
      id: string;
      nome: string;
      preco_base: number;
      cores: string[];
      imagens: string[];
      slug: string;
    }> = [];
    
    // ESTRATÉGIA 1: Mesma categoria (mais relevante)
    if (categoriaIdAtual) {
      console.log('🎯 [API Relacionados] Tentando buscar produtos da mesma categoria:', categoriaIdAtual);
      
      const { data: vinculacoesMesmaCategoria } = await supabase
        .from('produto_categorias')
        .select('produto_id')
        .eq('categoria_id', categoriaIdAtual)
        .neq('produto_id', produtoId)
        .limit(20);

      if (vinculacoesMesmaCategoria && vinculacoesMesmaCategoria.length > 0) {
        const produtoIds = vinculacoesMesmaCategoria.map(v => v.produto_id);
        
        const { data: produtosMesmaCategoria } = await supabase
          .from('produtos')
          .select('id, nome, preco_base, cores, imagens, slug')
          .in('id', produtoIds)
          .eq('ativo', true)
          .limit(20);
        
        if (produtosMesmaCategoria && produtosMesmaCategoria.length > 0) {
          produtosRelacionados = produtosMesmaCategoria;
          console.log(`✅ [API Relacionados] Encontrados ${produtosRelacionados.length} produtos da mesma categoria`);
        }
      }
    }
    
    // ESTRATÉGIA 2: Se não achou pela categoria, buscar por faixa de preço
    if (produtosRelacionados.length === 0 && precoBase > 0) {
      console.log('🎯 [API Relacionados] Tentando buscar produtos por faixa de preço...');
      
      const { data: produtosPorPreco } = await supabase
        .from('produtos')
        .select('id, nome, preco_base, cores, imagens, slug')
        .neq('id', produtoId)
        .eq('ativo', true)
        .gte('preco_base', precoMin)
        .lte('preco_base', precoMax)
        .limit(20);
      
      if (produtosPorPreco && produtosPorPreco.length > 0) {
        produtosRelacionados = produtosPorPreco;
        console.log(`✅ [API Relacionados] Encontrados ${produtosRelacionados.length} produtos por faixa de preço`);
      }
    }
    
    // ESTRATÉGIA 3: Se ainda não achou, buscar qualquer produto ativo (fallback)
    if (produtosRelacionados.length === 0) {
      console.log('🎯 [API Relacionados] Buscando qualquer produto ativo (fallback)...');
      
      const { data: produtosGenericos, error: erroRelacionados } = await supabase
        .from('produtos')
        .select('id, nome, preco_base, cores, imagens, slug')
        .neq('id', produtoId)
        .eq('ativo', true)
        .limit(20);

      if (erroRelacionados) {
        console.error('❌ [API Relacionados] Erro ao buscar:', erroRelacionados);
        return NextResponse.json(
          { error: 'Erro ao buscar produtos relacionados' },
          { status: 500 }
        );
      }
      
      if (produtosGenericos && produtosGenericos.length > 0) {
        produtosRelacionados = produtosGenericos;
        console.log(`✅ [API Relacionados] Encontrados ${produtosRelacionados.length} produtos genéricos`);
      }
    }

    console.log(`📦 [API Relacionados] Total de produtos para processar: ${produtosRelacionados?.length || 0}`);

    // 4. Buscar categorias dos produtos relacionados
    const produtoIds = (produtosRelacionados || []).map(p => p.id);
    const { data: produtoCategorias } = await supabase
      .from('produto_categorias')
      .select('produto_id, categoria_id')
      .in('produto_id', produtoIds);

    console.log(`🏷️ [API Relacionados] Categorias encontradas: ${produtoCategorias?.length || 0}`);

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

    console.log('🎯 [API Relacionados] Top produtos por score:');
    produtosComScore.slice(0, 6).forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.nome} - Score: ${p.score} (Categoria: ${categoriasMap.get(p.id) || 'N/A'})`);
    });
    console.log(`✅ [API Relacionados] Retornando ${topProdutos.length} produtos\n`);

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
