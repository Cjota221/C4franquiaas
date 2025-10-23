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

    // Buscar produtos vinculados e ativos (SEM filtros na query inicial)
    const { data: vinculacoes, error: vinculacoesError } = await supabase
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

        // 🔧 FIX: Em desenvolvimento, extrair URL real do proxy e usar direto
        const isDev = process.env.NODE_ENV === 'development';
        const processarImagem = (url: string | null) => {
          if (!url) return null;
          
          // Se for URL com proxy, extrair a URL real
          if (url.includes('proxy-facilzap-image?url=')) {
            try {
              const urlObj = new URL(url);
              const realUrl = urlObj.searchParams.get('url');
              if (realUrl) {
                const decoded = decodeURIComponent(realUrl);
                // Em desenvolvimento, usar URL real; em produção, manter proxy
                return isDev ? decoded : url;
              }
            } catch (e) {
              console.warn('Erro ao processar URL proxy:', e);
            }
          }
          
          // Se já for uma URL completa do Facilzap, retornar direto
          if (url.startsWith('http')) return url;
          
          return url;
        };

        // Calcular tag e parcelamento
        const precoVenda = precoFinal;
        const temDesconto = precoFinal < produto.preco_base;
        let tag = null;
        
        // Remover lógica de destaque pois a coluna não existe
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
          estoque: produto.estoque || 0,
          imagem: processarImagem(produto.imagem),
          imagens: (() => {
            // Processar array de imagens de forma robusta
            if (!produto.imagens || !Array.isArray(produto.imagens)) {
              // Se não tem array de imagens mas tem imagem principal, usar ela
              const imgPrincipal = processarImagem(produto.imagem);
              return imgPrincipal ? [imgPrincipal] : [];
            }
            
            // Filtrar e processar imagens válidas
            return produto.imagens
              .map(img => processarImagem(img))
              .filter((img): img is string => Boolean(img) && img.trim().length > 0);
          })(),
          codigo_barras: produto.codigo_barras || null,
          categoria_id: produto.categoria_id || null,
          variacoes_meta: produto.variacoes_meta || [],
          destaque: false, // Sempre false pois não temos essa coluna
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
