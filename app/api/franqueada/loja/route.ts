import { createClient } from '@/lib/supabase/client';
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
    const { data: loja, error } = await createClient()
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
    const { data: existente, error: checkError } = await createClient()
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

    // Criar loja com todos os campos novos
    const { data: loja, error } = await createClient()
      .from('lojas')
      .insert({
        franqueada_id: franqueada.id,
        nome: body.nome,
        dominio: dominio,
        logo: body.logo || null,
        cor_primaria: body.cor_primaria || '#DB1472',
        cor_secundaria: body.cor_secundaria || '#F8B81F',
        ativo: body.ativo !== undefined ? body.ativo : true,
        // Novos campos da migration 013
        descricao: body.descricao || null,
        slogan: body.slogan || null,
        banner_hero: body.banner_hero || null,
        texto_hero: body.texto_hero || null,
        subtexto_hero: body.subtexto_hero || null,
        favicon: body.favicon || null,
        whatsapp: body.whatsapp || null,
        instagram: body.instagram || null,
        facebook: body.facebook || null,
        email_contato: body.email_contato || null,
        telefone: body.telefone || null,
        endereco: body.endereco || null,
        meta_title: body.meta_title || null,
        meta_description: body.meta_description || null,
        google_analytics: body.google_analytics || null,
        facebook_pixel: body.facebook_pixel || null,
        fonte_principal: body.fonte_principal || 'Inter',
        fonte_secundaria: body.fonte_secundaria || 'Poppins',
        cor_texto: body.cor_texto || '#1F2937',
        cor_fundo: body.cor_fundo || '#FFFFFF',
        cor_botao: body.cor_botao || '#DB1472',
        cor_botao_hover: body.cor_botao_hover || '#B01059',
        cor_link: body.cor_link || '#F8B81F',
        mostrar_estoque: body.mostrar_estoque !== undefined ? body.mostrar_estoque : true,
        mostrar_codigo_barras: body.mostrar_codigo_barras !== undefined ? body.mostrar_codigo_barras : false,
        permitir_carrinho: body.permitir_carrinho !== undefined ? body.permitir_carrinho : true,
        modo_catalogo: body.modo_catalogo !== undefined ? body.modo_catalogo : false,
        mensagem_whatsapp: body.mensagem_whatsapp || 'Olá! Gostaria de mais informações sobre este produto:',
        margem_padrao: body.margem_padrao || null, // 🆕 Revendedora escolhe sua margem
        // Customização da Logo (migration 017)
        logo_largura_max: body.logo_largura_max || 280,
        logo_altura_max: body.logo_altura_max || 80,
        logo_formato: body.logo_formato || 'horizontal'
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
