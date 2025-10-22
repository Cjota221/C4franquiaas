import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nome, email, telefone, cpf, cidade, estado } = body;

    // Validações
    if (!nome || !email || !telefone || !cpf || !cidade || !estado) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios' }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('[api/cadastro/franqueada] Variáveis de ambiente ausentes');
      return NextResponse.json({ error: 'Configuração do servidor ausente' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verificar se email já existe
    const { data: existing } = await supabase
      .from('franqueadas')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 400 });
    }

    // Inserir franqueada com status 'pendente'
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
        senha_definida: false
      })
      .select()
      .single();

    if (error) {
      console.error('[api/cadastro/franqueada] Erro ao inserir:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('[api/cadastro/franqueada] ✓ Franqueada cadastrada:', data.id, '-', data.nome);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    console.error('[api/cadastro/franqueada] Erro geral:', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
