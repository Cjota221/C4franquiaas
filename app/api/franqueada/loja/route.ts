import { supabase } from '@/lib/supabaseClient';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Buscar franqueada logada
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Buscar franqueada pelo user_id
    const { data: franqueada } = await supabase
      .from('franqueadas')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!franqueada) {
      return NextResponse.json({ error: 'Franqueada não encontrada' }, { status: 404 });
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

    // Buscar franqueada logada
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { data: franqueada } = await supabase
      .from('franqueadas')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!franqueada) {
      return NextResponse.json({ error: 'Franqueada não encontrada' }, { status: 404 });
    }

    // Validar domínio (apenas letras minúsculas e números)
    const dominio = body.dominio.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (dominio.length < 3) {
      return NextResponse.json({ error: 'Domínio deve ter pelo menos 3 caracteres' }, { status: 400 });
    }

    // Verificar se domínio já existe
    const { data: existente } = await supabase
      .from('lojas')
      .select('id')
      .eq('dominio', dominio)
      .single();

    if (existente) {
      return NextResponse.json({ error: 'Este domínio já está em uso' }, { status: 400 });
    }

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
        ativo: true
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ loja }, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
