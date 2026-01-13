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

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🗑️ INICIANDO EXCLUSÃO DE PRODUTOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total de produtos a excluir: ${produto_ids.length}`);
    console.log(`🔑 IDs dos produtos:`, produto_ids);
    console.log('');

    // 🔍 VERIFICAR SE OS PRODUTOS EXISTEM ANTES DE EXCLUIR
    console.log('🔍 Verificando se os produtos existem no banco...');
    const { data: produtosExistentes, error: errVerifica } = await supabase
      .from('produtos')
      .select('id, nome, id_externo, ativo')
      .in('id', produto_ids);
    
    if (errVerifica) {
      console.error('❌ Erro ao verificar produtos:', errVerifica);
    } else {
      console.log(`✅ Encontrados ${produtosExistentes?.length || 0} produtos no banco:`);
      produtosExistentes?.forEach((p: { id: string; nome: string; id_externo: string; ativo: boolean }) => {
        console.log(`   - ${p.nome} (ID: ${p.id}, Externo: ${p.id_externo}, Ativo: ${p.ativo})`);
      });
    }
    console.log('');

    // Chamar função do banco que faz tudo de forma otimizada
    console.log('📞 Chamando função excluir_produtos_completo...');
    const { data, error } = await supabase.rpc('excluir_produtos_completo', {
      produto_ids: produto_ids
    });

    if (error) {
      console.error('❌ ERRO NA FUNÇÃO:', error);
      console.error('   Código:', error.code);
      console.error('   Mensagem:', error.message);
      console.error('   Detalhes:', error.details);
      
      // Se a função não existir, tenta o método antigo (um por vez)
      if (error.message.includes('does not exist')) {
        return await excluirManualmente(supabase, produto_ids);
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao excluir: ' + error.message
      }, { status: 500 });
    }

    console.log('');
    console.log('✅ RESULTADO DA FUNÇÃO:');
    console.log('   Success:', data?.success);
    console.log('   Total excluídos:', data?.total_excluidos);
    console.log('   Erro:', data?.error);
    console.log('   Payload completo:', JSON.stringify(data, null, 2));
    console.log('');

    // 🔍 VERIFICAR SE OS PRODUTOS FORAM REALMENTE EXCLUÍDOS
    console.log('🔍 Verificando se os produtos ainda existem após exclusão...');
    const { data: produtosAposExcluir, error: errVerifica2 } = await supabase
      .from('produtos')
      .select('id, nome, ativo')
      .in('id', produto_ids);
    
    if (errVerifica2) {
      console.error('❌ Erro ao verificar produtos após exclusão:', errVerifica2);
    } else {
      if (produtosAposExcluir && produtosAposExcluir.length > 0) {
        console.warn('⚠️ PRODUTOS AINDA EXISTEM NO BANCO APÓS EXCLUSÃO:');
        produtosAposExcluir.forEach((p: { id: string; nome: string; ativo: boolean }) => {
          console.warn(`   - ${p.nome} (ID: ${p.id}, Ativo: ${p.ativo})`);
        });
      } else {
        console.log('✅ Produtos excluídos com sucesso! Nenhum produto encontrado.');
      }
    }
    console.log('');

    // 🔍 VERIFICAR SE FOI REGISTRADO NA TABELA DE EXCLUÍDOS
    console.log('🔍 Verificando tabela produtos_excluidos...');
    const { data: excluidos } = await supabase
      .from('produtos_excluidos')
      .select('*')
      .order('excluido_em', { ascending: false })
      .limit(5);
    
    console.log('   Últimos 5 registros na tabela produtos_excluidos:');
    excluidos?.forEach((e: { id_externo: string; excluido_por: string; excluido_em: string }) => {
      console.log(`   - ID Externo: ${e.id_externo}, Por: ${e.excluido_por}, Em: ${e.excluido_em}`);
    });
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏁 FIM DO PROCESSO DE EXCLUSÃO');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Log assíncrono
    supabase.from('logs_sincronizacao').insert({
      tipo: 'produtos_excluidos_admin',
      descricao: `Admin excluiu ${data?.total_excluidos || produto_ids.length} produtos`,
      payload: { 
        total: data?.total_excluidos || produto_ids.length,
        produto_ids: produto_ids,
        ainda_existem: produtosAposExcluir?.length || 0
      },
      sucesso: true,
      erro: null,
    });

    return NextResponse.json({ 
      success: true, 
      message: `${data?.total_excluidos || produto_ids.length} produto(s) excluído(s)`,
      total: data?.total_excluidos || produto_ids.length,
      debug: {
        produtos_ainda_existem: produtosAposExcluir?.length || 0,
        ids_nao_excluidos: produtosAposExcluir?.map((p: { id: string }) => p.id) || []
      }
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
