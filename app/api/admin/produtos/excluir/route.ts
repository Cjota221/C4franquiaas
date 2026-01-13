import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * API para excluir produtos do painel admin
 * USA FUNÇÃO DO BANCO para evitar timeout
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

    console.log(`🗑️ Excluindo ${produto_ids.length} produtos via função do banco...`);

    // Chamar função do banco que faz tudo de forma otimizada
    const { data, error } = await supabase.rpc('excluir_produtos_completo', {
      produto_ids: produto_ids
    });

    if (error) {
      console.error('❌ Erro na função:', error);
      
      // Se a função não existir, tenta o método antigo (um por vez)
      if (error.message.includes('does not exist')) {
        return await excluirManualmente(supabase, produto_ids);
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao excluir: ' + error.message
      }, { status: 500 });
    }

    console.log(`✅ Resultado:`, data);

    // Log assíncrono
    supabase.from('logs_sincronizacao').insert({
      tipo: 'produtos_excluidos_admin',
      descricao: `Admin excluiu ${data?.total_excluidos || produto_ids.length} produtos`,
      payload: { total: data?.total_excluidos || produto_ids.length },
      sucesso: true,
      erro: null,
    });

    return NextResponse.json({ 
      success: true, 
      message: `${data?.total_excluidos || produto_ids.length} produto(s) excluído(s)`,
      total: data?.total_excluidos || produto_ids.length
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

// Fallback: excluir manualmente se a função não existir
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function excluirManualmente(supabase: any, produto_ids: string[]) {
  console.log('⚠️ Função não existe, usando método manual...');
  
  let totalDeletados = 0;
  const erros: string[] = [];

  for (const produtoId of produto_ids) {
    try {
      // 🚫 Primeiro, buscar id_externo e guardar na tabela de excluídos
      const { data: produto } = await supabase
        .from('produtos')
        .select('id_externo')
        .eq('id', produtoId)
        .maybeSingle();
      
      if (produto?.id_externo) {
        await supabase.from('produtos_excluidos').upsert({
          id_externo: produto.id_externo,
          excluido_em: new Date().toISOString(),
          excluido_por: 'admin'
        }, { onConflict: 'id_externo' });
      }
      
      await supabase.from('reseller_products').delete().eq('product_id', produtoId);
      await supabase.from('produto_categorias').delete().eq('produto_id', produtoId);
      
      const { data: franqueada } = await supabase
        .from('produtos_franqueadas')
        .select('id')
        .eq('produto_id', produtoId)
        .maybeSingle();

      if (franqueada) {
        await supabase.from('produtos_franqueadas_precos').delete().eq('produto_franqueada_id', franqueada.id);
        await supabase.from('produtos_franqueadas').delete().eq('produto_id', produtoId);
      }

      const { error } = await supabase.from('produtos').delete().eq('id', produtoId);
      
      if (!error) totalDeletados++;
      else erros.push(`${produtoId}: ${error.message}`);
    } catch (err) {
      erros.push(`${produtoId}: ${err instanceof Error ? err.message : 'erro'}`);
    }
  }

  if (totalDeletados === 0) {
    return NextResponse.json({ 
      success: false, 
      error: erros[0] || 'Nenhum produto excluído'
    }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    message: `${totalDeletados} produto(s) excluído(s)`,
    total: totalDeletados
  });
}
