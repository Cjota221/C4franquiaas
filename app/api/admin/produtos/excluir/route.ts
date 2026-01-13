import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API para excluir produtos do painel admin
 * OTIMIZADO: Processa UM produto por vez para evitar timeout do Supabase
 */
export async function POST(req: NextRequest) {
  try {
    const { produto_ids } = await req.json();

    if (!produto_ids || !Array.isArray(produto_ids) || produto_ids.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nenhum produto informado' 
      }, { status: 400 });
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return NextResponse.json({ 
        success: false, 
        error: 'Configuração ausente' 
      }, { status: 500 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    console.log(`🗑️ Excluindo ${produto_ids.length} produtos (um por vez)...`);

    let totalDeletados = 0;
    const erros: string[] = [];

    // Processar UM produto por vez para evitar timeout
    for (const produtoId of produto_ids) {
      try {
        // 1. Deletar vinculação com revendedoras
        await supabase
          .from('reseller_products')
          .delete()
          .eq('product_id', produtoId);

        // 2. Deletar categorias
        await supabase
          .from('produto_categorias')
          .delete()
          .eq('produto_id', produtoId);

        // 3. Buscar franqueada vinculada
        const { data: franqueada } = await supabase
          .from('produtos_franqueadas')
          .select('id')
          .eq('produto_id', produtoId)
          .maybeSingle();

        if (franqueada) {
          // Deletar preço
          await supabase
            .from('produtos_franqueadas_precos')
            .delete()
            .eq('produto_franqueada_id', franqueada.id);
          
          // Deletar vinculação
          await supabase
            .from('produtos_franqueadas')
            .delete()
            .eq('produto_id', produtoId);
        }

        // 4. Deletar o produto
        const { error } = await supabase
          .from('produtos')
          .delete()
          .eq('id', produtoId);

        if (error) {
          erros.push(`Produto ${produtoId}: ${error.message}`);
        } else {
          totalDeletados++;
        }

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro';
        erros.push(`Produto ${produtoId}: ${msg}`);
      }
    }

    console.log(`✅ ${totalDeletados}/${produto_ids.length} produtos excluídos`);

    // Log assíncrono
    supabase.from('logs_sincronizacao').insert({
      tipo: 'produtos_excluidos_admin',
      descricao: `Admin excluiu ${totalDeletados} produtos`,
      payload: { total: totalDeletados, erros: erros.length > 0 ? erros : null },
      sucesso: totalDeletados > 0,
      erro: erros.length > 0 ? erros.slice(0, 5).join('; ') : null,
    });

    if (totalDeletados === 0) {
      return NextResponse.json({ 
        success: false, 
        error: erros[0] || 'Nenhum produto foi excluído'
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `${totalDeletados} produto(s) excluído(s)`,
      total: totalDeletados,
      erros: erros.length > 0 ? erros : undefined
    });

  } catch (error) {
    console.error('❌ Erro:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao excluir: ' + msg
    }, { status: 500 });
  }
}
