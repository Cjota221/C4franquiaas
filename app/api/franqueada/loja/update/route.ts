import { supabase } from '@/lib/supabaseClient';
import { getAuthFranqueada } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('authorization');

    // Buscar franqueada logada
    const { franqueada, error: authError } = await getAuthFranqueada(authHeader);
    if (authError || !franqueada) {
      return NextResponse.json({ error: authError || 'Não autenticado' }, { status: 401 });
    }

    // Validar domínio
    const dominio = body.dominio.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (dominio.length < 3) {
      return NextResponse.json({ error: 'Domínio deve ter pelo menos 3 caracteres' }, { status: 400 });
    }

    // Verificar se domínio já existe (exceto o próprio)
    const { data: existente } = await supabase
      .from('lojas')
      .select('id, franqueada_id')
      .eq('dominio', dominio)
      .single();

    if (existente && existente.franqueada_id !== franqueada.id) {
      return NextResponse.json({ error: 'Este domínio já está em uso' }, { status: 400 });
    }

    // Atualizar loja
    const { data: loja, error } = await supabase
      .from('lojas')
      .update({
        nome: body.nome,
        dominio: dominio,
        logo: body.logo,
        cor_primaria: body.cor_primaria,
        cor_secundaria: body.cor_secundaria,
        ativo: body.ativo,
        atualizado_em: new Date().toISOString()
      })
      .eq('franqueada_id', franqueada.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ loja }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
