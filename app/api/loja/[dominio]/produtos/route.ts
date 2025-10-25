import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dominio: string }> }
) {
  try {
    const { dominio } = await params;
    
    // Parâmetros de busca e filtros
    const searchParams = req.nextUrl.searchParams;
    const produtoId = searchParams.get('id'); // Para buscar produto específico
    const q = searchParams.get('q') || '';
    const categoriaId = searchParams.get('categoriaId');
    const destaques = searchParams.get('destaques') === 'true';

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('[API loja/produtos] Variáveis de ambiente ausentes');
      return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    console.log(`[API loja/produtos] Buscando loja com dominio: ${dominio}`, { q, categoriaId, destaques });

    // Buscar loja
    const { data: loja, error: lojaError } = await supabase
      .from('lojas')
      .select('id, franqueada_id, nome')
      .eq('dominio', dominio)
      .eq('ativo', true)
      .single();

    if (lojaError || !loja) {
      console.error('[API loja/produtos] Loja não encontrada ou inativa:', lojaError);
      return NextResponse.json({ 
        error: 'Loja não encontrada ou inativa',
        details: lojaError?.message
      }, { status: 404 });
    }

    console.log(`[API loja/produtos] Loja encontrada: ${loja.nome} (ID: ${loja.id})`);

    // Construir query base
    let query = supabase
      .from('produtos_franqueadas')
      .select(`
        id,
        produto_id,
        produtos:produto_id (
          id,
          nome,
          descricao,
          preco_base,
          estoque,
          imagem,
          imagens,
          codigo_barras,
          categoria_id,
          variacoes_meta,
          ativo
        )
      `)
      .eq('franqueada_id', loja.franqueada_id)
      .eq('ativo', true);

    // Se buscar produto específico por ID
    if (produtoId) {
      console.log(`[API loja/produtos] Buscando produto específico: ${produtoId}`);
      query = query.eq('produto_id', produtoId);
    }

    const { data: vinculacoes, error: vinculacoesError } = await query;

    if (vinculacoesError) {
      console.error('[API loja/produtos] Erro ao buscar vinculações:', vinculacoesError);
      return NextResponse.json({ 
        error: 'Erro ao buscar produtos vinculados',
        details: vinculacoesError.message 
      }, { status: 500 });
    }

    if (!vinculacoes || vinculacoes.length === 0) {
      console.log('[API loja/produtos] Nenhum produto vinculado encontrado');
      return NextResponse.json({ produtos: [] }, { status: 200 });
    }

    // Buscar preços personalizados
    const vinculacaoIds = vinculacoes.map(v => v.id);
    const { data: precos, error: precosError } = await supabase
      .from('produtos_franqueadas_precos')
      .select('*')
      .in('produto_franqueada_id', vinculacaoIds);

    if (precosError) {
      console.error('[API loja/produtos] Erro ao buscar preços (não fatal):', precosError);
    }

    // Combinar dados
    const produtos = vinculacoes
      .map(v => {
        const produto = Array.isArray(v.produtos) ? v.produtos[0] : v.produtos;
        if (!produto) return null;

        const preco = precos?.find(p => p.produto_franqueada_id === v.id);
        
        // ✅ CORREÇÃO: Usar preco_base como fallback
        const precoFinal = preco?.preco_final || produto.preco_base;

        // 🔧 FIX: Sempre usar proxy em produção para evitar erro 403
        const isDev = process.env.NODE_ENV === 'development';
        const baseUrl = isDev ? '' : 'https://c4franquiaas.netlify.app';
        
        const processarImagem = (url: string | null) => {
          if (!url) return null;
          
          console.log('[processarImagem] INPUT:', url);
          
          // Se for URL com proxy existente, extrair URL real
          if (url.includes('proxy-facilzap-image?url=')) {
            try {
              // Extrair a URL real do parâmetro
              const match = url.match(/[?&]url=([^&]+)/);
              if (match) {
                const decoded = decodeURIComponent(match[1]);
                console.log('[processarImagem] Extraído do proxy:', decoded);
                // Em desenvolvimento, usar URL real
                if (isDev) {
                  console.log('[processarImagem] DEV - retornando URL real');
                  return decoded;
                }
                // Em produção, recriar URL do proxy Netlify (ABSOLUTA)
                const proxyUrl = `${baseUrl}/.netlify/functions/proxy-facilzap-image?url=${encodeURIComponent(decoded)}`;
                console.log('[processarImagem] PROD - proxy:', proxyUrl);
                return proxyUrl;
              }
            } catch (e) {
              console.error('[processarImagem] Erro ao processar URL proxy:', url, e);
            }
          }
          
          // Se for URL do Facilzap SEM proxy
          if (url.includes('arquivos.facilzap.app.br') || url.includes('facilzap.app.br')) {
            console.log('[processarImagem] URL Facilzap detectada');
            if (isDev) {
              console.log('[processarImagem] DEV - retornando URL direta');
              return url;
            } else {
              const proxyUrl = `${baseUrl}/.netlify/functions/proxy-facilzap-image?url=${encodeURIComponent(url)}`;
              console.log('[processarImagem] PROD - criando proxy:', proxyUrl);
              return proxyUrl;
            }
          }
          
          // Se for outra URL completa (Supabase, etc), retornar direto
          if (url.startsWith('http')) {
            console.log('[processarImagem] URL externa (não Facilzap):', url);
            return url;
          }
          
          console.warn('[processarImagem] URL inválida ou vazia:', url);
          return null;
        };

        console.log(`[API loja/produtos] Produto: ${produto.nome}`);
        console.log(`[API loja/produtos]   - imagem principal:`, produto.imagem);
        console.log(`[API loja/produtos]   - imagens array:`, produto.imagens);
        console.log(`[API loja/produtos]   - variacoes_meta:`, produto.variacoes_meta);

        // ⭐⭐⭐ CORREÇÃO CRÍTICA: PROCESSAR VARIAÇÕES COM ESTOQUE REAL ⭐⭐⭐
        let variacoes = [];
        let estoqueTotal = 0;
        
        if (produto.variacoes_meta && Array.isArray(produto.variacoes_meta) && produto.variacoes_meta.length > 0) {
          console.log(`[API loja/produtos] ✅ Produto ${produto.nome} TEM ${produto.variacoes_meta.length} variações`);
          
          // Processar cada variação com estoque REAL
          variacoes = produto.variacoes_meta.map((variacao: { sku?: string; nome?: string; estoque?: number; codigo_barras?: string }, idx: number) => {
            const estoqueVariacao = typeof variacao.estoque === 'number' ? variacao.estoque : 0;
            const disponivel = estoqueVariacao > 0;
            
            // Somar estoque total
            estoqueTotal += estoqueVariacao;
            
            console.log(`[API loja/produtos]   Variação ${idx + 1}:`, {
              sku: variacao.sku,
              tamanho: variacao.nome || variacao.sku?.split('-').pop() || `Variação ${idx + 1}`,
              estoque: estoqueVariacao,
              disponivel
            });
            
            return {
              sku: variacao.sku || `SKU-${produto.id}-${idx}`,
              tamanho: variacao.nome || variacao.sku?.split('-').pop() || `Variação ${idx + 1}`,
              estoque: estoqueVariacao,
              disponivel,
              codigo_barras: variacao.codigo_barras || null
            };
          });
          
          console.log(`[API loja/produtos] ✅ Estoque total calculado: ${estoqueTotal}`);
        } else {
          // Produto sem variações - usar estoque direto
          estoqueTotal = produto.estoque || 0;
          console.log(`[API loja/produtos] ⚠️ Produto ${produto.nome} SEM variações, usando estoque direto: ${estoqueTotal}`);
        }

        // Calcular tag e parcelamento
        const precoVenda = precoFinal;
        const temDesconto = precoFinal < produto.preco_base;
        let tag = null;
        
        if (temDesconto) {
          const desconto = Math.round(((produto.preco_base - precoFinal) / produto.preco_base) * 100);
          tag = `-${desconto}%`;
        }

        const parcelamento = {
          parcelas: 12,
          valor: precoVenda / 12,
          total: precoVenda
        };

        return {
          id: produto.id,
          nome: produto.nome,
          descricao: produto.descricao || '', // ✅ Fallback para descrição
          preco_base: produto.preco_base || 0,
          preco_venda: precoVenda !== produto.preco_base ? precoVenda : undefined,
          preco_final: precoFinal,
          ajuste_tipo: preco?.ajuste_tipo || null,
          ajuste_valor: preco?.ajuste_valor || null,
          estoque: estoqueTotal, // ⭐ ESTOQUE TOTAL CALCULADO
          imagem: processarImagem(produto.imagem),
          imagens: (() => {
            // Processar array de imagens de forma robusta
            if (!produto.imagens || !Array.isArray(produto.imagens)) {
              console.log(`[API loja/produtos]   ⚠️ Produto ${produto.nome}: imagens não é array, usando imagem principal`);
              const imgPrincipal = processarImagem(produto.imagem);
              return imgPrincipal ? [imgPrincipal] : [];
            }
            
            console.log(`[API loja/produtos]   ✓ Produto ${produto.nome}: processando ${produto.imagens.length} imagens`);
            
            const imagensProcessadas = produto.imagens
              .map((img, idx) => {
                const processed = processarImagem(img);
                if (!processed) {
                  console.log(`[API loja/produtos]     - Imagem ${idx} inválida:`, img);
                } else {
                  console.log(`[API loja/produtos]     - Imagem ${idx} OK:`, processed.substring(0, 50) + '...');
                }
                return processed;
              })
              .filter((img): img is string => Boolean(img) && img.trim().length > 0);
            
            console.log(`[API loja/produtos]   → ${imagensProcessadas.length} imagens válidas após processamento`);
            return imagensProcessadas;
          })(),
          codigo_barras: produto.codigo_barras || null,
          categoria_id: produto.categoria_id || null,
          variacoes, // ⭐ VARIAÇÕES COM ESTOQUE REAL
          destaque: false,
          tag,
          parcelamento
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      // Aplicar filtros após mapear os dados
      .filter(p => {
        // Filtro de busca
        if (q && !p.nome.toLowerCase().includes(q.toLowerCase())) {
          return false;
        }
        // Filtro de categoria
        if (categoriaId && p.categoria_id !== categoriaId) {
          return false;
        }
        // Remover filtro de destaques pois não existe a coluna
        return true;
      });

    console.log(`[API loja/produtos] Produtos finais retornados: ${produtos.length}`);

    return NextResponse.json({ 
      produtos,
      meta: {
        total: produtos.length,
        loja: loja.nome,
        dominio
      }
    }, { status: 200 });

  } catch (err) {
    console.error('[API loja/produtos] Erro inesperado:', err);
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: msg 
    }, { status: 500 });
  }
}
