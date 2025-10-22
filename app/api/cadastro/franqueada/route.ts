import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, email, telefone, cpf, cidade, estado, senha } = body;

    // Validações
    if (!nome || !email || !telefone || !cpf || !cidade || !estado || !senha) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    if (senha.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('[api/cadastro/franqueada] Variáveis de ambiente ausentes');
      return NextResponse.json({ error: 'Configuração do servidor ausente' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verificar se email já existe na tabela franqueadas
    const { data: existing } = await supabase
      .from('franqueadas')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 });
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true, // Auto-confirma o email
      user_metadata: {
        nome,
        tipo: 'franqueada'
      }
    });

    if (authError) {
      console.error('[api/cadastro/franqueada] Erro ao criar usuário Auth:', authError);
      return NextResponse.json({ 
        error: 'Erro ao criar conta: ' + authError.message 
      }, { status: 500 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 });
    }

    // Inserir franqueada com status 'pendente' e user_id já vinculado
    const { data, error } = await supabase
      .from('franqueadas')
      .insert({
        nome,
        email,
        telefone,
        cpf,
        cidade,
        estado,
        status: 'pendente',
        user_id: authData.user.id,
        senha_definida: true
      })
      .select()
      .single();

    if (error) {
      console.error('[api/cadastro/franqueada] Erro ao inserir:', error);
      
      // Se falhar ao inserir na tabela, remove o usuário criado no Auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[api/cadastro/franqueada] ✓ Franqueada cadastrada:', data.id, '-', data.nome);
    console.log('[api/cadastro/franqueada] ✓ Usuário criado no Auth com email:', email);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    console.error('[api/cadastro/franqueada] Erro geral:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
