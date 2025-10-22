import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { dominio: string; id: string } }
) {
  try {
    const { dominio, id } = params;

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Buscar loja
    const { data: loja, error: lojaError } = await supabase
      .from('lojas')
      .select('id, franqueada_id')
      .eq('dominio', dominio)
      .eq('ativo', true)
      .single();

    if (lojaError || !loja) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Buscar produto específico vinculado
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
          sku,
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

    const produto = Array.isArray(vinculacao.produtos) ? vinculacao.produtos[0] : vinculacao.produtos;

    if (!produto) {
      return NextResponse.json({ error: 'Dados do produto não encontrados' }, { status: 404 });
    }

    return NextResponse.json({
      produto: {
        id: produto.id,
        nome: produto.nome,
        descricao: produto.descricao,
        preco_base: produto.preco_base,
        preco_final: preco.preco_final || produto.preco_base,
        ajuste_tipo: preco.ajuste_tipo || null,
        ajuste_valor: preco.ajuste_valor || null,
        estoque: produto.estoque || 0,
        imagem: produto.imagem,
        imagens: produto.imagens,
        codigo_barras: produto.codigo_barras,
        sku: produto.sku,
        categorias: produto.categorias
      }
    }, { status: 200 });
  } catch (err) {
    console.error('[API loja/produto/id] Erro inesperado:', err);
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
