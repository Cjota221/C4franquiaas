import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

/**
 * POST - Verificar token de sessão
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token não fornecido' },
        { status: 401 }
      );
    }

    // Buscar usuário pelo token
    const { data: usuario, error } = await supabase
      .from('grade_fechada_usuarios')
      .select('id, email, nome, nivel, ativo, token_expira_em, senha_temporaria')
      .eq('token_sessao', token)
      .eq('ativo', true)
      .single();

    if (error || !usuario) {
      return NextResponse.json(
        { valid: false, error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verificar se token expirou
    const now = new Date();
    const expiraEm = new Date(usuario.token_expira_em);

    if (expiraEm < now) {
      // Token expirado - invalidar
      await supabase
        .from('grade_fechada_usuarios')
        .update({
          token_sessao: null,
          token_expira_em: null,
        })
        .eq('id', usuario.id);

      // Log sessão expirada
      await supabase.from('grade_fechada_logs_acesso').insert({
        usuario_id: usuario.id,
        tipo_evento: 'sessao_expirada',
      });

      return NextResponse.json(
        { valid: false, error: 'Sessão expirada' },
        { status: 401 }
      );
    }

    // Token válido
    return NextResponse.json({
      valid: true,
      user: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        nivel: usuario.nivel,
        senha_temporaria: usuario.senha_temporaria,
      },
    });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return NextResponse.json(
      { valid: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
