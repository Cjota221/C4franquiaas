import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    console.log(`[api/admin/franqueados/:id/produtos] Buscando produtos para franqueada: ${id}`);

    // Buscar produtos vinculados à franqueada
    const { data, error } = await supabase
      .from('produtos_franqueadas')
      .select(`
        id,
        ativo,
        vinculado_em,
        produto_id
      `)
      .eq('franqueada_id', id)
      .eq('ativo', true);

    if (error) {
      console.error('[api/admin/franqueados/:id/produtos] Erro ao buscar vinculações:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log('[api/admin/franqueados/:id/produtos] Nenhum produto vinculado');
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    // Buscar detalhes dos produtos
    const produtoIds = data.map(item => item.produto_id);
    
    const { data: produtos, error: produtosError } = await supabase
      .from('produtos')
      .select('id, nome, preco_base, estoque, imagem, ativo')
      .in('id', produtoIds);

    if (produtosError) {
      console.error('[api/admin/franqueados/:id/produtos] Erro ao buscar produtos:', produtosError);
      return NextResponse.json({ error: produtosError.message }, { status: 500 });
    }

    // Combinar dados
    const produtosComVinculacao = produtos?.map(produto => {
      const vinculacao = data.find(v => v.produto_id === produto.id);
      return {
        ...produto,
        vinculado_em: vinculacao?.vinculado_em
      };
    }) || [];

    console.log(`[api/admin/franqueados/:id/produtos] ${produtosComVinculacao.length} produtos encontrados`);

    return NextResponse.json({ data: produtosComVinculacao }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    console.error('[api/admin/franqueados/:id/produtos] Erro geral:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
