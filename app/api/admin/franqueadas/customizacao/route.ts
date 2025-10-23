import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const franqueadaId = searchParams.get('franqueada_id');

    if (!franqueadaId) {
      return NextResponse.json({ error: 'ID da franqueada não fornecido' }, { status: 400 });
    }

    // Buscar loja da franqueada
    const { data: loja, error: lojaError } = await supabase
      .from('lojas')
      .select('*')
      .eq('franqueada_id', franqueadaId)
      .single();

    if (lojaError || !loja) {
      return NextResponse.json({ error: 'Loja não encontrada' }, { status: 404 });
    }

    // Buscar categorias em destaque
    const { data: categorias } = await supabase
      .from('categorias_destaque')
      .select('*')
      .eq('loja_id', loja.id)
      .order('ordem', { ascending: true });

    return NextResponse.json({
      success: true,
      loja,
      categorias: categorias || []
    });
  } catch (error) {
    console.error('Erro ao buscar customização:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { loja_id, mensagens_regua, icones_confianca, categorias_destaque, cor_primaria, cor_secundaria } = body;

    if (!loja_id) {
      return NextResponse.json({ error: 'ID da loja não fornecido' }, { status: 400 });
    }

    // Atualizar loja
    const updateData: Record<string, unknown> = {};
    if (mensagens_regua) updateData.mensagens_regua = mensagens_regua;
    if (icones_confianca) updateData.icones_confianca = icones_confianca;
    if (cor_primaria) updateData.cor_primaria = cor_primaria;
    if (cor_secundaria) updateData.cor_secundaria = cor_secundaria;

    const { error: lojaError } = await supabase
      .from('lojas')
      .update(updateData)
      .eq('id', loja_id);

    if (lojaError) {
      console.error('Erro ao atualizar loja:', lojaError);
      return NextResponse.json({ error: 'Erro ao atualizar loja' }, { status: 500 });
    }

    // Atualizar categorias em destaque
    if (categorias_destaque) {
      // Deletar categorias antigas
      await supabase
        .from('categorias_destaque')
        .delete()
        .eq('loja_id', loja_id);

      // Inserir novas categorias
      if (categorias_destaque.length > 0) {
        const categoriasParaInserir = categorias_destaque
          .filter((cat: { nome?: string; imagem?: string }) => cat.nome && cat.imagem)
          .map((cat: { nome: string; imagem: string; ordem?: number }) => ({
            loja_id,
            nome: cat.nome,
            imagem: cat.imagem,
            ordem: cat.ordem || 0,
            ativo: true
          }));

        if (categoriasParaInserir.length > 0) {
          const { error: catError } = await supabase
            .from('categorias_destaque')
            .insert(categoriasParaInserir);

          if (catError) {
            console.error('Erro ao inserir categorias:', catError);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Customização salva com sucesso!'
    });
  } catch (error) {
    console.error('Erro ao salvar customização:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
