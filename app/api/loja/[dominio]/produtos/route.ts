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
    const categoriaSlug = searchParams.get('categoria');
    const destaques = searchParams.get('destaques') === 'true';

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('[API loja/produtos] Variáveis de ambiente ausentes');
      return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    console.log(`[API loja/produtos] Buscando loja com dominio: ${dominio}`, { q, categoriaId, destaques });

    // ==========================================
    // 1️⃣ PRIMEIRO buscar em RESELLERS (sistema novo - prioridade)
    // ==========================================
    let reseller = null;
    let usandoSistemaResellers = false;
    
    const { data: resellerData, error: resellerError } = await supabase
      .from('resellers')
      .select('id, store_name, slug, status, is_active')
      .eq('slug', dominio)
      .eq('status', 'aprovada')
      .eq('is_active', true)
      .single();
    
    if (resellerData && !resellerError) {
      reseller = resellerData;
      usandoSistemaResellers = true;
      console.log(`[API loja/produtos] ✅ Reseller encontrada: ${reseller.store_name} (ID: ${reseller.id}) - usando sistema NOVO`);
    }

    // ==========================================
    // 2️⃣ Se não encontrou em resellers, tentar em LOJAS (sistema legado)
    // ==========================================
    let loja = null;
    
    if (!usandoSistemaResellers) {
      console.log('[API loja/produtos] Reseller não encontrada, buscando em lojas (legado)...');
      
      const { data: lojaData, error: lojaError } = await supabase
        .from('lojas')
        .select('id, franqueada_id, nome')
        .eq('dominio', dominio)
        .eq('ativo', true)
        .single();
      
      if (lojaError || !lojaData) {
        console.error('[API loja/produtos] Loja/Reseller não encontrada:', { lojaError, resellerError });
        return NextResponse.json({ 
          error: 'Loja não encontrada ou inativa',
          details: lojaError?.message || resellerError?.message
        }, { status: 404 });
      }
      
      loja = lojaData;
      console.log(`[API loja/produtos] Loja encontrada (legado): ${loja.nome} (ID: ${loja.id})`);
    }

    // Buscar categoria_id pelo slug se fornecido
    let categoriaIdFinal = categoriaId;
    if (categoriaSlug && !categoriaId) {
      const { data: categoria } = await supabase
        .from('categorias')
        .select('id')
        .eq('slug', categoriaSlug)
        .single();
      
      if (categoria) {
        categoriaIdFinal = categoria.id;
        console.log(`[API loja/produtos] Categoria '${categoriaSlug}' -> ID: ${categoriaIdFinal}`);
      }
    }

    // ==========================================
    // 3️⃣ Buscar produtos conforme o sistema
    // ==========================================
    
    type VinculacaoType = {
      id: string;
      produto_id?: string;
      product_id?: string;
      margin_percent?: number;
      custom_price?: number;
      produtos: {
        id: string;
        nome: string;
        descricao?: string;
        preco_base: number;
        estoque: number;
        imagem?: string;
        imagens?: string[];
        codigo_barras?: string;
        variacoes_meta?: Array<{
          sku?: string;
          nome?: string;
          estoque?: number;
          codigo_barras?: string;
        }>;
        ativo: boolean;
      } | null;
    };
    
    let vinculacoes: VinculacaoType[] = [];
    let vinculacoesError: Error | null = null;

    if (usandoSistemaResellers && reseller) {
      // ✅ SISTEMA NOVO: reseller_products
      console.log(`[API loja/produtos] 🆕 Usando sistema RESELLERS para: ${reseller.store_name}`);
      
      let queryReseller = supabase
        .from('reseller_products')
        .select(`
          id,
          product_id,
          margin_percent,
          custom_price,
          produtos:product_id (
            id,
            nome,
            descricao,
            preco_base,
            estoque,
            imagem,
            imagens,
            codigo_barras,
            variacoes_meta,
            ativo
          )
        `)
        .eq('reseller_id', reseller.id)
        .eq('is_active', true);  // ⚠️ CHAVE: só produtos ATIVOS na loja da revendedora

      // Se buscar produto específico por ID
      if (produtoId) {
        console.log(`[API loja/produtos] Buscando produto específico: ${produtoId}`);
        queryReseller = queryReseller.eq('product_id', produtoId);
      }

      const result = await queryReseller;
      
      if (result.error) {
        vinculacoesError = result.error;
      } else {
        // Mapear para formato compatível
        vinculacoes = (result.data || []).map(item => ({
          id: item.id,
          produto_id: item.product_id,
          margin_percent: item.margin_percent,
          custom_price: item.custom_price,
          produtos: Array.isArray(item.produtos) ? item.produtos[0] : item.produtos
        }));
      }
      
    } else if (loja) {
      // ✅ SISTEMA LEGADO: produtos_franqueadas
      console.log(`[API loja/produtos] 📦 Usando sistema LEGADO (produtos_franqueadas) para: ${loja.nome}`);
      
      let queryLegado = supabase
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
            variacoes_meta,
            ativo
          )
        `)
        .eq('franqueada_id', loja.franqueada_id)
        .eq('ativo', true);

      // Se buscar produto específico por ID
      if (produtoId) {
        console.log(`[API loja/produtos] Buscando produto específico: ${produtoId}`);
        queryLegado = queryLegado.eq('produto_id', produtoId);
      }

      const result = await queryLegado;
      
      if (result.error) {
        vinculacoesError = result.error;
      } else {
        vinculacoes = (result.data || []).map(item => ({
          id: item.id,
          produto_id: item.produto_id,
          produtos: Array.isArray(item.produtos) ? item.produtos[0] : item.produtos
        }));
      }
    }

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

    // Buscar categorias dos produtos (query separada para evitar ambiguidade)
    const produtoIds = vinculacoes
      .map(v => (Array.isArray(v.produtos) ? v.produtos[0] : v.produtos)?.id)
      .filter(Boolean);
    
    const { data: produtoCategorias, error: categoriasError } = await supabase
      .from('produto_categorias')
      .select('produto_id, categoria_id')
      .in('produto_id', produtoIds);

    if (categoriasError) {
      console.error('[API loja/produtos] Erro ao buscar categorias (não fatal):', categoriasError);
    }

    // Criar mapa de produto_id -> categoria_id
    const categoriasMap = new Map<string, string>();
    produtoCategorias?.forEach(pc => {
      if (!categoriasMap.has(pc.produto_id)) {
        categoriasMap.set(pc.produto_id, pc.categoria_id);
      }
    });

    // ==========================================
    // 4️⃣ Buscar preços conforme o sistema
    // ==========================================
    let precos: Array<{
      produto_franqueada_id: string;
      preco_final: number;
      ajuste_tipo?: string;
      ajuste_valor?: number;
    }> | null = null;
    
    if (!usandoSistemaResellers) {
      // Sistema legado: buscar na tabela produtos_franqueadas_precos
      const vinculacaoIds = vinculacoes.map(v => v.id);
      const { data: precosData, error: precosError } = await supabase
        .from('produtos_franqueadas_precos')
        .select('*')
        .in('produto_franqueada_id', vinculacaoIds);

      if (precosError) {
        console.error('[API loja/produtos] Erro ao buscar preços legados (não fatal):', precosError);
      }
      precos = precosData;
    }
    // No sistema novo (resellers), o preço é calculado diretamente da margin_percent ou custom_price

    // Combinar dados
    const produtos = vinculacoes
      .map(v => {
        const produto = v.produtos;
        if (!produto) return null;
        
        // 🔧 IMPORTANTE: Verificar se produto está ATIVO na tabela principal
        // Produtos excluídos do FácilZap ficam com ativo=false
        if (!produto.ativo) {
          console.log(`[API loja/produtos] ⛔ Produto "${produto.nome}" IGNORADO (ativo=false na tabela principal)`);
          return null;
        }

        // ==========================================
        // 5️⃣ Calcular preço final conforme o sistema
        // ==========================================
        let precoFinal = produto.preco_base;
        let ajusteTipo: string | null = null;
        let ajusteValor: number | null = null;

        if (usandoSistemaResellers) {
          // Sistema novo: usar margin_percent ou custom_price
          if (v.custom_price && v.custom_price > 0) {
            precoFinal = v.custom_price;
            ajusteTipo = 'fixo';
            ajusteValor = v.custom_price;
          } else if (v.margin_percent && v.margin_percent > 0) {
            precoFinal = produto.preco_base * (1 + v.margin_percent / 100);
            ajusteTipo = 'porcentagem';
            ajusteValor = v.margin_percent;
          }
          console.log(`[API loja/produtos] Preço reseller: base=${produto.preco_base}, margem=${v.margin_percent}%, custom=${v.custom_price}, final=${precoFinal.toFixed(2)}`);
        } else {
          // Sistema legado: buscar na tabela de preços
          const preco = precos?.find(p => p.produto_franqueada_id === v.id);
          if (preco?.preco_final) {
            precoFinal = preco.preco_final;
            ajusteTipo = preco.ajuste_tipo || null;
            ajusteValor = preco.ajuste_valor || null;
          }
        }

        // 🔧 FIX: Sempre usar proxy em produção para evitar erro 403
        const isDev = process.env.NODE_ENV === 'development';
        const baseUrl = isDev ? '' : 'https://c4franquiaas.netlify.app';
        
        const processarImagem = (url: string | null) => {
          if (!url) return null;
          
          console.log('[processarImagem] INPUT:', url);
          
          // ✅ CORREÇÃO CRÍTICA: Se JÁ for URL com proxy Netlify COMPLETO, retornar sem modificar
          if (url.includes('/.netlify/functions/proxy-facilzap-image')) {
            console.log('[processarImagem] URL já tem proxy Netlify completo, retornando sem modificar');
            return url;
          }
          
          // ✅ NOVA CORREÇÃO: Se tiver parâmetros duplicados (facilzap= E url=), extrair URL limpa
          if (url.includes('proxy-facilzap-image?') && url.includes('facilzap=') && url.includes('url=')) {
            console.warn('[processarImagem] ⚠️ Detectado proxy com parâmetros duplicados, limpando...');
            try {
              // Priorizar parâmetro 'url' que tem a URL correta
              const urlMatch = url.match(/[?&]url=([^&]+)/);
              if (urlMatch) {
                const decoded = decodeURIComponent(urlMatch[1]);
                console.log('[processarImagem] URL limpa extraída:', decoded);
                
                // Se for desenvolvimento, retornar URL real
                if (isDev) {
                  return decoded;
                }
                
                // Em produção, criar proxy limpo
                const proxyUrl = `${baseUrl}/.netlify/functions/proxy-facilzap-image?url=${encodeURIComponent(decoded)}`;
                console.log('[processarImagem] Proxy limpo criado:', proxyUrl);
                return proxyUrl;
              }
            } catch (e) {
              console.error('[processarImagem] Erro ao limpar URL duplicada:', url, e);
            }
          }
          
          // Se for URL com proxy antigo (só query string), extrair URL real
          if (url.includes('proxy-facilzap-image?url=') || url.includes('proxy-facilzap-image?facilzap=')) {
            try {
              // Extrair a URL real do parâmetro
              const match = url.match(/[?&](url|facilzap)=([^&]+)/);
              if (match) {
                const decoded = decodeURIComponent(match[2]);
                console.log('[processarImagem] Extraído do proxy antigo:', decoded);
                // Em desenvolvimento, usar URL real
                if (isDev) {
                  console.log('[processarImagem] DEV - retornando URL real');
                  return decoded;
                }
                // Em produção, recriar URL do proxy Netlify (ABSOLUTA)
                const proxyUrl = `${baseUrl}/.netlify/functions/proxy-facilzap-image?url=${encodeURIComponent(decoded)}`;
                console.log('[processarImagem] PROD - proxy recriado:', proxyUrl);
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
          ajuste_tipo: ajusteTipo,
          ajuste_valor: ajusteValor,
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
          categoria_id: categoriasMap.get(produto.id) || null,
          variacoes, // ⭐ VARIAÇÕES COM ESTOQUE REAL
          destaque: false,
          tag,
          parcelamento
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    // ⭐ APLICAR FILTROS APÓS MAPEAR OS DADOS
    let produtosFiltrados = produtos;

    // Filtro de busca por nome
    if (q && q.trim().length > 0) {
      console.log(`[API loja/produtos] 🔍 Aplicando filtro de busca: "${q}"`);
      produtosFiltrados = produtosFiltrados.filter(p => 
        p.nome.toLowerCase().includes(q.toLowerCase())
      );
      console.log(`[API loja/produtos] ✓ Produtos após busca: ${produtosFiltrados.length}`);
    }

    // Filtro de categoria (por ID do Supabase)
    if (categoriaIdFinal) {
      console.log(`[API loja/produtos] 🏷️  Aplicando filtro de categoria ID: ${categoriaIdFinal}`);
      produtosFiltrados = produtosFiltrados.filter(p => {
        const match = p.categoria_id === categoriaIdFinal;
        if (!match) {
          console.log(`[API loja/produtos]   ❌ ${p.nome}: categoria_id = ${p.categoria_id} (diferente de ${categoriaIdFinal})`);
        } else {
          console.log(`[API loja/produtos]   ✅ ${p.nome}: categoria_id = ${p.categoria_id} (MATCH!)`);
        }
        return match;
      });
      console.log(`[API loja/produtos] ✓ Produtos após filtro de categoria: ${produtosFiltrados.length}`);
    }

    console.log(`[API loja/produtos] Produtos finais retornados: ${produtosFiltrados.length}`);

    return NextResponse.json({ 
      produtos: produtosFiltrados,
      meta: {
        total: produtosFiltrados.length,
        loja: loja.nome,
        dominio,
        ...(categoriaIdFinal && { categoria_id: categoriaIdFinal }),
        ...(q && { busca: q })
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
