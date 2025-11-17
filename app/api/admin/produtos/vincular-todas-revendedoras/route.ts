import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { produto_ids } = body;

    console.log('\n[Vincular Revendedoras] Iniciando...\n');

    const { data: revendedoras, error: revendedorasError } = await supabase
      .from('resellers')
      .select('id, store_name')
      .eq('status', 'aprovada');

    if (revendedorasError || !revendedoras || revendedoras.length === 0) {
      console.error('Nenhuma revendedora aprovada');
      return NextResponse.json({
        error: 'Nenhuma revendedora aprovada encontrada',
        details: revendedorasError?.message,
      }, { status: 400 });
    }

    console.log(`${revendedoras.length} revendedoras encontradas`);

    let query = supabase
      .from('produtos')
      .select('id, nome, ativo, estoque')
      .eq('ativo', true)
      .gt('estoque', 0);

    if (produto_ids && Array.isArray(produto_ids) && produto_ids.length > 0) {
      query = query.in('id', produto_ids);
    }

    const { data: produtos, error: produtosError } = await query;

    if (!produtos || produtos.length === 0) {
      return NextResponse.json({
        error: 'Nenhum produto ativo com estoque encontrado',
      }, { status: 400 });
    }

    console.log(`${produtos.length} produtos encontrados`);

    const vinculacoes = [];
    for (const produto of produtos) {
      for (const revendedora of revendedoras) {
        vinculacoes.push({
          reseller_id: revendedora.id,
          produto_id: produto.id,
          margem_lucro: 20,
          ativo: true,
        });
      }
    }

    console.log(`Criando ${vinculacoes.length} vinculacoes...`);

    const { error: vinculacaoError } = await supabase
      .from('reseller_products')
      .upsert(vinculacoes, {
        onConflict: 'reseller_id,produto_id',
        ignoreDuplicates: true,
      });

    if (vinculacaoError) {
      console.error('Erro ao criar vinculacoes:', vinculacaoError);
      return NextResponse.json({
        error: 'Erro ao criar vinculacoes',
        details: vinculacaoError.message,
      }, { status: 500 });
    }

    console.log(`\n${vinculacoes.length} vinculacoes criadas!\n`);

    return NextResponse.json({
      success: true,
      message: `${vinculacoes.length} vinculacoes criadas`,
      detalhes: {
        produtos: produtos.length,
        revendedoras: revendedoras.length,
        vinculacoes: vinculacoes.length,
      },
    });

  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json({
      error: 'Erro ao processar requisicao',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}