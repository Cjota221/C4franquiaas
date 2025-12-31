import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/revendedora/produtos/ativar
 * Ativar produto no catálogo da franqueada
 * 
 * Body: {
 *   product_id: string,
 *   margem_percent?: number,
 *   custom_price?: number
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Buscar reseller_id do usuário
    const { data: resellerData, error: resellerError } = await supabase
      .from('resellers')
      .select('id, name')
      .eq('user_id', user.id)
      .single();

    if (resellerError || !resellerData) {
      return NextResponse.json({ error: 'Revendedora não encontrada' }, { status: 404 });
    }

    // Parse body
    const body = await request.json();
    const { product_id, margem_percent, custom_price } = body;

    if (!product_id) {
      return NextResponse.json({ error: 'product_id é obrigatório' }, { status: 400 });
    }

    // Chamar função SQL
    const { data, error } = await supabase.rpc('ativar_produto_franqueada', {
      p_reseller_id: resellerData.id,
      p_product_id: product_id,
      p_margem_percent: margem_percent || null,
      p_custom_price: custom_price || null
    });

    if (error) {
      console.error('Erro ao ativar produto:', error);
      return NextResponse.json({ 
        error: 'Erro ao ativar produto', 
        details: error.message 
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ 
        error: 'Produto não encontrado ou já ativo' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Produto ativado com sucesso!',
      product_id
    });

  } catch (error) {
    console.error('Erro na API de ativação:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
