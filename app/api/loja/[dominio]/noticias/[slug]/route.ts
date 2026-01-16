/**
 * 📰 API - Notícia Individual
 * 
 * GET /api/loja/[dominio]/noticias/[slug]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dominio: string; slug: string }> }
) {
  try {
    const { dominio, slug } = await params;
    
    // Buscar loja pelo domínio
    const { data: loja, error: lojaError } = await supabase
      .from('lojas')
      .select('id')
      .eq('slug', dominio)
      .eq('ativo', true)
      .single();
    
    if (lojaError || !loja) {
      return NextResponse.json(
        { error: 'Loja não encontrada' },
        { status: 404 }
      );
    }
    
    // Buscar notícia pelo slug
    const { data: noticia, error: noticiaError } = await supabase
      .from('noticias_loja')
      .select('id, titulo, resumo, conteudo, imagem, slug, autor, data_publicacao')
      .eq('loja_id', loja.id)
      .eq('slug', slug)
      .eq('ativo', true)
      .single();
    
    if (noticiaError || !noticia) {
      return NextResponse.json(
        { error: 'Notícia não encontrada' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      noticia,
    });
    
  } catch (error) {
    console.error('Erro na API de notícia:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
