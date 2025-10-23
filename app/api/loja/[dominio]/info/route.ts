import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ dominio: string }> }
) {
  try {
    const { dominio } = await params;

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ error: 'Configuração ausente' }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Buscar loja pelo domínio
    const { data: loja, error } = await supabase
      .from('lojas')
      .select(`
        *,
        franqueadas:franqueada_id (
          nome,
          email,
          telefone,
          cidade,
          estado
        )
      `)
      .eq('dominio', dominio)
      .eq('ativo', true)
      .single();

    if (error || !loja) {
      console.error('[API loja/info] Erro:', error);
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    return NextResponse.json({
      loja: {
        // Identidade Básica
        id: loja.id,
        nome: loja.nome,
        dominio: loja.dominio,
        logo: loja.logo,
        slogan: loja.slogan,
        descricao: loja.descricao,
        favicon: loja.favicon,
        
        // Cores
        cor_primaria: loja.cor_primaria || '#DB1472',
        cor_secundaria: loja.cor_secundaria || '#F8B81F',
        cor_texto: loja.cor_texto || '#1F2937',
        cor_fundo: loja.cor_fundo || '#FFFFFF',
        cor_botao: loja.cor_botao || '#DB1472',
        cor_botao_hover: loja.cor_botao_hover || '#B01059',
        cor_link: loja.cor_link || '#DB1472',
        
        // Fontes
        fonte_principal: loja.fonte_principal || 'Inter',
        fonte_secundaria: loja.fonte_secundaria || 'Inter',
        
        // Hero Section
        banner_hero: loja.banner_hero,
        texto_hero: loja.texto_hero || loja.nome,
        subtexto_hero: loja.subtexto_hero || loja.descricao,
        
        // Contato e Redes Sociais
        whatsapp: loja.whatsapp,
        instagram: loja.instagram,
        facebook: loja.facebook,
        email_contato: loja.email_contato,
        telefone: loja.telefone,
        endereco: loja.endereco,
        
        // SEO e Analytics
        meta_title: loja.meta_title || loja.nome,
        meta_description: loja.meta_description || loja.descricao,
        google_analytics: loja.google_analytics,
        facebook_pixel: loja.facebook_pixel,
        
        // Configurações
        ativo: loja.ativo,
        produtos_ativos: loja.produtos_ativos,
        mostrar_estoque: loja.mostrar_estoque ?? true,
        mostrar_codigo_barras: loja.mostrar_codigo_barras ?? false,
        permitir_carrinho: loja.permitir_carrinho ?? true,
        modo_catalogo: loja.modo_catalogo ?? false,
        mensagem_whatsapp: loja.mensagem_whatsapp || 'Olá! Gostaria de saber mais sobre este produto:',
      },
      franqueada: Array.isArray(loja.franqueadas) ? loja.franqueadas[0] : loja.franqueadas
    }, { status: 200 });
  } catch (err) {
    console.error('[API loja/info] Erro inesperado:', err);
    const msg = err instanceof Error ? err.message : 'Erro inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
