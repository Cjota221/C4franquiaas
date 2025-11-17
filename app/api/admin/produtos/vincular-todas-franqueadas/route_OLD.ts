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

    console.log('\n [Vincular Franqueadas] Iniciando vinculação automática...\n');

    const { data: franqueadas, error: franqueadasError } = await supabase
      .from('franqueadas')
      .select('id, nome')
      .eq('status', 'aprovada');

    if (franqueadasError || !franqueadas || franqueadas.length === 0) {
      console.error(' Nenhuma franqueada aprovada encontrada');
      return NextResponse.json({
        error: 'Nenhuma franqueada aprovada encontrada',
        details: franqueadasError?.message,
      }, { status: 400 });
    }

    console.log(` ${franqueadas.length} franqueadas aprovadas encontradas`);

    let query = supabase
      .from('produtos')
      .select('id, nome, ativo')
      .eq('ativo', true);

    if (produto_ids && Array.isArray(produto_ids) && produto_ids.length > 0) {
      query = query.in('id', produto_ids);
    }

    const { data: produtos, error: produtosError } = await query;

    console.log(' Produtos encontrados:', produtos?.length);

    if (!produtos || produtos.length === 0) {
      const { data: todosProdutos } = await supabase
        .from('produtos')
        .select('id, nome, ativo')
        .limit(10);
      
      console.log(' DEBUG - Total produtos:', todosProdutos?.length);
      console.log(' Exemplos:', todosProdutos?.map(p => ({ nome: p.nome, ativo: p.ativo })));
      
      return NextResponse.json({
        error: 'Nenhum produto ativo encontrado. Sincronize produtos do FácilZap primeiro.',
        debug: {
          total: todosProdutos?.length || 0,
          exemplos: todosProdutos?.slice(0, 3)
        }
      }, { status: 400 });
    }

    console.log(` ${produtos.length} produtos ativos encontrados`);

    const vinculacoes = [];
    for (const produto of produtos) {
      for (const franqueada of franqueadas) {
        vinculacoes.push({
          produto_id: produto.id,
          franqueada_id: franqueada.id,
          ativo: true,
        });
      }
    }

    console.log(` Criando ${vinculacoes.length} vinculações...`);

    const { error: vinculacaoError } = await supabase
      .from('produtos_franqueadas')
      .upsert(vinculacoes, {
        onConflict: 'produto_id,franqueada_id',
        ignoreDuplicates: false,
      });

    if (vinculacaoError) {
      console.error(' Erro ao criar vinculações:', vinculacaoError);
      return NextResponse.json({
        error: 'Erro ao criar vinculações',
        details: vinculacaoError.message,
      }, { status: 500 });
    }

    console.log(`\n ${vinculacoes.length} vinculações criadas!\n`);

    return NextResponse.json({
      success: true,
      message: `${vinculacoes.length} vinculações criadas`,
      detalhes: {
        produtos: produtos.length,
        franqueadas: franqueadas.length,
        vinculacoes: vinculacoes.length,
      },
    });

  } catch (error) {
    console.error(' Erro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { count: totalProdutos } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    const { count: totalFranqueadas } = await supabase
      .from('franqueadas')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aprovada');

    const { count: totalVinculacoes } = await supabase
      .from('produtos_franqueadas')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    const esperadas = (totalProdutos || 0) * (totalFranqueadas || 0);
    const percentual = esperadas > 0 ? ((totalVinculacoes || 0) / esperadas) * 100 : 0;

    return NextResponse.json({
      status: 'API ativa',
      estatisticas: {
        produtos_ativos: totalProdutos,
        franqueadas_aprovadas: totalFranqueadas,
        vinculacoes_ativas: totalVinculacoes,
        vinculacoes_esperadas: esperadas,
        percentual_vinculado: percentual.toFixed(2) + '%',
      },
    });

  } catch (error) {
    return NextResponse.json({ error: 'Erro' }, { status: 500 });
  }
}