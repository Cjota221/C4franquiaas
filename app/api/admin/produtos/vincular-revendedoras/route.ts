import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/admin/produtos/vincular-revendedoras
 * Vincula produtos às revendedoras aprovadas/ativas
 * 
 * Body: { produto_ids?: string[] } - Array de IDs de produtos a vincular (se vazio, vincula todos ativos)
 * 
 * Comportamento:
 * - Cria registros em reseller_products para cada combinação produto×revendedora
 * - Se já existir, atualiza (upsert)
 * - Preserva margem existente ou usa padrão
 * - Retorna detalhes do que foi feito para feedback
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { produto_ids } = body;

    console.log('[Vincular Revendedoras] Iniciando...');

    // 1. Buscar revendedoras aprovadas E ativas
    const { data: revendedoras, error: revendedorasError } = await supabase
      .from('resellers')
      .select('id, store_name, slug')
      .eq('status', 'aprovada')
      .eq('is_active', true);

    if (revendedorasError) {
      console.error('Erro ao buscar revendedoras:', revendedorasError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar revendedoras',
        details: revendedorasError.message,
      }, { status: 500 });
    }

    if (!revendedoras || revendedoras.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma revendedora ativa/aprovada encontrada',
        detalhes: {
          produtos: 0,
          revendedoras: 0,
          vinculacoes_novas: 0,
          vinculacoes_atualizadas: 0,
        },
      }, { status: 400 });
    }

    console.log(`${revendedoras.length} revendedoras ativas/aprovadas encontradas`);

    // 2. Buscar produtos
    let query = supabase
      .from('produtos')
      .select('id, nome, ativo')
      .eq('ativo', true);

    // Se forneceu IDs específicos, filtrar por eles
    if (produto_ids && Array.isArray(produto_ids) && produto_ids.length > 0) {
      query = query.in('id', produto_ids);
      console.log(`Vinculando ${produto_ids.length} produtos específicos`);
    } else {
      console.log('Vinculando TODOS os produtos ativos');
    }

    const { data: produtos, error: produtosError } = await query;

    if (produtosError) {
      console.error('Erro ao buscar produtos:', produtosError);
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar produtos',
        details: produtosError.message,
      }, { status: 500 });
    }

    if (!produtos || produtos.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum produto ativo encontrado',
        detalhes: {
          produtos: 0,
          revendedoras: revendedoras.length,
          vinculacoes_novas: 0,
          vinculacoes_atualizadas: 0,
        },
      }, { status: 400 });
    }

    console.log(`${produtos.length} produtos encontrados`);

    // 3. Buscar vinculações existentes
    const { data: existingLinks } = await supabase
      .from('reseller_products')
      .select('reseller_id, product_id, margin_percent, is_active')
      .in('product_id', produtos.map(p => p.id));

    // Criar mapa de vinculações existentes
    const existingMap = new Map<string, { margin_percent: number | null; is_active: boolean }>();
    existingLinks?.forEach(link => {
      const key = `${link.reseller_id}-${link.product_id}`;
      existingMap.set(key, {
        margin_percent: link.margin_percent,
        is_active: link.is_active,
      });
    });

    // 4. Criar registros de vinculação
    const vinculacoes = [];
    let vinculacoesNovas = 0;
    let vinculacoesAtualizadas = 0;

    for (const produto of produtos) {
      for (const revendedora of revendedoras) {
        const key = `${revendedora.id}-${produto.id}`;
        const existing = existingMap.get(key);
        
        if (existing) {
          vinculacoesAtualizadas++;
        } else {
          vinculacoesNovas++;
        }

        vinculacoes.push({
          reseller_id: revendedora.id,
          product_id: produto.id,
          // Preserva margem existente, ou usa null para nova (revendedora define depois)
          margin_percent: existing?.margin_percent ?? null,
          // Produto começa desativado para revendedora definir margem primeiro
          is_active: existing?.is_active ?? false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    console.log(`Processando ${vinculacoes.length} vinculações (${vinculacoesNovas} novas, ${vinculacoesAtualizadas} atualizações)...`);

    // 5. Inserir/atualizar vinculações em lotes (para evitar timeout)
    const BATCH_SIZE = 500;
    let processadas = 0;
    
    for (let i = 0; i < vinculacoes.length; i += BATCH_SIZE) {
      const batch = vinculacoes.slice(i, i + BATCH_SIZE);
      
      const { error: vinculacaoError } = await supabase
        .from('reseller_products')
        .upsert(batch, {
          onConflict: 'reseller_id,product_id',
          ignoreDuplicates: false,
        });

      if (vinculacaoError) {
        console.error('Erro ao criar vinculações (lote):', vinculacaoError);
        return NextResponse.json({
          success: false,
          error: 'Erro ao criar vinculações',
          details: vinculacaoError.message,
          processadas,
        }, { status: 500 });
      }
      
      processadas += batch.length;
    }

    // 6. Atualizar contadores das revendedoras
    console.log('Atualizando contadores...');
    
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

    console.log('Vinculação concluída com sucesso!');

    return NextResponse.json({
      success: true,
      message: `${vinculacoes.length} vinculações processadas`,
      detalhes: {
        produtos: produtos.length,
        revendedoras: revendedoras.length,
        vinculacoes: vinculacoes.length,
        vinculacoes_novas: vinculacoesNovas,
        vinculacoes_atualizadas: vinculacoesAtualizadas,
      },
    });

  } catch (error) {
    console.error('Erro inesperado:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao processar requisição',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}
