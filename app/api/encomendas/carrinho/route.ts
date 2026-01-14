import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const dynamic = 'force-dynamic';

/**
 * POST - Salvar carrinho (público)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const body = await req.json();

    // Pegar informações do request
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

/**
 * PUT - Atualizar carrinho existente
 */
export async function PUT(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const body = await req.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do carrinho é obrigatório' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('grade_fechada_carrinhos')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar carrinho:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar carrinho', details: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
