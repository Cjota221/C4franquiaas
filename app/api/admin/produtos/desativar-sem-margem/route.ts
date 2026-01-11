import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/**
 * GET /api/admin/produtos/desativar-sem-margem
 * 
 * Preview: Retorna quantos produtos serão afetados por revendedora
 * (não faz alterações)
 */
export async function GET() {
  try {
    // 1. Buscar todos os produtos ATIVOS que estão sem margem
    const { data: produtosSemMargem, error: errorProdutos } = await supabaseAdmin
      .from('reseller_products')
      .select(`
        id,
        reseller_id,
        product_id,
        margin_percent,
        custom_price,
        is_active,
        resellers!inner (
          id,
          store_name,
          slug,
          status,
          is_active
        ),
        produtos!inner (
          id,
          nome
        )
      `)
      .eq('is_active', true) // Apenas produtos ATIVOS na revendedora
      .or('margin_percent.is.null,margin_percent.eq.0');

    if (errorProdutos) {
      console.error('Erro ao buscar produtos sem margem:', errorProdutos);
      throw errorProdutos;
    }

    // Filtrar apenas onde custom_price também é null/0
    const produtosParaDesativar = (produtosSemMargem || []).filter(p => {
      // Se tem custom_price válido (> 0), não desativa
      if (p.custom_price && p.custom_price > 0) return false;
      return true;
    });

    // 2. Agrupar por revendedora
    const porRevendedora: Record<string, {
      revendedora_id: string;
      store_name: string;
      slug: string;
      status: string;
      is_active: boolean;
      produtos: Array<{ id: string; nome: string; product_id: string }>;
    }> = {};

    for (const item of produtosParaDesativar) {
      // Supabase returns arrays for relations, get first element
      const resellersArr = item.resellers as Array<{ id: string; store_name: string; slug: string; status: string; is_active: boolean }>;
      const produtosArr = item.produtos as Array<{ id: string; nome: string }>;
      
      const revendedora = resellersArr?.[0];
      const produto = produtosArr?.[0];
      
      if (!revendedora) continue;
      
      if (!porRevendedora[revendedora.id]) {
        porRevendedora[revendedora.id] = {
          revendedora_id: revendedora.id,
          store_name: revendedora.store_name,
          slug: revendedora.slug,
          status: revendedora.status,
          is_active: revendedora.is_active,
          produtos: [],
        };
      }

      porRevendedora[revendedora.id].produtos.push({
        id: item.id,
        nome: produto?.nome || 'Produto não encontrado',
        product_id: item.product_id,
      });
    }

    // 3. Estatísticas
    const revendedorasAfetadas = Object.keys(porRevendedora).length;
    const totalProdutos = produtosParaDesativar.length;

    return NextResponse.json({
      success: true,
      preview: true,
      stats: {
        revendedoras_afetadas: revendedorasAfetadas,
        total_produtos: totalProdutos,
      },
      detalhes: Object.values(porRevendedora).map(r => ({
        ...r,
        quantidade_produtos: r.produtos.length,
      })),
    });

  } catch (error) {
    console.error('Erro ao fazer preview:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}

/**
 * POST /api/admin/produtos/desativar-sem-margem
 * 
 * Executa a desativação de produtos sem margem
 * Body: { confirmar: true } - obrigatório para executar
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.confirmar) {
      return NextResponse.json({
        success: false,
        error: 'Confirmação necessária. Envie { "confirmar": true } no body.',
      }, { status: 400 });
    }

    console.log('[Desativar Sem Margem] Iniciando...');

    // 1. Buscar produtos ATIVOS sem margem
    const { data: produtosSemMargem, error: errorProdutos } = await supabaseAdmin
      .from('reseller_products')
      .select(`
        id,
        reseller_id,
        product_id,
        margin_percent,
        custom_price,
        is_active,
        resellers (
          id,
          store_name
        )
      `)
      .eq('is_active', true)
      .or('margin_percent.is.null,margin_percent.eq.0');

    if (errorProdutos) {
      throw errorProdutos;
    }

    // Filtrar onde custom_price também é null/0
    const produtosParaDesativar = (produtosSemMargem || []).filter(p => {
      if (p.custom_price && p.custom_price > 0) return false;
      return true;
    });

    if (produtosParaDesativar.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum produto para desativar',
        stats: {
          desativados: 0,
          revendedoras_afetadas: 0,
        },
      });
    }

    // 2. Criar backup/log antes de desativar
    const backupLog = produtosParaDesativar.map(p => ({
      reseller_product_id: p.id,
      reseller_id: p.reseller_id,
      product_id: p.product_id,
      margin_percent_antes: p.margin_percent,
      custom_price_antes: p.custom_price,
      is_active_antes: p.is_active,
      desativado_em: new Date().toISOString(),
      motivo: 'sem_margem_lucro',
    }));

    console.log(`[Backup] ${backupLog.length} registros serão desativados`);

    // Tentar salvar backup (se tabela existir)
    try {
      await supabaseAdmin
        .from('audit_log')
        .insert({
          action: 'desativar_produtos_sem_margem',
          data: JSON.stringify(backupLog),
          created_at: new Date().toISOString(),
        });
    } catch {
      // Tabela pode não existir, apenas loga
      console.log('[Backup] Tabela audit_log não existe, prosseguindo sem backup');
    }

    // 3. Desativar em lotes
    const ids = produtosParaDesativar.map(p => p.id);
    const BATCH_SIZE = 100;
    let desativados = 0;

    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      
      const { error: updateError } = await supabaseAdmin
        .from('reseller_products')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .in('id', batch);

      if (updateError) {
        console.error(`Erro no lote ${i / BATCH_SIZE + 1}:`, updateError);
        throw updateError;
      }

      desativados += batch.length;
    }

    // 4. Contar revendedoras afetadas
    const revendedorasAfetadas = new Set(produtosParaDesativar.map(p => p.reseller_id)).size;

    // 5. Log por revendedora
    const logPorRevendedora: Record<string, number> = {};
    for (const p of produtosParaDesativar) {
      const resellersArr = p.resellers as Array<{ store_name: string }> | null;
      const revendedora = resellersArr?.[0];
      const nome = revendedora?.store_name || p.reseller_id;
      logPorRevendedora[nome] = (logPorRevendedora[nome] || 0) + 1;
    }

    console.log('[Desativar Sem Margem] Concluído!');
    console.log('Por revendedora:', logPorRevendedora);

    return NextResponse.json({
      success: true,
      message: `${desativados} produtos desativados com sucesso`,
      stats: {
        desativados,
        revendedoras_afetadas: revendedorasAfetadas,
      },
      log_por_revendedora: logPorRevendedora,
    });

  } catch (error) {
    console.error('Erro ao desativar produtos:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}
