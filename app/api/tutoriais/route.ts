import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// GET - Listar vídeos (com filtro opcional por página)
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: async () => cookieStore });
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
    console.error('Erro na query tutorial_videos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

// POST - Criar novo vídeo tutorial
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: async () => cookieStore });
  const body = await request.json();

  console.log('📹 POST /api/tutoriais - Body recebido:', body);

  const { titulo, descricao, video_url, pagina, ativo, ordem } = body;

  if (!titulo || !video_url || !pagina) {
    console.error('❌ Campos obrigatórios faltando:', { titulo, video_url, pagina });
    return NextResponse.json(
      { error: 'Campos obrigatórios: titulo, video_url, pagina' },
      { status: 400 }
    );
  }

  const insertData = {
    titulo,
    descricao,
    video_url,
    pagina,
    ativo: ativo ?? true,
    ordem: ordem ?? 0,
  };

  console.log('📝 Dados para inserir:', insertData);

  const { data, error } = await supabase
    .from('tutorial_videos')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao inserir vídeo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('✅ Vídeo criado com sucesso:', data);

  return NextResponse.json(data, { status: 201 });
}

// PATCH - Atualizar vídeo (ativar/desativar, editar)
export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: async () => cookieStore });
  const body = await request.json();

  console.log('✏️ PATCH /api/tutoriais - Body recebido:', body);

  const { id, titulo, descricao, video_url, pagina, ativo, ordem } = body;

  if (!id) {
    console.error('❌ ID é obrigatório');
    return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (titulo !== undefined) updates.titulo = titulo;
  if (descricao !== undefined) updates.descricao = descricao;
  if (video_url !== undefined) updates.video_url = video_url;
  if (pagina !== undefined) updates.pagina = pagina;
  if (ativo !== undefined) updates.ativo = ativo;
  if (ordem !== undefined) updates.ordem = ordem;

  console.log('📝 Updates para aplicar:', updates);

  const { data, error } = await supabase
    .from('tutorial_videos')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('❌ Erro ao atualizar vídeo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('✅ Vídeo atualizado com sucesso:', data);

  return NextResponse.json(data);
}

// DELETE - Remover vídeo
export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: async () => cookieStore });
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
