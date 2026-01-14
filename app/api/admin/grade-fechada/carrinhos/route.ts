import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

/**
 * GET - Listar carrinhos abandonados
 * Query params:
 * - status: filtrar por status (ativo, convertido, expirado)
 * - page, per_page: paginação
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status') || 'ativo';
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = Math.min(parseInt(searchParams.get('per_page') || '20'), 50); // Max 50 itens
    const offset = (page - 1) * per_page;

    const query = supabase
      .from('grade_fechada_carrinhos')
      .select('*', { count: 'exact' })
      .eq('status', status)
      .order('criado_em', { ascending: false })
      .range(offset, offset + per_page - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar carrinhos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar carrinhos' },
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
 * POST - Criar/atualizar carrinho (usado pelo site público)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    
    // Pegar IP e user agent do request
    const ip_address = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const user_agent = req.headers.get('user-agent') || '';

    const carrinhoData = {
      ...body,
      ip_address,
      user_agent,
      status: 'ativo',
    };

    const { data, error } = await supabase
      .from('grade_fechada_carrinhos')
      .insert([carrinhoData])
      .select()
      .single();

    if (error) {
      console.error('Erro ao salvar carrinho:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar carrinho', details: error.message },
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
