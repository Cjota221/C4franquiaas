import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

/**
 * POST - Login do painel Grade Fechada
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { email, senha } = await req.json();

    if (!email || !senha) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário pelo email
    const { data: usuario, error: userError } = await supabase
      .from('grade_fechada_usuarios')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('ativo', true)
      .single();

    if (userError || !usuario) {
      // Log tentativa falha
      await supabase.from('grade_fechada_logs_acesso').insert({
        tipo_evento: 'tentativa_falha',
        detalhes: { email, motivo: 'usuário não encontrado' },
      });

      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaValida) {
      // Log tentativa falha
      await supabase.from('grade_fechada_logs_acesso').insert({
        usuario_id: usuario.id,
        tipo_evento: 'tentativa_falha',
        detalhes: { email, motivo: 'senha incorreta' },
      });

      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    // Gerar token de sessão
    const token = randomBytes(32).toString('hex');
    const tokenExpiraEm = new Date();
    tokenExpiraEm.setHours(tokenExpiraEm.getHours() + 8); // Token válido por 8 horas

    // Atualizar usuário com token
    await supabase
      .from('grade_fechada_usuarios')
      .update({
        token_sessao: token,
        token_expira_em: tokenExpiraEm.toISOString(),
        ultimo_acesso: new Date().toISOString(),
        ip_ultimo_acesso: req.headers.get('x-forwarded-for') || 'unknown',
      })
      .eq('id', usuario.id);

    // Log de login bem-sucedido
    await supabase.from('grade_fechada_logs_acesso').insert({
      usuario_id: usuario.id,
      tipo_evento: 'login',
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    // Retornar dados do usuário (sem senha)
    const { senha_hash, ...userSemSenha } = usuario;

    return NextResponse.json({
      token,
      user: {
        ...userSemSenha,
        token_expira_em: tokenExpiraEm.toISOString(),
      },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
