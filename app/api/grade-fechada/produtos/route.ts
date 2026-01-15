import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo') === 'true';
    const includeVariacoes = searchParams.get('include_variacoes') === 'true';

    const supabase = await createClient();

    let query = supabase
      .from('grade_fechada_produtos')
      .select(includeVariacoes ? `
        id,
        codigo,
        nome,
        descricao,
        preco_base,
        usa_variacoes,
        ativo,
        criado_em,
        variacoes:grade_fechada_variacoes(
          id,
          cor,
          imagem_url,
          estoque_disponivel,
          ativo,
          ordem
        )
      ` : '*')
      .order('nome', { ascending: true });

    // Filtrar por status ativo
    if (ativo) {
      query = query.eq('ativo', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return NextResponse.json({ error: 'Erro ao buscar produtos' }, { status: 500 });
    }

    // Se incluir variações, filtrar apenas variações ativas e ordenar
    if (includeVariacoes && data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.forEach((produto: any) => {
        if (produto.variacoes) {
          produto.variacoes = produto.variacoes
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((v: any) => v.ativo)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0));
        }
      });
    }

    return NextResponse.json({ data, total: data?.length || 0 });
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
