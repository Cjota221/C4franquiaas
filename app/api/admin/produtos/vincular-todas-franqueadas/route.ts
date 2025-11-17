import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/produtos/vincular-todas-franqueadas
 * Vincula produtos ativos às franqueadas e revendedoras aprovadas
 * 
 * Body: { produto_ids?: number[] } - Array de IDs de produtos a vincular
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { produto_ids } = body;

    console.log('\n🔗 [Vincular] Iniciando vinculação automática...\n');

    // 1. Buscar franqueadas aprovadas
    const { data: franqueadas, error: franqueadasError } = await supabase
      .from('franqueadas')
      .select('id, nome_fantasia')
      .eq('status', 'aprovada');

    if (franqueadasError) {
      console.error('❌ Erro ao buscar franqueadas:', franqueadasError);
      return NextResponse.json({
        error: 'Erro ao buscar franqueadas',
        details: franqueadasError.message,
      }, { status: 500 });
    }

    // 2. Buscar revendedoras aprovadas (se tabela existir)
    let revendedoras: { id: string; nome_fantasia: string }[] = [];
    const { data: revendedorasData, error: revendedorasError } = await supabase
      .from('resellers')
      .select('id, nome_fantasia')
      .eq('status', 'aprovada');

    if (!revendedorasError && revendedorasData) {
      revendedoras = revendedorasData;
      console.log(`✅ ${revendedoras.length} revendedoras aprovadas encontradas`);
    }

    const totalParceiros = (franqueadas?.length || 0) + revendedoras.length;

    if (totalParceiros === 0) {
      console.error('⚠️ Nenhuma franqueada ou revendedora aprovada encontrada');
      return NextResponse.json({
        error: 'Nenhuma franqueada ou revendedora aprovada encontrada',
        success: false,
      }, { status: 400 });
    }

    console.log(`✅ ${franqueadas?.length || 0} franqueadas aprovadas`);
    console.log(`✅ ${revendedoras.length} revendedoras aprovadas`);
    console.log(`📊 Total de parceiros: ${totalParceiros}`);

    // 3. Buscar produtos
    let query = supabase
      .from('produtos')
      .select('id, nome, ativo, estoque')
      .eq('ativo', true);

    // Se forneceu IDs específicos, filtrar por eles
    if (produto_ids && Array.isArray(produto_ids) && produto_ids.length > 0) {
      query = query.in('id', produto_ids);
    }

    const { data: produtos, error: produtosError } = await query;

    if (produtosError) {
      console.error('❌ Erro ao buscar produtos:', produtosError);
      return NextResponse.json({
        error: 'Erro ao buscar produtos',
        details: produtosError.message,
      }, { status: 500 });
    }

    console.log('📦 Produtos encontrados:', produtos?.length);

    if (!produtos || produtos.length === 0) {
      // Debug: mostrar alguns produtos para verificar
      const { data: todosProdutos } = await supabase
        .from('produtos')
        .select('id, nome, ativo')
        .limit(10);
      
      console.log('⚠️ DEBUG - Total produtos:', todosProdutos?.length);
      console.log('📝 Exemplos:', todosProdutos?.map(p => ({ nome: p.nome, ativo: p.ativo })));
      
      return NextResponse.json({
        error: 'Nenhum produto ativo encontrado. Sincronize produtos do FácilZap primeiro.',
        success: false,
        debug: {
          total: todosProdutos?.length || 0,
          exemplos: todosProdutos?.slice(0, 3)
        }
      }, { status: 400 });
    }

    console.log(`✅ ${produtos.length} produtos ativos encontrados`);

    // 4. Criar vinculações para franqueadas
    const vinculacoesFranqueadas = [];
    if (franqueadas && franqueadas.length > 0) {
      for (const produto of produtos) {
        for (const franqueada of franqueadas) {
          vinculacoesFranqueadas.push({
            produto_id: produto.id,
            franqueada_id: franqueada.id,
            ativo: true,
          });
        }
      }
    }

    // 5. Criar vinculações para revendedoras
    const vinculacoesRevendedoras = [];
    if (revendedoras.length > 0) {
      for (const produto of produtos) {
        for (const revendedora of revendedoras) {
          vinculacoesRevendedoras.push({
            produto_id: produto.id,
            reseller_id: revendedora.id,
            ativo: true,
          });
        }
      }
    }

    let vinculacoesCriadas = 0;
    const erros: string[] = [];

    // 6. Inserir vinculações de franqueadas
    if (vinculacoesFranqueadas.length > 0) {
      console.log(`🔄 Criando ${vinculacoesFranqueadas.length} vinculações para franqueadas...`);
      
      const { error: vinculacaoError } = await supabase
        .from('produtos_franqueadas')
        .upsert(vinculacoesFranqueadas, {
          onConflict: 'produto_id,franqueada_id',
          ignoreDuplicates: false,
        });

      if (vinculacaoError) {
        console.error('❌ Erro ao criar vinculações de franqueadas:', vinculacaoError);
        erros.push(`Franqueadas: ${vinculacaoError.message}`);
      } else {
        vinculacoesCriadas += vinculacoesFranqueadas.length;
        console.log(`✅ ${vinculacoesFranqueadas.length} vinculações de franqueadas criadas`);
      }
    }

    // 7. Inserir vinculações de revendedoras
    if (vinculacoesRevendedoras.length > 0) {
      console.log(`🔄 Criando ${vinculacoesRevendedoras.length} vinculações para revendedoras...`);
      
      const { error: vinculacaoError } = await supabase
        .from('produtos_revendedoras')
        .upsert(vinculacoesRevendedoras, {
          onConflict: 'produto_id,reseller_id',
          ignoreDuplicates: false,
        });

      if (vinculacaoError) {
        console.error('❌ Erro ao criar vinculações de revendedoras:', vinculacaoError);
        erros.push(`Revendedoras: ${vinculacaoError.message}`);
      } else {
        vinculacoesCriadas += vinculacoesRevendedoras.length;
        console.log(`✅ ${vinculacoesRevendedoras.length} vinculações de revendedoras criadas`);
      }
    }

    console.log(`\n✅ Total: ${vinculacoesCriadas} vinculações criadas!\n`);

    return NextResponse.json({
      success: true,
      message: `${vinculacoesCriadas} vinculações criadas com sucesso`,
      detalhes: {
        produtos: produtos.length,
        franqueadas: franqueadas?.length || 0,
        revendedoras: revendedoras.length,
        total_parceiros: totalParceiros,
        vinculacoes: vinculacoesCriadas,
        vinculacoes_franqueadas: vinculacoesFranqueadas.length,
        vinculacoes_revendedoras: vinculacoesRevendedoras.length,
        erros: erros.length > 0 ? erros : undefined,
      },
    });

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      success: false,
    }, { status: 500 });
  }
}

/**
 * GET /api/admin/produtos/vincular-todas-franqueadas
 * Retorna estatísticas de vinculações
 */
export async function GET() {
  try {
    // 1. Produtos ativos
    const { count: totalProdutos } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    // 2. Franqueadas aprovadas
    const { count: totalFranqueadas } = await supabase
      .from('franqueadas')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aprovada');

    // 3. Revendedoras aprovadas
    const { count: totalRevendedoras } = await supabase
      .from('resellers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aprovada');

    // 4. Vinculações franqueadas ativas
    const { count: totalVinculacoesFranqueadas } = await supabase
      .from('produtos_franqueadas')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    // 5. Vinculações revendedoras ativas
    const { count: totalVinculacoesRevendedoras } = await supabase
      .from('produtos_revendedoras')
      .select('*', { count: 'exact', head: true })
      .eq('ativo', true);

    const totalVinculacoes = (totalVinculacoesFranqueadas || 0) + (totalVinculacoesRevendedoras || 0);
    const totalParceiros = (totalFranqueadas || 0) + (totalRevendedoras || 0);
    const esperadas = (totalProdutos || 0) * totalParceiros;
    const percentual = esperadas > 0 ? ((totalVinculacoes / esperadas) * 100) : 0;

    return NextResponse.json({
      status: 'API ativa',
      timestamp: new Date().toISOString(),
      estatisticas: {
        produtos_ativos: totalProdutos || 0,
        franqueadas_aprovadas: totalFranqueadas || 0,
        revendedoras_aprovadas: totalRevendedoras || 0,
        total_parceiros: totalParceiros,
        vinculacoes_franqueadas: totalVinculacoesFranqueadas || 0,
        vinculacoes_revendedoras: totalVinculacoesRevendedoras || 0,
        total_vinculacoes: totalVinculacoes,
        vinculacoes_esperadas: esperadas,
        percentual_vinculado: percentual.toFixed(2) + '%',
        status_vinculacao: percentual >= 100 ? '✅ Completo' : 
                           percentual >= 50 ? '🟡 Parcial' : 
                           '🔴 Baixo',
      },
    });

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar estatísticas',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}