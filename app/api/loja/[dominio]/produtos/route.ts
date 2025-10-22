import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dominio: string }> }
) {
  try {
    const { dominio } = await params;

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
      console.error('[API loja/produtos] Loja não encontrada:', lojaError);
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Buscar produtos vinculados e ativos no site
    const { data: vinculacoes, error: vinculacoesError } = await supabase
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
      .eq('ativo', true);

    if (vinculacoesError) {
      console.error('[API loja/produtos] Erro ao buscar vinculações:', vinculacoesError);
      return NextResponse.json({ error: vinculacoesError.message }, { status: 500 });
    }

    console.log('[API loja/produtos] Vinculações encontradas:', vinculacoes?.length || 0);

    // Buscar preços personalizados para cada vinculação
    const vinculacaoIds = vinculacoes?.map(v => v.id) || [];
    
    const { data: precos, error: precosError } = await supabase
      .from('produtos_franqueadas_precos')
      .select('*')
      .in('produto_franqueada_id', vinculacaoIds)
      .eq('ativo_no_site', true);

    if (precosError) {
      console.error('[API loja/produtos] Erro ao buscar preços:', precosError);
    }

    console.log('[API loja/produtos] Preços ativos encontrados:', precos?.length || 0);

    // Combinar dados e filtrar apenas produtos ativos no site
    const produtos = vinculacoes
      ?.map(v => {
        const produto = Array.isArray(v.produtos) ? v.produtos[0] : v.produtos;
        if (!produto) return null;

        const preco = precos?.find(p => p.produto_franqueada_id === v.id);
        
        // Só retornar se tiver preço E estiver ativo no site
        if (!preco || !preco.ativo_no_site) {
          return null;
        }

        return {
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
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null) || [];

    console.log('[API loja/produtos] Produtos finais retornados:', produtos.length);

    return NextResponse.json({ produtos }, { status: 200 });
  } catch (err) {
    console.error('[API loja/produtos] Erro inesperado:', err);
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
