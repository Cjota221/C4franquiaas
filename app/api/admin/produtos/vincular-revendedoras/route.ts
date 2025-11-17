import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/produtos/vincular-revendedoras
 * Vincula produtos selecionados às revendedoras aprovadas
 * 
 * Body: { produto_ids?: string[] } - Array de IDs de produtos a vincular
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { produto_ids } = body;

    console.log('\n🔗 [Vincular Revendedoras] Iniciando...\n');

    // 1. Buscar revendedoras aprovadas
    const { data: revendedoras, error: revendedorasError } = await supabase
      .from('resellers')
      .select('id, store_name')
      .eq('status', 'aprovada');

    if (revendedorasError) {
      console.error('❌ Erro ao buscar revendedoras:', revendedorasError);
      return NextResponse.json({
        error: 'Erro ao buscar revendedoras',
        details: revendedorasError.message,
      }, { status: 500 });
    }

    if (!revendedoras || revendedoras.length === 0) {
      console.error('⚠️ Nenhuma revendedora aprovada encontrada');
      return NextResponse.json({
        error: 'Nenhuma revendedora aprovada encontrada',
        success: false,
      }, { status: 400 });
    }

    console.log(`✅ ${revendedoras.length} revendedoras aprovadas encontradas`);

    // 2. Buscar produtos
    let query = supabase
      .from('produtos')
      .select('id, nome, ativo, estoque')
      .eq('ativo', true);

    // Se forneceu IDs específicos, filtrar por eles
    if (produto_ids && Array.isArray(produto_ids) && produto_ids.length > 0) {
      query = query.in('id', produto_ids);
      console.log(`📦 Vinculando ${produto_ids.length} produtos selecionados`);
    } else {
      console.log('📦 Vinculando TODOS os produtos ativos');
    }

    const { data: produtos, error: produtosError } = await query;

    if (produtosError) {
      console.error('❌ Erro ao buscar produtos:', produtosError);
      return NextResponse.json({
        error: 'Erro ao buscar produtos',
        details: produtosError.message,
      }, { status: 500 });
    }

    if (!produtos || produtos.length === 0) {
      return NextResponse.json({
        error: 'Nenhum produto ativo encontrado',
        success: false,
      }, { status: 400 });
    }

    console.log(`✅ ${produtos.length} produtos encontrados`);

    // 3. Criar vinculações para revendedoras
    const vinculacoes = [];
    for (const produto of produtos) {
      for (const revendedora of revendedoras) {
        vinculacoes.push({
          reseller_id: revendedora.id,
          product_id: produto.id,
          margin_percent: 20, // Margem padrão de 20%
          is_active: true,
        });
      }
    }

    console.log(`📊 Criando ${vinculacoes.length} vinculações (${produtos.length} produtos × ${revendedoras.length} revendedoras)...`);

    // 4. Inserir vinculações (ignora duplicatas)
    const { error: vinculacaoError } = await supabase
      .from('reseller_products')
      .upsert(vinculacoes, {
        onConflict: 'reseller_id,product_id',
        ignoreDuplicates: false, // Atualiza se já existir
      });

    if (vinculacaoError) {
      console.error('❌ Erro ao criar vinculações:', vinculacaoError);
      return NextResponse.json({
        error: 'Erro ao criar vinculações',
        details: vinculacaoError.message,
      }, { status: 500 });
    }

    // 5. Atualizar contadores das revendedoras
    console.log('📊 Atualizando contadores...');
    
    for (const revendedora of revendedoras) {
      const { count } = await supabase
        .from('reseller_products')
        .select('*', { count: 'exact', head: true })
        .eq('reseller_id', revendedora.id)
        .eq('is_active', true);

      await supabase
        .from('resellers')
        .update({ total_products: count || 0 })
        .eq('id', revendedora.id);
    }

    console.log('✅ Vinculação concluída com sucesso!\n');

    return NextResponse.json({
      success: true,
      message: `${vinculacoes.length} vinculações processadas com sucesso`,
      detalhes: {
        produtos: produtos.length,
        revendedoras: revendedoras.length,
        vinculacoes: vinculacoes.length,
      },
    });

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
    return NextResponse.json({
      error: 'Erro ao processar requisição',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}
