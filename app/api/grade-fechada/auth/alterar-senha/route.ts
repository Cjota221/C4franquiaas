import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST - Alterar senha do usuário
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    const { senhaAtual, novaSenha } = await req.json();

    if (!token || !senhaAtual || !novaSenha) {
      return NextResponse.json(
        { error: 'Token, senha atual e nova senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário pelo token
    const { data: usuario, error: userError } = await supabase
      .from('grade_fechada_usuarios')
      .select('*')
      .eq('token_sessao', token)
      .single();

    if (userError || !usuario) {
      return NextResponse.json(
        { error: 'Sessão inválida' },
        { status: 401 }
      );
    }

    // Verificar senha atual
    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha_hash);

    if (!senhaValida) {
      return NextResponse.json(
        { error: 'Senha atual incorreta' },
        { status: 401 }
      );
    }

    // Gerar hash da nova senha
    const novoHash = await bcrypt.hash(novaSenha, 10);

    // Atualizar senha
    const { error: updateError } = await supabase
      .from('grade_fechada_usuarios')
      .update({
        senha_hash: novoHash,
        senha_temporaria: false,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', usuario.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Erro ao atualizar senha' },
        { status: 500 }
      );
    }

    // Log
    await supabase.from('grade_fechada_logs_acesso').insert({
      usuario_id: usuario.id,
      tipo_evento: 'alteracao_senha',
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
