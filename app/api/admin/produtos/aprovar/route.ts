import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/produtos/aprovar
 * Aprovar ou rejeitar produtos pendentes
 * 
 * Body: {
 *   produto_ids: string[],
 *   acao: 'aprovar' | 'rejeitar',
 *   notas?: string
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

    // Verificar se é admin
    const { data: userData } = await supabase
      .from('auth.users')
      .select('raw_user_meta_data')
      .eq('id', user.id)
      .single();

    const isAdmin = userData?.raw_user_meta_data?.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Parse body
    const body = await request.json();
    const { produto_ids, acao, notas } = body;

    if (!produto_ids || !Array.isArray(produto_ids) || produto_ids.length === 0) {
      return NextResponse.json({ error: 'produto_ids é obrigatório' }, { status: 400 });
    }

    if (acao !== 'aprovar' && acao !== 'rejeitar') {
      return NextResponse.json({ error: 'acao deve ser "aprovar" ou "rejeitar"' }, { status: 400 });
    }

    // Chamar função SQL apropriada
    let result;
    if (acao === 'aprovar') {
      const { data, error } = await supabase.rpc('aprovar_produtos', {
        produto_ids,
        admin_id: user.id,
        notas_texto: notas || null
      });

      if (error) {
        console.error('Erro ao aprovar produtos:', error);
        return NextResponse.json({ 
          error: 'Erro ao aprovar produtos', 
          details: error.message 
        }, { status: 500 });
      }

      result = data;
    } else {
      // Rejeitar
      if (!notas) {
        return NextResponse.json({ 
          error: 'Campo "notas" é obrigatório ao rejeitar produtos' 
        }, { status: 400 });
      }

      const { data, error } = await supabase.rpc('rejeitar_produtos', {
        produto_ids,
        admin_id: user.id,
        motivo: notas
      });

      if (error) {
        console.error('Erro ao rejeitar produtos:', error);
        return NextResponse.json({ 
          error: 'Erro ao rejeitar produtos', 
          details: error.message 
        }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      acao,
      produtos: result,
      message: acao === 'aprovar' 
        ? `${result.length} produto(s) aprovado(s) com sucesso!`
        : `${result.length} produto(s) rejeitado(s).`
    });

  } catch (error) {
    console.error('Erro na API de aprovação:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
