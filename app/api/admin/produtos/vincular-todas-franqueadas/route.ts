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

    console.log('\nÃ°Å¸â€â€” [Vincular Franqueadas] Iniciando vinculaÃƒÂ§ÃƒÂ£o automÃƒÂ¡tica...\n');

    // 1. Buscar todas as franqueadas aprovadas
    const { data: franqueadas, error: franqueadasError } = await supabase
      .from('franqueadas')
      .select('id, nome')
      .eq('status', 'aprovada');

    if (franqueadasError || !franqueadas || franqueadas.length === 0) {
      console.error('Ã¢ÂÅ’ Nenhuma franqueada aprovada encontrada');
      return NextResponse.json({
        error: 'Nenhuma franqueada aprovada encontrada',
        details: franqueadasError?.message,
      }, { status: 400 });
    }

    console.log(`Ã¢Å“â€¦ ${franqueadas.length} franqueadas aprovadas encontradas`);

    // 2. Buscar produtos a vincular
    let query = supabase
      .from('produtos')
      .select('id, nome')
      .eq('status', 'aprovada');

    // Se passou IDs especÃƒÂ­ficos, filtrar por eles
    if (produto_ids && Array.isArray(produto_ids) && produto_ids.length > 0) {
      query = query.in('id', produto_ids);
    }

    const { data: produtos, error: produtosError } = await query;

    if (produtosError || !produtos || produtos.length === 0) {
      console.error('Ã¢ÂÅ’ Nenhum produto ativo encontrado');
      return NextResponse.json({
        error: 'Nenhum produto ativo encontrado',
        details: produtosError?.message,
      }, { status: 400 });
    }

    console.log(`Ã¢Å“â€¦ ${produtos.length} produtos ativos encontrados`);

    // 3. Criar vinculaÃƒÂ§ÃƒÂµes (produtos x franqueadas)
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

    console.log(`Ã°Å¸â€œÂ¦ Criando ${vinculacoes.length} vinculaÃƒÂ§ÃƒÂµes (${produtos.length} produtos Ãƒâ€” ${franqueadas.length} franqueadas)...`);

    // 4. Inserir vinculaÃƒÂ§ÃƒÂµes (usando upsert para evitar duplicatas)
    const { error: vinculacaoError } = await supabase
      .from('produtos_franqueadas')
      .upsert(vinculacoes, {
        onConflict: 'produto_id,franqueada_id',
        ignoreDuplicates: false, // Atualizar se jÃƒÂ¡ existir
      });

    if (vinculacaoError) {
      console.error('Ã¢ÂÅ’ Erro ao criar vinculaÃƒÂ§ÃƒÂµes:', vinculacaoError);
      return NextResponse.json({
        error: 'Erro ao criar vinculaÃƒÂ§ÃƒÂµes',
        details: vinculacaoError.message,
      }, { status: 500 });
    }

    console.log(`\nÃ¢Å“â€¦ ${vinculacoes.length} vinculaÃƒÂ§ÃƒÂµes criadas/atualizadas com sucesso!\n`);

    return NextResponse.json({
      success: true,
      message: `${vinculacoes.length} vinculaÃƒÂ§ÃƒÂµes criadas/atualizadas`,
      detalhes: {
        produtos: produtos.length,
        franqueadas: franqueadas.length,
        vinculacoes: vinculacoes.length,
      },
    });

  } catch (error) {
    console.error('Ã¢ÂÅ’ [Vincular Franqueadas] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * GET - Retorna status das vinculaÃƒÂ§ÃƒÂµes
 */
export async function GET() {
  try {
    // Contar produtos ativos
    const { count: totalProdutos } = await supabase
      .from('produtos')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aprovada');

    // Contar franqueadas aprovadas
    const { count: totalFranqueadas } = await supabase
      .from('franqueadas')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aprovada');

    // Contar vinculaÃƒÂ§ÃƒÂµes ativas
    const { count: totalVinculacoes } = await supabase
      .from('produtos_franqueadas')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'aprovada');

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
    console.error('Ã¢ÂÅ’ Erro ao buscar estatÃƒÂ­sticas:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar estatÃƒÂ­sticas' },
      { status: 500 }
    );
  }
}
