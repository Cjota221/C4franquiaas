import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST - Cadastro de novo usuário Grade Fechada
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { nome, email, senha } = await req.json();

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: 'Nome, email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se já existe
    const { data: existente } = await supabase
      .from('grade_fechada_usuarios')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existente) {
      return NextResponse.json(
        { error: 'Este email já está cadastrado' },
        { status: 400 }
      );
    }

    // Gerar hash da senha
    const senhaHash = await bcrypt.hash(senha, 10);

    // Gerar token
    const token = randomBytes(32).toString('hex');
    const tokenExpiraEm = new Date();
    tokenExpiraEm.setHours(tokenExpiraEm.getHours() + 8);

    // Criar usuário
    const { data: usuario, error: createError } = await supabase
      .from('grade_fechada_usuarios')
      .insert({
        nome,
        email: email.toLowerCase(),
        senha_hash: senhaHash,
        ativo: true,
        token_sessao: token,
        token_expira_em: tokenExpiraEm.toISOString(),
        ip_ultimo_acesso: req.headers.get('x-forwarded-for') || 'unknown',
      })
      .select()
      .single();

    if (createError) {
      console.error('Erro ao criar usuário:', createError);
      return NextResponse.json(
        { error: 'Erro ao criar usuário: ' + createError.message },
        { status: 500 }
      );
    }

    // Log de cadastro
    await supabase.from('grade_fechada_logs_acesso').insert({
      usuario_id: usuario.id,
      tipo_evento: 'cadastro',
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    // Retornar dados (sem senha)
    const { senha_hash: _senha_hash, ...userSemSenha } = usuario;

    return NextResponse.json({
      token,
      user: {
        ...userSemSenha,
        token_expira_em: tokenExpiraEm.toISOString(),
      },
    });
  } catch (error) {
    console.error('Erro no cadastro:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        debug: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
