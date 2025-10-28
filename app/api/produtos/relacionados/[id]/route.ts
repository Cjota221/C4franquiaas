import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Extrai palavras-chave do nome do produto
 * Remove cores comuns, tamanhos e palavras irrelevantes
 */
function extrairPalavrasChave(nome: string): string[] {
  // Normalizar: minúsculas e remover acentos
  const normalizado = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  // Lista de palavras a ignorar (stopwords + cores + tamanhos)
  const stopwords = [
    'com', 'de', 'da', 'do', 'e', 'para', 'em', 'o', 'a', 'os', 'as',
    // Cores comuns
    'preto', 'preta', 'branco', 'branca', 'azul', 'vermelho', 'vermelha',
    'verde', 'amarelo', 'amarela', 'rosa', 'roxo', 'roxa', 'laranja',
    'marrom', 'cinza', 'bege', 'cafe', 'prata', 'dourado', 'dourada',
    'colorido', 'colorida', 'estampado', 'estampada',
    // Tamanhos
    'pp', 'p', 'm', 'g', 'gg', 'xgg', 'pequeno', 'medio', 'grande',
    // Qualificadores
    'com', 'sem', 'strass', 'bordado', 'bordada', 'liso', 'lisa'
  ];
  
  // Separar palavras
  const palavras = normalizado
    .split(/[\s\-_,]+/)
    .filter(p => p.length >= 3) // Mínimo 3 caracteres
    .filter(p => !stopwords.includes(p))
    .filter(p => !/^\d+$/.test(p)); // Remover números puros
  
  return [...new Set(palavras)]; // Remover duplicatas
}

/**
 * Calcula score de similaridade entre dois arrays de palavras
 */
function calcularSimilaridade(palavras1: string[], palavras2: string[]): number {
  const set1 = new Set(palavras1);
  const set2 = new Set(palavras2);
  
  // Interseção: palavras em comum
  const intersecao = [...set1].filter(p => set2.has(p));
  
  // Score = palavras em comum / total de palavras únicas
  const uniao = new Set([...palavras1, ...palavras2]);
  return intersecao.length / uniao.size;
}

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
      .select('id, nome, preco_base, ativo')
      .eq('id', produtoId)
      .single();

    if (erroProduto || !produtoAtual) {
      console.warn('⚠️ [API Relacionados] Produto não encontrado:', produtoId);
      console.warn('⚠️ [API Relacionados] Erro:', erroProduto?.message);
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

    // ⭐ NOVA ESTRATÉGIA: Busca por similaridade de nome
    console.log('🔍 [API Relacionados] Extraindo palavras-chave do nome...');
    const palavrasChaveProdutoAtual = extrairPalavrasChave(produtoAtual.nome || '');
    console.log('🏷️ [API Relacionados] Palavras-chave:', palavrasChaveProdutoAtual);

    // Se não conseguiu extrair palavras-chave, retornar vazio
    if (palavrasChaveProdutoAtual.length === 0) {
      console.warn('⚠️ [API Relacionados] Nenhuma palavra-chave encontrada no nome');
      return NextResponse.json({
        produtos: [],
        total: 0,
        mensagem: 'Nome do produto muito curto ou sem palavras-chave',
      });
    }

    // 1. Buscar TODOS os produtos ativos (exceto o atual)
    console.log('🎯 [API Relacionados] Buscando todos os produtos ativos...');
    const { data: todosProdutos, error: erroBusca } = await supabase
      .from('produtos')
      .select('id, nome, preco_base, imagens, ativo')
      .neq('id', produtoId)
      .eq('ativo', true);

    if (erroBusca) {
      console.error('❌ [API Relacionados] Erro ao buscar produtos:', erroBusca);
      return NextResponse.json(
        { error: 'Erro ao buscar produtos' },
        { status: 500 }
      );
    }

    if (!todosProdutos || todosProdutos.length === 0) {
      console.warn('⚠️ [API Relacionados] Nenhum produto ativo encontrado');
      return NextResponse.json({
        produtos: [],
        total: 0,
        mensagem: 'Nenhum produto ativo disponível',
      });
    }

    console.log(`📊 [API Relacionados] ${todosProdutos.length} produtos ativos encontrados`);

    // 2. Calcular score de similaridade para cada produto
    type ProdutoComScore = {
      id: string;
      nome: string;
      preco_base: number;
      imagens: string[];
      score: number;
      palavrasComuns: string[];
    };

    const produtosComScore: ProdutoComScore[] = todosProdutos.map(produto => {
      const palavrasProduto = extrairPalavrasChave(produto.nome || '');
      const score = calcularSimilaridade(palavrasChaveProdutoAtual, palavrasProduto);
      
      // Palavras em comum
      const palavrasComuns = palavrasChaveProdutoAtual.filter(p => 
        palavrasProduto.includes(p)
      );

      return {
        id: produto.id,
        nome: produto.nome || '',
        preco_base: produto.preco_base || 0,
        imagens: produto.imagens || [],
        score,
        palavrasComuns,
      };
    });

    // 3. Filtrar produtos com similaridade > 0 (pelo menos 1 palavra em comum)
    const produtosSimilares = produtosComScore.filter(p => p.score > 0);

    console.log(`✅ [API Relacionados] ${produtosSimilares.length} produtos com palavras em comum`);

    // 4. Ordenar por score (mais similar primeiro)
    const produtosOrdenados = produtosSimilares.sort((a, b) => b.score - a.score);

    // 5. Limitar a 20 produtos
    const produtosRelacionados = produtosOrdenados.slice(0, 20);

    // Log dos top 5 para debug
    console.log('🏆 [API Relacionados] Top 5 produtos mais similares:');
    produtosRelacionados.slice(0, 5).forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.nome}`);
      console.log(`     Score: ${(p.score * 100).toFixed(1)}% | Palavras comuns: ${p.palavrasComuns.join(', ')}`);
    });

    // FALLBACK: Se não encontrou nenhum similar, buscar produtos aleatórios
    let produtosFinais = produtosRelacionados;

    if (produtosFinais.length === 0) {
      console.log('⚠️ [API Relacionados] Nenhum produto similar, buscando produtos aleatórios...');
      const produtosAleatorios = produtosComScore
        .sort(() => Math.random() - 0.5) // Embaralhar
        .slice(0, 20);
      
      produtosFinais = produtosAleatorios.map(p => ({
        ...p,
        score: 0,
        palavrasComuns: [],
      }));
      console.log(`✅ [API Relacionados] ${produtosFinais.length} produtos aleatórios selecionados`);
    }

    // Remover campos internos antes de retornar
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const produtosResposta = produtosFinais.map(({ score, palavrasComuns, ...produto }) => ({
      ...produto,
      preco: produto.preco_base, // Compatibilidade com frontend
    }));

    console.log(`✅ [API Relacionados] Retornando ${produtosResposta.length} produtos\n`);

    return NextResponse.json({
      produtos: produtosResposta,
      total: produtosResposta.length,
    });

  } catch (error) {
    console.error('[API Relacionados] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
