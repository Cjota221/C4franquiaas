import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const produtoId = params.id;

    if (!produtoId) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('grade_fechada_produtos')
      .select(`
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
      `)
      .eq('id', produtoId)
      .eq('ativo', true)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 });
    }

    // Filtrar apenas variações ativas e ordenar
    interface Variacao {
      ativo: boolean;
      ordem?: number;
    }
    
    if (data.variacoes) {
      data.variacoes = (data.variacoes as Variacao[])
        .filter((v) => v.ativo)
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
