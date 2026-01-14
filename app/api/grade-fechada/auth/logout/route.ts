import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

/**
 * POST - Logout do painel Grade Fechada
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 400 }
      );
    }

    // Buscar usuário pelo token
    const { data: usuario } = await supabase
      .from('grade_fechada_usuarios')
      .select('id')
      .eq('token_sessao', token)
      .single();

    if (usuario) {
      // Invalidar token
      await supabase
        .from('grade_fechada_usuarios')
        .update({
          token_sessao: null,
          token_expira_em: null,
        })
        .eq('id', usuario.id);

      // Log de logout
      await supabase.from('grade_fechada_logs_acesso').insert({
        usuario_id: usuario.id,
        tipo_evento: 'logout',
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
