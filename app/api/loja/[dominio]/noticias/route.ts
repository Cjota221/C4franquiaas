/**
 * 📰 API - Lista de Notícias da Loja
 * 
 * GET /api/loja/[dominio]/noticias
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ dominio: string }> }
) {
  try {
    const { dominio } = await params;
    
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
    
    // Buscar notícias ativas da loja
    const { data: noticias, error: noticiasError } = await supabase
      .from('noticias_loja')
      .select('id, titulo, resumo, imagem, slug, autor, data_publicacao')
      .eq('loja_id', loja.id)
      .eq('ativo', true)
      .order('data_publicacao', { ascending: false });
    
    if (noticiasError) {
      console.error('Erro ao buscar notícias:', noticiasError);
      return NextResponse.json(
        { error: 'Erro ao buscar notícias' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      noticias: noticias || [],
    });
    
  } catch (error) {
    console.error('Erro na API de notícias:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
