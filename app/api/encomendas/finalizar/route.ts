import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';

/**
 * POST - Criar pedido a partir do carrinho (público)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const body = await req.json();

    // Calcular valor total
    const valor_total = body.itens.reduce(
      (sum: number, item: { valor_total: number }) => sum + item.valor_total,
      0
    );

    const pedidoData = {
      ...body,
      valor_total,
      status: 'orcamento',
      origem: body.origem || 'site',
    };

    const { data: pedido, error: pedidoError } = await supabase
      .from('grade_fechada_pedidos')
      .insert([pedidoData])
      .select()
      .single();

    if (pedidoError) {
      console.error('Erro ao criar pedido:', pedidoError);
      return NextResponse.json(
        { error: 'Erro ao criar pedido', details: pedidoError.message },
        { status: 400 }
      );
    }

    // Se veio de um carrinho, converter o carrinho
    if (body.carrinho_id) {
      await supabase
        .from('grade_fechada_carrinhos')
        .update({
          status: 'convertido',
          convertido_em_pedido_id: pedido.id,
          data_conversao: new Date().toISOString(),
        })
        .eq('id', body.carrinho_id);
    }

    return NextResponse.json({ data: pedido }, { status: 201 });
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
