import { createClient } from '@/lib/supabase/client';
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
    const { data: existente } = await createClient()
      .from('lojas')
      .select('id, franqueada_id')
      .eq('dominio', dominio)
      .single();

    if (existente && existente.franqueada_id !== franqueada.id) {
      return NextResponse.json({ error: 'Este domínio já está em uso' }, { status: 400 });
    }

    // Atualizar loja com todos os novos campos
    const { data: loja, error } = await createClient()
      .from('lojas')
      .update({
        nome: body.nome,
        dominio: dominio,
        logo: body.logo,
        cor_primaria: body.cor_primaria,
        cor_secundaria: body.cor_secundaria,
        ativo: body.ativo,
        // Novos campos da migration 013
        descricao: body.descricao,
        slogan: body.slogan,
        banner_hero: body.banner_hero,
        texto_hero: body.texto_hero,
        subtexto_hero: body.subtexto_hero,
        favicon: body.favicon,
        whatsapp: body.whatsapp,
        instagram: body.instagram,
        facebook: body.facebook,
        email_contato: body.email_contato,
        telefone: body.telefone,
        endereco: body.endereco,
        meta_title: body.meta_title,
        meta_description: body.meta_description,
        google_analytics: body.google_analytics,
        facebook_pixel: body.facebook_pixel,
        fonte_principal: body.fonte_principal,
        fonte_secundaria: body.fonte_secundaria,
        cor_texto: body.cor_texto,
        cor_fundo: body.cor_fundo,
        cor_botao: body.cor_botao,
        cor_botao_hover: body.cor_botao_hover,
        cor_link: body.cor_link,
        mostrar_estoque: body.mostrar_estoque,
        mostrar_codigo_barras: body.mostrar_codigo_barras,
        permitir_carrinho: body.permitir_carrinho,
        modo_catalogo: body.modo_catalogo,
        mensagem_whatsapp: body.mensagem_whatsapp,
        margem_padrao: body.margem_padrao, // 🆕 Margem padrão para produtos novos
        // Customização da Logo (migration 017)
        logo_largura_max: body.logo_largura_max,
        logo_altura_max: body.logo_altura_max,
        logo_formato: body.logo_formato,
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
