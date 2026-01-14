import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

/**
 * GET - Listar todos os produtos de grade fechada
 * Query params:
 * - ativo: filtrar por status (true/false)
 * - page: número da página (default: 1)
 * - per_page: itens por página (default: 20)
 * - include_variacoes: incluir variações (true/false)
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(req.url);

    const ativo = searchParams.get('ativo');
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = Math.min(parseInt(searchParams.get('per_page') || '20'), 50); // Max 50 itens
    const include_variacoes = searchParams.get('include_variacoes') === 'true';
    const offset = (page - 1) * per_page;

    let query = supabase
      .from('grade_fechada_produtos')
      .select(
        include_variacoes 
          ? '*, variacoes:grade_fechada_variacoes(*)'
          : '*',
        { count: 'exact' }
      )
      .order('ordem', { ascending: true })
      .order('nome', { ascending: true })
      .range(offset, offset + per_page - 1);

    if (ativo !== null) {
      query = query.eq('ativo', ativo === 'true');
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar produtos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar produtos' },
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
 * POST - Criar novo produto com variações
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();

    // Separar variações do body
    const { variacoes, ...produtoData } = body;

    // 1. Inserir o produto
    const { data: produto, error: produtoError } = await supabase
      .from('grade_fechada_produtos')
      .insert([{
        ...produtoData,
        usa_variacoes: variacoes && variacoes.length > 0,
      }])
      .select()
      .single();

    if (produtoError) {
      console.error('Erro ao criar produto:', produtoError);
      return NextResponse.json(
        { error: 'Erro ao criar produto', details: produtoError.message },
        { status: 400 }
      );
    }

    // 2. Inserir variações se existirem
    if (variacoes && variacoes.length > 0) {
      const variacoesData = variacoes.map((v: { cor: string; imagem_url: string; estoque?: number }, index: number) => ({
        produto_id: produto.id,
        cor: v.cor,
        imagem_url: v.imagem_url,
        estoque_disponivel: v.estoque || 0,
        ordem: index,
        ativo: true,
      }));

      const { error: variacoesError } = await supabase
        .from('grade_fechada_variacoes')
        .insert(variacoesData);

      if (variacoesError) {
        console.error('Erro ao criar variações:', variacoesError);
        // Rollback: deletar produto criado
        await supabase
          .from('grade_fechada_produtos')
          .delete()
          .eq('id', produto.id);

        return NextResponse.json(
          { error: 'Erro ao criar variações', details: variacoesError.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({ data: produto }, { status: 201 });
  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
