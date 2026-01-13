import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API para excluir produtos do painel admin
 * Exclui o produto e todas suas vinculações (reseller_products, etc)
 * OTIMIZADO: Processa em lotes para evitar timeout
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

    console.log(`🗑️ Excluindo ${produto_ids.length} produtos...`);

    // Processar em lotes de 50 para evitar timeout
    const BATCH_SIZE = 50;
    let totalDeletados = 0;
    const erros: string[] = [];

    for (let i = 0; i < produto_ids.length; i += BATCH_SIZE) {
      const batch = produto_ids.slice(i, i + BATCH_SIZE);
      console.log(`📦 Processando lote ${Math.floor(i/BATCH_SIZE) + 1} (${batch.length} produtos)`);

      try {
        // 1. Deletar vinculações com revendedoras (mais simples primeiro)
        await supabase
          .from('reseller_products')
          .delete()
          .in('product_id', batch);

        // 2. Deletar categorias dos produtos
        await supabase
          .from('produto_categorias')
          .delete()
          .in('produto_id', batch);

        // 3. Buscar e deletar franqueadas relacionadas
        const { data: franqueadas } = await supabase
          .from('produtos_franqueadas')
          .select('id')
          .in('produto_id', batch);

        if (franqueadas && franqueadas.length > 0) {
          const franqueadaIds = franqueadas.map(f => f.id);
          
          // Deletar preços
          await supabase
            .from('produtos_franqueadas_precos')
            .delete()
            .in('produto_franqueada_id', franqueadaIds);
          
          // Deletar vinculações
          await supabase
            .from('produtos_franqueadas')
            .delete()
            .in('produto_id', batch);
        }

        // 4. Deletar os produtos do lote
        const { error: errProdutos, data: deletados } = await supabase
          .from('produtos')
          .delete()
          .in('id', batch)
          .select('id');

        if (errProdutos) {
          erros.push(`Lote ${Math.floor(i/BATCH_SIZE) + 1}: ${errProdutos.message}`);
        } else {
          totalDeletados += deletados?.length || 0;
        }

      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido';
        erros.push(`Lote ${Math.floor(i/BATCH_SIZE) + 1}: ${msg}`);
      }
    }

    console.log(`✅ ${totalDeletados} produtos excluídos permanentemente`);

    // Registrar log (sem await para não atrasar resposta)
    supabase.from('logs_sincronizacao').insert({
      tipo: 'produtos_excluidos_admin',
      descricao: `Admin excluiu ${totalDeletados} produtos manualmente`,
      payload: { 
        total: totalDeletados,
        erros: erros.length > 0 ? erros : null
      },
      sucesso: erros.length === 0,
      erro: erros.length > 0 ? erros.join('; ') : null,
    });

    if (totalDeletados === 0 && erros.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao excluir produtos: ' + erros[0]
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `${totalDeletados} produto(s) excluído(s) com sucesso`,
      total: totalDeletados,
      erros: erros.length > 0 ? erros : undefined
    });

  } catch (error) {
    console.error('❌ Erro na API de exclusão:', error);
    const msg = error instanceof Error ? error.message : 'Erro interno';
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao excluir produtos: ' + msg
    }, { status: 500 });
  }
}
