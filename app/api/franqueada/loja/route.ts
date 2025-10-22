import { supabase } from '@/lib/supabaseClient';
import { getAuthFranqueada } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    
    // Buscar franqueada logada
    const { franqueada, error: authError } = await getAuthFranqueada(authHeader);
    if (authError || !franqueada) {
      return NextResponse.json({ error: authError || 'Não autenticado' }, { status: 401 });
    }

    // Buscar loja da franqueada
    const { data: loja, error } = await supabase
      .from('lojas')
      .select('*')
      .eq('franqueada_id', franqueada.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ loja: loja || null }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('authorization');

    console.log('[POST /api/franqueada/loja] Dados recebidos:', {
      nome: body.nome,
      dominio: body.dominio,
      hasLogo: !!body.logo,
      hasAuthHeader: !!authHeader
    });

    // Buscar franqueada logada
    const { franqueada, error: authError } = await getAuthFranqueada(authHeader);
    if (authError || !franqueada) {
      console.error('[POST /api/franqueada/loja] Erro de autenticação:', authError);
      return NextResponse.json({ error: authError || 'Não autenticado' }, { status: 401 });
    }

    console.log('[POST /api/franqueada/loja] Franqueada autenticada:', franqueada.id);

    // Validar domínio (apenas letras minúsculas e números)
    const dominio = body.dominio.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (dominio.length < 3) {
      console.error('[POST /api/franqueada/loja] Domínio muito curto:', dominio);
      return NextResponse.json({ error: 'Domínio deve ter pelo menos 3 caracteres' }, { status: 400 });
    }

    console.log('[POST /api/franqueada/loja] Domínio validado:', dominio);

    // Verificar se domínio já existe
    const { data: existente, error: checkError } = await supabase
      .from('lojas')
      .select('id')
      .eq('dominio', dominio)
      .maybeSingle();

    if (checkError) {
      console.error('[POST /api/franqueada/loja] Erro ao verificar domínio:', checkError);
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }

    if (existente) {
      console.error('[POST /api/franqueada/loja] Domínio já existe:', dominio);
      return NextResponse.json({ error: 'Este domínio já está em uso' }, { status: 400 });
    }

    console.log('[POST /api/franqueada/loja] Criando loja...');

    // Criar loja
    const { data: loja, error } = await supabase
      .from('lojas')
      .insert({
        franqueada_id: franqueada.id,
        nome: body.nome,
        dominio: dominio,
        logo: body.logo || null,
        cor_primaria: body.cor_primaria || '#DB1472',
        cor_secundaria: body.cor_secundaria || '#F8B81F',
        ativo: body.ativo !== undefined ? body.ativo : true
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/franqueada/loja] Erro ao criar loja:', error);
      return NextResponse.json({ error: error.message, details: error }, { status: 500 });
    }

    console.log('[POST /api/franqueada/loja] Loja criada com sucesso:', loja.id);

    return NextResponse.json({ loja }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/franqueada/loja] Erro inesperado:', err);
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    return NextResponse.json({ error: msg, stack: err instanceof Error ? err.stack : undefined }, { status: 500 });
  }
}
