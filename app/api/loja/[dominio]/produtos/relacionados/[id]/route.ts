import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

/**
 * 🔍 API de Produtos Relacionados por Dom Public
 * Busca produtos similares da MESMA FRANQUEADA com pre\u00e7os personalizados
 * Usa algoritmo de similaridade de nome (Índice de Jaccard)
 */

// Fun\u00e7\u00e3o para extrair palavras-chave de um nome de produto
function extrairPalavrasChave(nome: string): string[] {
  const stopwords = [
    // Cores
    'preto', 'branco', 'azul', 'vermelho', 'verde', 'amarelo', 'rosa', 'roxo',
    'marrom', 'cinza', 'laranja', 'bege', 'cafe', 'prata', 'dourado', 'ouro',
    'bronze', 'colorido', 'nude', 'pink', 'prateado', 'holografico',
    // Tamanhos
    'pp', 'p', 'm', 'g', 'gg', 'xgg',
    // Conectivos e artigos
    'com', 'de', 'da', 'do', 'e', 'para', 'em', 'no', 'na', 'a', 'o',
    // Qualificadores comuns
    'strass', 'bordado', 'liso', 'estampado', 'basico', 'simples',
  ];

  const normalizado = nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos

  const palavras = normalizado
    .split(/[\s\-_,]+/)
    .filter(p => p.length >= 3)
    .filter(p => !stopwords.includes(p))
    .filter(p => !/^\d+$/.test(p)); // Remove números puros

  return [...new Set(palavras)]; // Remove duplicadas
}

// Calcula similaridade usando Índice de Jaccard
function calcularSimilaridade(palavras1: string[], palavras2: string[]): number {
  const set1 = new Set(palavras1);
  const set2 = new Set(palavras2);

  const intersecao = [...set1].filter(p => set2.has(p));
  const uniao = new Set([...palavras1, ...palavras2]);

  return intersecao.length / uniao.size;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dominio: string; id: string }> }
) {
  try {
    const { dominio, id: produtoId } = await params;

    console.log(`\n🔍 [API Relacionados Loja] Iniciando busca para produto: ${produtoId} no dominio: ${dominio}`);

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1️⃣ Buscar loja pelo domínio
    const { data: loja, error: lojaError } = await supabase
      .from('lojas')
      .select('id, franqueada_id, nome')
      .eq('dominio', dominio)
      .eq('ativo', true)
      .single();

    if (lojaError || !loja) {
      console.error('[API Relacionados Loja] Loja não encontrada:', lojaError);
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    console.log(`✅ [API Relacionados Loja] Loja encontrada: ${loja.nome} (franqueada_id: ${loja.franqueada_id})`);

    // 2️⃣ Buscar produto atual (para obter nome)
    const { data: produtoAtualVinculo, error: erroProdutoAtual } = await supabase
      .from('produtos_franqueadas')
      .select(`
        id,
        produto_id,
        produtos:produto_id (
          id,
          nome,
          ativo
        )
      `)
      .eq('franqueada_id', loja.franqueada_id)
      .eq('produto_id', produtoId)
      .eq('ativo', true)
      .single();

    if (erroProdutoAtual || !produtoAtualVinculo) {
      console.warn('⚠️ [API Relacionados Loja] Produto não encontrado:', erroProdutoAtual?.message);
      return NextResponse.json({ produtos: [], total: 0 }, { status: 200 });
    }

    const produtoAtual = Array.isArray(produtoAtualVinculo.produtos) 
      ? produtoAtualVinculo.produtos[0] 
      : produtoAtualVinculo.produtos;

    if (!produtoAtual || !produtoAtual.ativo) {
      console.warn('⚠️ [API Relacionados Loja] Produto inativo ou inválido');
      return NextResponse.json({ produtos: [], total: 0 }, { status: 200 });
    }

    console.log(`📦 [API Relacionados Loja] Produto atual: "${produtoAtual.nome}"`);

    // 3️⃣ Extrair palavras-chave do produto atual
    const palavrasChaveProdutoAtual = extrairPalavrasChave(produtoAtual.nome);
    console.log(`🏷️ [API Relacionados Loja] Palavras-chave: [${palavrasChaveProdutoAtual.join(', ')}]`);

    // 4️⃣ Buscar TODOS os produtos ativos da franqueada
    const { data: vinculacoes, error: erroProdutos } = await supabase
      .from('produtos_franqueadas')
      .select(`
        id,
        produto_id,
        produtos:produto_id (
          id,
          nome,
          preco_base,
          imagens,
          ativo
        )
      `)
      .eq('franqueada_id', loja.franqueada_id)
      .neq('produto_id', produtoId) // Excluir produto atual
      .eq('ativo', true);

    if (erroProdutos) {
      console.error('[API Relacionados Loja] Erro ao buscar produtos:', erroProdutos);
      return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
    }

    if (!vinculacoes || vinculacoes.length === 0) {
      console.log('⚠️ [API Relacionados Loja] Nenhum outro produto disponível');
      return NextResponse.json({ produtos: [], total: 0 }, { status: 200 });
    }

    console.log(`🎯 [API Relacionados Loja] ${vinculacoes.length} produtos candidatos encontrados`);

    // 5️⃣ Buscar preços personalizados
    const vinculacaoIds = vinculacoes.map(v => v.id);
    const { data: precos } = await supabase
      .from('produtos_franqueadas_precos')
      .select('*')
      .in('produto_franqueada_id', vinculacaoIds)
      .eq('ativo_no_site', true); // Apenas produtos ativos no site da franqueada

    console.log(`💰 [API Relacionados Loja] ${precos?.length || 0} produtos com preços ativos`);

    // 6️⃣ Processar imagens (mesma lógica da API principal)
    const isDev = process.env.NODE_ENV === 'development';
    const baseUrl = isDev ? '' : 'https://c4franquiaas.netlify.app';

    const processarImagem = (url: string | null): string | null => {
      if (!url) return null;

      // Se já tiver proxy completo, retornar
      if (url.includes('/.netlify/functions/proxy-facilzap-image')) {
        return url;
      }

      // Se tiver parâmetros duplicados, extrair URL limpa
      if (url.includes('proxy-facilzap-image?') && url.includes('url=')) {
        const urlMatch = url.match(/[?&]url=([^&]+)/);
        if (urlMatch) {
          const decoded = decodeURIComponent(urlMatch[1]);
          if (isDev) return decoded;
          return `${baseUrl}/.netlify/functions/proxy-facilzap-image?url=${encodeURIComponent(decoded)}`;
        }
      }

      // Se for proxy antigo, extrair
      if (url.includes('proxy-facilzap-image?')) {
        const match = url.match(/[?&](url|facilzap)=([^&]+)/);
        if (match) {
          const decoded = decodeURIComponent(match[2]);
          if (isDev) return decoded;
          return `${baseUrl}/.netlify/functions/proxy-facilzap-image?url=${encodeURIComponent(decoded)}`;
        }
      }

      // Se for URL Facilzap direta
      if (url.includes('facilzap.app.br')) {
        if (isDev) return url;
        return `${baseUrl}/.netlify/functions/proxy-facilzap-image?url=${encodeURIComponent(url)}`;
      }

      // Outras URLs (Supabase, etc)
      if (url.startsWith('http')) return url;

      return null;
    };

    // 7️⃣ Calcular score de similaridade
    type ProdutoComScore = {
      id: string;
      nome: string;
      preco_final: number;
      imagens: string[];
      score: number;
      palavrasComuns: string[];
    };

    const produtosComScore: ProdutoComScore[] = vinculacoes
      .map(v => {
        const produto = Array.isArray(v.produtos) ? v.produtos[0] : v.produtos;
        if (!produto || !produto.ativo) return null;

        const preco = precos?.find(p => p.produto_franqueada_id === v.id);
        
        // Apenas produtos com preço ativo
        if (!preco || !preco.ativo_no_site) return null;

        const precoFinal = preco.preco_final || produto.preco_base;

        // Processar imagens
        let imagensProcessadas: string[] = [];
        if (produto.imagens && Array.isArray(produto.imagens)) {
          imagensProcessadas = produto.imagens
            .map(img => processarImagem(img))
            .filter((img): img is string => img !== null);
        }

        // Calcular similaridade
        const palavrasProduto = extrairPalavrasChave(produto.nome);
        const score = calcularSimilaridade(palavrasChaveProdutoAtual, palavrasProduto);
        const palavrasComuns = palavrasChaveProdutoAtual.filter(p => palavrasProduto.includes(p));

        return {
          id: String(produto.id),
          nome: produto.nome,
          preco_final: precoFinal,
          imagens: imagensProcessadas,
          score,
          palavrasComuns,
        };
      })
      .filter((p): p is ProdutoComScore => p !== null);

    console.log(`📊 [API Relacionados Loja] ${produtosComScore.length} produtos processados com scores`);

    // 8️⃣ Filtrar, ordenar e limitar
    const produtosSimilares = produtosComScore.filter(p => p.score > 0);
    const produtosOrdenados = produtosSimilares.sort((a, b) => b.score - a.score);
    const produtosRelacionados = produtosOrdenados.slice(0, 20);

    console.log(`✅ [API Relacionados Loja] ${produtosRelacionados.length} produtos similares encontrados`);

    if (produtosRelacionados.length > 0) {
      console.log('🏆 Top 5 produtos mais similares:');
      produtosRelacionados.slice(0, 5).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.nome}`);
        console.log(`     Score: ${(p.score * 100).toFixed(1)}% | R$ ${p.preco_final.toFixed(2)} | Palavras: ${p.palavrasComuns.join(', ')}`);
      });
    }

    // 9️⃣ Fallback: produtos aleatórios se não encontrou similares
    let produtosFinais = produtosRelacionados;

    if (produtosFinais.length === 0) {
      console.log('⚠️ [API Relacionados Loja] Nenhum similar, buscando aleatórios...');
      produtosFinais = produtosComScore
        .sort(() => Math.random() - 0.5)
        .slice(0, 20);
      console.log(`✅ [API Relacionados Loja] ${produtosFinais.length} produtos aleatórios selecionados`);
    }

    // 🔟 Formatar resposta
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const produtosResposta = produtosFinais.map(({ score, palavrasComuns, ...produto }) => ({
      ...produto,
      preco: produto.preco_final, // Compatibilidade com frontend
    }));

    console.log(`✅ [API Relacionados Loja] Retornando ${produtosResposta.length} produtos\n`);

    return NextResponse.json({
      produtos: produtosResposta,
      total: produtosResposta.length,
    });

  } catch (error) {
    console.error('[API Relacionados Loja] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
