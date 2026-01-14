import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

/**
 * GET - Listar todos os pedidos
 * Query params:
 * - status: filtrar por status
 * - page: número da página
 * - per_page: itens por página
 * - search: busca por nome, telefone ou número de pedido
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '20');
    const offset = (page - 1) * per_page;

    let query = supabase
      .from('grade_fechada_pedidos')
      .select('*', { count: 'exact' })
      .order('criado_em', { ascending: false })
      .range(offset, offset + per_page - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(
        `cliente_nome.ilike.%${search}%,cliente_telefone.ilike.%${search}%,numero_pedido.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar pedidos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar pedidos' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        per_page,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / per_page),
      },
    });
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST - Criar novo pedido (usado pelo site público)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
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

    const { data, error } = await supabase
      .from('grade_fechada_pedidos')
      .insert([pedidoData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar pedido:', error);
      return NextResponse.json(
        { error: 'Erro ao criar pedido', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
