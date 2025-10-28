import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API para vincular produtos a TODAS as franqueadas automaticamente
 * 
 * POST /api/admin/produtos/vincular-todas-franqueadas
 * Body: {
 *   produto_ids: ["uuid1", "uuid2", ...] // opcional - se omitido, vincula TODOS os produtos ativos
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { produto_ids } = body;

    console.log('\n🔗 [Vincular Franqueadas] Iniciando vinculação automática...\n');

    // 1. Buscar todas as franqueadas ativas
    const { data: franqueadas, error: franqueadasError } = await supabase
      .from('franqueadas')
      .select('id, nome')
      .eq('ativo', true);

    if (franqueadasError || !franqueadas || franqueadas.length === 0) {
      console.error('❌ Nenhuma franqueada ativa encontrada');
      return NextResponse.json({
        error: 'Nenhuma franqueada ativa encontrada',
        details: franqueadasError?.message,
      }, { status: 400 });
    }

    console.log(`✅ ${franqueadas.length} franqueadas ativas encontradas`);

    // 2. Buscar produtos a vincular
    let query = supabase
      .from('produtos')
      .select('id, nome')
      .eq('ativo', true);

    // Se passou IDs específicos, filtrar por eles
    if (produto_ids && Array.isArray(produto_ids) && produto_ids.length > 0) {
      query = query.in('id', produto_ids);
    }

    const { data: produtos, error: produtosError } = await query;

    if (produtosError || !produtos || produtos.length === 0) {
      console.error('❌ Nenhum produto ativo encontrado');
      return NextResponse.json({
        error: 'Nenhum produto ativo encontrado',
        details: produtosError?.message,
      }, { status: 400 });
    }

    console.log(`✅ ${produtos.length} produtos ativos encontrados`);

    // 3. Criar vinculações (produtos x franqueadas)
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

    console.log(`📦 Criando ${vinculacoes.length} vinculações (${produtos.length} produtos × ${franqueadas.length} franqueadas)...`);

    // 4. Inserir vinculações (usando upsert para evitar duplicatas)
    const { error: vinculacaoError } = await supabase
      .from('produtos_franqueadas')
      .upsert(vinculacoes, {
        onConflict: 'produto_id,franqueada_id',
        ignoreDuplicates: false, // Atualizar se já existir
      });

    if (vinculacaoError) {
      console.error('❌ Erro ao criar vinculações:', vinculacaoError);
      return NextResponse.json({
        error: 'Erro ao criar vinculações',
        details: vinculacaoError.message,
      }, { status: 500 });
    }

    console.log(`\n✅ ${vinculacoes.length} vinculações criadas/atualizadas com sucesso!\n`);

    return NextResponse.json({
      success: true,
      message: `${vinculacoes.length} vinculações criadas/atualizadas`,
      detalhes: {
        produtos: produtos.length,
        franqueadas: franqueadas.length,
        vinculacoes: vinculacoes.length,
      },
    });

  } catch (error) {
    console.error('❌ [Vincular Franqueadas] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET - Retorna status das vinculações
 */
export async function GET() {
  try {
    // Contar produtos ativos
    const { count: totalProdutos } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    // Contar franqueadas ativas
    const { count: totalFranqueadas } = await supabase
      .from('franqueadas')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    // Contar vinculações ativas
    const { count: totalVinculacoes } = await supabase
      .from('produtos_franqueadas')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    const vinculacoesEsperadas = (totalProdutos || 0) * (totalFranqueadas || 0);
    const percentualVinculado = vinculacoesEsperadas > 0
      ? ((totalVinculacoes || 0) / vinculacoesEsperadas) * 100
      : 0;

    return NextResponse.json({
      status: 'API ativa',
      estatisticas: {
        produtos_ativos: totalProdutos,
        franqueadas_ativas: totalFranqueadas,
        vinculacoes_ativas: totalVinculacoes,
        vinculacoes_esperadas: vinculacoesEsperadas,
        percentual_vinculado: percentualVinculado.toFixed(2) + '%',
        faltam_vincular: Math.max(0, vinculacoesEsperadas - (totalVinculacoes || 0)),
      },
      acao: {
        metodo: 'POST',
        url: '/api/admin/produtos/vincular-todas-franqueadas',
        body_opcional: {
          produto_ids: ['uuid1', 'uuid2'],
        },
        descricao: 'Omita produto_ids para vincular TODOS os produtos ativos',
      },
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    );
  }
}
