import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

/**
 * API: Produtos Relacionados para Revendedoras
 * GET /api/catalogo/[slug]/produtos/relacionados/[id]
 * 
 * Busca produtos da mesma categoria que estão ativos para a revendedora
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  try {
    const { slug, id: produtoId } = await params;

    console.log(`🔍 [Produtos Relacionados] Buscando para produto ${produtoId} no slug ${slug}`);

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // 1. Buscar revendedora pelo slug
    const { data: reseller, error: resellerError } = await supabase
      .from('resellers')
      .select('id')
      .eq('slug', slug)
      .eq('status', 'aprovada')
      .single();

    if (resellerError || !reseller) {
      console.error('[Produtos Relacionados] Revendedora não encontrada');
      return NextResponse.json({ produtos: [] }, { status: 200 });
    }

    // 2. Buscar categorias do produto atual
    const { data: produtoAtual, error: produtoError } = await supabase
      .from('produtos')
      .select('categorias')
      .eq('id', produtoId)
      .single();

    if (produtoError || !produtoAtual) {
      console.log('[Produtos Relacionados] Produto atual não encontrado');
      return NextResponse.json({ produtos: [] }, { status: 200 });
    }

    console.log(`📦 Buscando produtos relacionados (sem filtro de categoria)...`);

    // 3. Buscar produtos relacionados (TODOS vinculados, diferentes do atual)
    // 🆕 SEM filtro de is_active - mostrar TODOS produtos para aumentar conversão
    const { data: relacionados, error: relacionadosError } = await supabase
      .from('reseller_products')
      .select(`
        product_id,
        margin_percent,
        is_active,
        produtos:product_id (
          id,
          nome,
          preco_base,
          imagem
        )
      `)
      .eq('reseller_id', reseller.id)
      .neq('product_id', produtoId)
      .limit(20); // Buscar mais produtos para randomizar

    if (relacionadosError) {
      console.error('[Produtos Relacionados] Erro:', relacionadosError);
      return NextResponse.json({ produtos: [] }, { status: 200 });
    }

    console.log(`✨ ${relacionados?.length || 0} produtos encontrados (ativos + inativos)`);
    
    // 🔍 DEBUG: Ver quantos são ativos vs desativados
    const ativos = relacionados?.filter(p => p.is_active).length || 0;
    const desativados = (relacionados?.length || 0) - ativos;
    console.log(`📊 Ativos: ${ativos} | Desativados: ${desativados}`);

    // 4. Formatar produtos e embaralhar (shuffle) para variar
    type ProdutoData = { id: string; nome: string; preco_base: number; imagem: string };
    
    const produtosFormatados = (relacionados || [])
      .filter(item => {
        // Supabase pode retornar objeto único OU array dependendo da query
        const produtos = item.produtos as ProdutoData | ProdutoData[] | null;
        if (!produtos) return false;
        
        // Se for array, pegar o primeiro
        const prod = Array.isArray(produtos) ? produtos[0] : produtos;
        return prod && prod.id;
      })
      .sort(() => Math.random() - 0.5) // Embaralhar aleatoriamente
      .map(item => {
        // Normalizar: pode ser array ou objeto
        const produtos = item.produtos as ProdutoData | ProdutoData[];
        const prod = Array.isArray(produtos) ? produtos[0] : produtos;
        
        const precoBase = prod.preco_base || 0;
        const margem = item.margin_percent || 0;
        const precoFinal = precoBase * (1 + margem / 100);

        return {
          id: prod.id,
          nome: prod.nome,
          preco: precoFinal,
          imagens: prod.imagem ? [prod.imagem] : null,
        };
      })
      .slice(0, 8); // Limitar a 8 produtos

    console.log(`✅ Retornando ${produtosFormatados.length} produtos relacionados`);

    return NextResponse.json({
      produtos: produtosFormatados,
      total: produtosFormatados.length,
    });

  } catch (error) {
    console.error('[Produtos Relacionados] Erro geral:', error);
    return NextResponse.json({ produtos: [] }, { status: 200 });
  }
}
