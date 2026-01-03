/**
 * POST /api/admin/sync-vinculos
 * 
 * Sincroniza vínculos de produtos com revendedoras:
 * - Desativa vínculos de produtos inativos no master
 * - Vincula produtos novos ativos a todas as revendedoras
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    console.log('[sync-vinculos] Iniciando sincronização...');

    // 1. Desativar vínculos de produtos inativos no master
    const { data: vinculosInativos, error: errorDesat } = await supabase
      .from('reseller_products')
      .select(`
        id,
        product_id,
        produtos!inner(ativo)
      `)
      .eq('is_active', true)
      .eq('produtos.ativo', false);

    if (errorDesat) throw errorDesat;

    if (vinculosInativos && vinculosInativos.length > 0) {
      const idsParaDesativar = vinculosInativos.map(v => v.id);
      
      const { error: updateError } = await supabase
        .from('reseller_products')
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString() 
        })
        .in('id', idsParaDesativar);

      if (updateError) throw updateError;
      
      console.log(`[sync-vinculos] ✅ ${vinculosInativos.length} vínculos desativados (produtos inativos)`);
    }

    // 2. Buscar produtos ativos no master
    const { data: produtosAtivos, error: errorProd } = await supabase
      .from('produtos')
      .select('id')
      .eq('ativo', true);

    if (errorProd) throw errorProd;

    const produtoIdsAtivos = produtosAtivos?.map(p => p.id) || [];

    // 3. Buscar todas as revendedoras
    const { data: revendedoras, error: errorRev } = await supabase
      .from('resellers')
      .select('id, store_name');

    if (errorRev) throw errorRev;

    // 4. Vincular produtos faltantes
    let totalVinculados = 0;

    for (const revendedora of revendedoras || []) {
      // Produtos já vinculados
      const { data: vinculosExistentes } = await supabase
        .from('reseller_products')
        .select('product_id')
        .eq('reseller_id', revendedora.id);

      const produtosJaVinculados = new Set(vinculosExistentes?.map(v => v.product_id) || []);

      // Produtos que precisam ser vinculados
      const produtosParaVincular = produtoIdsAtivos.filter(id => !produtosJaVinculados.has(id));

      if (produtosParaVincular.length > 0) {
        const novosVinculos = produtosParaVincular.map(productId => ({
          reseller_id: revendedora.id,
          product_id: productId,
          margin_percent: 0,
          is_active: false, // Desativado até revendedora configurar margem
          linked_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('reseller_products')
          .insert(novosVinculos);

        if (insertError) {
          console.error(`[sync-vinculos] Erro ao vincular em ${revendedora.store_name}:`, insertError);
        } else {
          totalVinculados += produtosParaVincular.length;
          console.log(`[sync-vinculos] ✅ ${produtosParaVincular.length} produtos vinculados em ${revendedora.store_name}`);
        }
      }
    }

    // 5. Relatório final
    const { data: resumoFinal } = await supabase
      .from('reseller_products')
      .select('reseller_id, is_active', { count: 'exact' });

    const totalVinculosAtivos = resumoFinal?.filter(v => v.is_active).length || 0;
    const totalVinculosInativos = resumoFinal?.filter(v => !v.is_active).length || 0;

    return NextResponse.json({
      success: true,
      message: 'Sincronização concluída com sucesso',
      stats: {
        produtos_ativos_master: produtoIdsAtivos.length,
        revendedoras_total: revendedoras?.length || 0,
        vinculos_desativados: vinculosInativos?.length || 0,
        novos_vinculos_criados: totalVinculados,
        vinculos_ativos_total: totalVinculosAtivos,
        vinculos_inativos_total: totalVinculosInativos
      }
    });

  } catch (error) {
    console.error('[sync-vinculos] Erro:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido' 
      },
      { status: 500 }
    );
  }
}

// GET para verificar status
export async function GET() {
  try {
    const { count: totalProdutos } = await supabase
      .from('produtos')
      .select('id', { count: 'exact', head: true })
      .eq('ativo', true);

    const { count: totalRevendedoras } = await supabase
      .from('resellers')
      .select('id', { count: 'exact', head: true });

    const { data: vinculos } = await supabase
      .from('reseller_products')
      .select('is_active');

    const totalVinculosAtivos = vinculos?.filter(v => v.is_active).length || 0;
    const totalVinculosInativos = vinculos?.filter(v => !v.is_active).length || 0;

    return NextResponse.json({
      produtos_ativos: totalProdutos,
      revendedoras: totalRevendedoras,
      vinculos_ativos: totalVinculosAtivos,
      vinculos_inativos: totalVinculosInativos,
      vinculos_total: vinculos?.length || 0
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    );
  }
}
