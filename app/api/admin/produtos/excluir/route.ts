import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API para excluir produtos do painel admin
 * Exclui o produto e todas suas vinculações (reseller_products, etc)
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

    // 1. Buscar produtos_franqueadas para deletar preços primeiro
    const { data: franqueadas } = await supabase
      .from('produtos_franqueadas')
      .select('id')
      .in('produto_id', produto_ids);

    if (franqueadas && franqueadas.length > 0) {
      const franqueadaIds = franqueadas.map(f => f.id);
      
      // Deletar preços
      await supabase
        .from('produtos_franqueadas_precos')
        .delete()
        .in('produto_franqueada_id', franqueadaIds);
      
      console.log(`✅ Deletados preços de ${franqueadaIds.length} franqueadas`);
      
      // Deletar vinculações com franqueadas
      await supabase
        .from('produtos_franqueadas')
        .delete()
        .in('produto_id', produto_ids);
      
      console.log(`✅ Deletadas vinculações com franqueadas`);
    }

    // 2. Deletar vinculações com revendedoras
    const { error: errReseller } = await supabase
      .from('reseller_products')
      .delete()
      .in('product_id', produto_ids);

    if (errReseller) {
      console.error('❌ Erro ao deletar reseller_products:', errReseller);
    } else {
      console.log(`✅ Deletadas vinculações com revendedoras`);
    }

    // 3. Deletar categorias dos produtos
    await supabase
      .from('produto_categorias')
      .delete()
      .in('produto_id', produto_ids);
    
    console.log(`✅ Deletadas categorias dos produtos`);

    // 4. Deletar os produtos
    const { error: errProdutos, data: deletados } = await supabase
      .from('produtos')
      .delete()
      .in('id', produto_ids)
      .select('id, nome');

    if (errProdutos) {
      console.error('❌ Erro ao deletar produtos:', errProdutos);
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao excluir produtos: ' + errProdutos.message 
      }, { status: 500 });
    }

    const totalDeletados = deletados?.length || 0;
    console.log(`✅ ${totalDeletados} produtos excluídos permanentemente`);

    // 5. Registrar log
    await supabase.from('logs_sincronizacao').insert({
      tipo: 'produtos_excluidos_admin',
      descricao: `Admin excluiu ${totalDeletados} produtos manualmente`,
      payload: { 
        total: totalDeletados,
        produtos: deletados?.slice(0, 10).map(p => ({ id: p.id, nome: p.nome }))
      },
      sucesso: true,
      erro: null,
    });

    return NextResponse.json({ 
      success: true, 
      message: `${totalDeletados} produto(s) excluído(s) com sucesso`,
      total: totalDeletados
    });

  } catch (error) {
    console.error('❌ Erro na API de exclusão:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno ao excluir produtos' 
    }, { status: 500 });
  }
}
