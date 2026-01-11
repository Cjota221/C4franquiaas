import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dominio: string; id: string }> }
) {
  try {
    const { dominio, id } = await params;

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // ==========================================
    // 1️⃣ Tentar buscar em LOJAS (sistema legado franqueadas)
    // ==========================================
    const { data: loja, error: lojaError } = await supabase
      .from('lojas')
      .select('id, franqueada_id')
      .eq('dominio', dominio)
      .eq('ativo', true)
      .single();

    // ==========================================
    // 2️⃣ Se não encontrou em lojas, buscar em RESELLERS (sistema novo)
    // ==========================================
    let reseller = null;
    let usandoSistemaResellers = false;
    
    if (lojaError || !loja) {
      const { data: resellerData, error: resellerError } = await supabase
        .from('resellers')
        .select('id, store_name, slug, status, is_active')
        .eq('slug', dominio)
        .eq('status', 'aprovada')
        .eq('is_active', true)
        .single();
      
      if (resellerError || !resellerData) {
        return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
      }
      
      reseller = resellerData;
      usandoSistemaResellers = true;
    }

    // ==========================================
    // 3️⃣ Buscar produto conforme o sistema
    // ==========================================
    let produto: {
      id: string;
      nome: string;
      descricao?: string;
      preco_base: number;
      estoque: number;
      imagem?: string;
      imagens?: string[];
      codigo_barras?: string;
      sku?: string;
      categorias?: string;
      variacoes_meta?: unknown[];
    } | null = null;
    
    let precoFinal = 0;
    let ajusteTipo: string | null = null;
    let ajusteValor: number | null = null;

    if (usandoSistemaResellers && reseller) {
      // ✅ SISTEMA NOVO: reseller_products
      const { data: vinculacao, error: vinculacaoError } = await supabase
        .from('reseller_products')
        .select(`
          id,
          is_active,
          margin_percent,
          custom_price,
          product_id,
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
            categorias
          )
        `)
        .eq('reseller_id', reseller.id)
        .eq('product_id', id)
        .eq('is_active', true)
        .single();

      if (vinculacaoError || !vinculacao) {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
      }

      const produtoData = Array.isArray(vinculacao.produtos) ? vinculacao.produtos[0] : vinculacao.produtos;
      if (!produtoData) {
        return NextResponse.json({ error: 'Dados do produto não encontrados' }, { status: 404 });
      }

      produto = produtoData as typeof produto;
      
      // Calcular preço com margem ou custom_price
      if (vinculacao.custom_price && vinculacao.custom_price > 0) {
        precoFinal = vinculacao.custom_price;
        ajusteTipo = 'fixo';
        ajusteValor = vinculacao.custom_price;
      } else if (vinculacao.margin_percent && vinculacao.margin_percent > 0) {
        precoFinal = produtoData.preco_base * (1 + vinculacao.margin_percent / 100);
        ajusteTipo = 'porcentagem';
        ajusteValor = vinculacao.margin_percent;
      } else {
        precoFinal = produtoData.preco_base;
      }

    } else if (loja) {
      // ✅ SISTEMA LEGADO: produtos_franqueadas
      const { data: vinculacao, error: vinculacaoError } = await supabase
        .from('produtos_franqueadas')
        .select(`
          id,
          ativo,
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
            categorias
          )
        `)
        .eq('franqueada_id', loja.franqueada_id)
        .eq('produto_id', id)
        .eq('ativo', true)
        .single();

      if (vinculacaoError || !vinculacao) {
        return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
      }

      // Buscar preço personalizado
      const { data: preco, error: precoError } = await supabase
        .from('produtos_franqueadas_precos')
        .select('*')
        .eq('produto_franqueada_id', vinculacao.id)
        .eq('ativo_no_site', true)
        .single();

      if (precoError || !preco) {
        return NextResponse.json({ error: 'Produto não está ativo no site' }, { status: 404 });
      }

      const produtoData = Array.isArray(vinculacao.produtos) ? vinculacao.produtos[0] : vinculacao.produtos;
      if (!produtoData) {
        return NextResponse.json({ error: 'Dados do produto não encontrados' }, { status: 404 });
      }

      produto = produtoData as typeof produto;
      precoFinal = preco.preco_final || produtoData.preco_base;
      ajusteTipo = preco.ajuste_tipo || null;
      ajusteValor = preco.ajuste_valor || null;
    }

    if (!produto) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    return NextResponse.json({
      produto: {
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao,
        preco_base: produto.preco_base,
        preco_final: precoFinal,
        ajuste_tipo: ajusteTipo,
        ajuste_valor: ajusteValor,
        estoque: produto.estoque || 0,
        imagem: produto.imagem,
        imagens: produto.imagens,
        codigo_barras: produto.codigo_barras,
        sku: produto.sku,
        categorias: produto.categorias,
        variacoes_meta: produto.variacoes_meta
      }
    }, { status: 200 });
  } catch (err) {
    console.error('[API loja/produto/id] Erro inesperado:', err);
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
