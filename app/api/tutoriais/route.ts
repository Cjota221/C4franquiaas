import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET - Listar vídeos (com filtro opcional por página)
export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const searchParams = request.nextUrl.searchParams;
  const pagina = searchParams.get('pagina');

  let query = supabase
    .from('tutorial_videos')
    .select('*')
    .order('pagina', { ascending: true })
    .order('ordem', { ascending: true });

  if (pagina) {
    query = query.eq('pagina', pagina);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST - Criar novo vídeo tutorial
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await request.json();

  const { titulo, descricao, video_url, pagina, ativo, ordem } = body;

  if (!titulo || !video_url || !pagina) {
    return NextResponse.json(
      { error: 'Campos obrigatórios: titulo, video_url, pagina' },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('tutorial_videos')
    .insert({
      titulo,
      descricao,
      video_url,
      pagina,
      ativo: ativo ?? true,
      ordem: ordem ?? 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// PATCH - Atualizar vídeo (ativar/desativar, editar)
export async function PATCH(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await request.json();

  const { id, titulo, descricao, video_url, pagina, ativo, ordem } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (titulo !== undefined) updates.titulo = titulo;
  if (descricao !== undefined) updates.descricao = descricao;
  if (video_url !== undefined) updates.video_url = video_url;
  if (pagina !== undefined) updates.pagina = pagina;
  if (ativo !== undefined) updates.ativo = ativo;
  if (ordem !== undefined) updates.ordem = ordem;

  const { data, error } = await supabase
    .from('tutorial_videos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// DELETE - Remover vídeo
export async function DELETE(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
  }

  const { error } = await supabase
    .from('tutorial_videos')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
