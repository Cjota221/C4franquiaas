import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

/**
 * POST - Login do painel Grade Fechada
 * Atualizado: 2026-01-14 - Hash correto implementado
 */
export async function POST(req: NextRequest) {
  try {
    console.log('🔐 [LOGIN] Início da requisição');
    console.log('📋 [LOGIN] ENV Check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseServiceKey,
      url: supabaseUrl?.substring(0, 30) + '...'
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { email, senha } = await req.json();

    console.log('🔍 [LOGIN] Dados recebidos:', { email, senhaLength: senha?.length });

    if (!email || !senha) {
      console.log('❌ [LOGIN] Email ou senha vazios');
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Buscar usuário pelo email
    console.log('🔍 [LOGIN] Buscando usuário no banco...');
    const { data: usuario, error: userError } = await supabase
      .from('grade_fechada_usuarios')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('ativo', true)
      .single();

    if (userError) {
      console.error('❌ [LOGIN] Erro ao buscar usuário:', userError);
      // Log tentativa falha
      await supabase.from('grade_fechada_logs_acesso').insert({
        tipo_evento: 'tentativa_falha',
        detalhes: { email, motivo: 'erro no banco: ' + userError.message },
      });

      return NextResponse.json(
        { error: 'Email ou senha incorretos', debug: userError.message },
        { status: 401 }
      );
    }

    if (!usuario) {
      console.log('❌ [LOGIN] Usuário não encontrado');
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

    console.log('✅ [LOGIN] Usuário encontrado:', usuario.email);

    // Verificar senha
    console.log('🔐 [LOGIN] Verificando senha...');
    console.log('🔐 [LOGIN] Hash no banco:', usuario.senha_hash?.substring(0, 20) + '...');
    const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
    console.log('🔐 [LOGIN] Senha válida:', senhaValida);

    if (!senhaValida) {
      console.log('❌ [LOGIN] Senha incorreta');
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

    console.log('✅ [LOGIN] Senha válida! Gerando token...');

    console.log('✅ [LOGIN] Senha válida! Gerando token...');

    // Gerar token de sessão
    const token = randomBytes(32).toString('hex');
    const tokenExpiraEm = new Date();
    tokenExpiraEm.setHours(tokenExpiraEm.getHours() + 8); // Token válido por 8 horas

    console.log('💾 [LOGIN] Atualizando usuário com token...');
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

    console.log('📝 [LOGIN] Registrando log de acesso...');
    // Log de login bem-sucedido
    await supabase.from('grade_fechada_logs_acesso').insert({
      usuario_id: usuario.id,
      tipo_evento: 'login',
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown',
    });

    console.log('✅ [LOGIN] Login realizado com sucesso!');
    // Retornar dados do usuário (sem senha)
    const { senha_hash: _senha_hash, ...userSemSenha } = usuario;

    return NextResponse.json({
      token,
      user: {
        ...userSemSenha,
        token_expira_em: tokenExpiraEm.toISOString(),
      },
    });
  } catch (error) {
    console.error('❌ [LOGIN] Erro fatal:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        debug: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
