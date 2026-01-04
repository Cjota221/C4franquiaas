import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { vendaId, motivo } = await req.json();

    if (!vendaId) {
      return NextResponse.json({ error: 'vendaId é obrigatório' }, { status: 400 });
    }

    console.log(`📦 [Cancelar Venda] Iniciando cancelamento da venda ${vendaId}`);

    // 1. Buscar dados da venda
    const { data: venda, error: vendaError } = await supabase
      .from('vendas')
      .select('*')
      .eq('id', vendaId)
      .single();

    if (vendaError || !venda) {
      console.error('[Cancelar Venda] Venda não encontrada:', vendaError);
      return NextResponse.json({ error: 'Venda não encontrada' }, { status: 404 });
    }

    // 2. Verificar se já está cancelada
    if (venda.status_pagamento === 'cancelled') {
      return NextResponse.json({ 
        error: 'Venda já está cancelada',
        message: 'Esta venda já foi cancelada anteriormente'
      }, { status: 400 });
    }

    // 3. Devolver estoque dos produtos
    const items = venda.items as Array<{
      id: string;
      nome: string;
      tamanho: string;
      sku: string;
      quantidade: number;
    }>;

    console.log(`📦 [Cancelar Venda] Devolvendo estoque de ${items.length} itens`);

    const estoqueRestaurado = [];
    
    for (const item of items) {
      console.log(`  - ${item.nome} (Tamanho: ${item.tamanho}, Qtd: ${item.quantidade})`);

      // Buscar produto
      const { data: produto, error: produtoError } = await supabase
        .from('produtos')
        .select('id, nome, variacoes')
        .eq('id', item.id)
        .single();

      if (produtoError || !produto) {
        console.error(`❌ Produto ${item.id} não encontrado:`, produtoError);
        continue;
      }

      // Encontrar variação específica
      const variacoes = produto.variacoes as Array<{
        tamanho: string;
        sku: string;
        estoque: number;
        disponivel: boolean;
      }>;

      const variacaoIndex = variacoes.findIndex(v => 
        v.tamanho === item.tamanho && v.sku === item.sku
      );

      if (variacaoIndex === -1) {
        console.error(`❌ Variação não encontrada: ${item.tamanho} / ${item.sku}`);
        continue;
      }

      // Restaurar estoque (adicionar a quantidade de volta)
      const variacaoAtual = variacoes[variacaoIndex];
      const estoqueAnterior = variacaoAtual.estoque || 0;
      const novoEstoque = estoqueAnterior + item.quantidade;

      variacoes[variacaoIndex] = {
        ...variacaoAtual,
        estoque: novoEstoque,
        disponivel: true // Sempre marcar como disponível ao devolver estoque
      };

      // Salvar no banco
      const { error: updateEstoqueError } = await supabase
        .from('produtos')
        .update({ variacoes })
        .eq('id', item.id);

      if (updateEstoqueError) {
        console.error(`❌ Erro ao restaurar estoque do produto ${item.id}:`, updateEstoqueError);
      } else {
        console.log(`✅ Estoque restaurado: ${estoqueAnterior} → ${novoEstoque}`);
        estoqueRestaurado.push({
          produto: item.nome,
          tamanho: item.tamanho,
          quantidade: item.quantidade,
          estoqueAnterior,
          estoqueNovo: novoEstoque
        });
      }
    }

    // 4. Atualizar status da venda para cancelada
    const { error: updateVendaError } = await supabase
      .from('vendas')
      .update({
        status_pagamento: 'cancelled',
        mp_status_detail: motivo || 'Cancelado manualmente pelo admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', vendaId);

    if (updateVendaError) {
      console.error('[Cancelar Venda] Erro ao atualizar status:', updateVendaError);
      return NextResponse.json({ 
        error: 'Erro ao cancelar venda',
        details: updateVendaError.message 
      }, { status: 500 });
    }

    // 5. Registrar log do cancelamento
    try {
      await supabase.from('logs_cancelamento').insert({
        venda_id: vendaId,
        motivo: motivo || 'Cancelado manualmente',
        itens_restaurados: estoqueRestaurado,
        cancelado_por: 'admin',
        cancelado_em: new Date().toISOString()
      });
    } catch (logError) {
      console.error('[Cancelar Venda] Erro ao registrar log (não crítico):', logError);
    }

    console.log('✅ [Cancelar Venda] Venda cancelada e estoque restaurado com sucesso');

    return NextResponse.json({
      success: true,
      message: 'Venda cancelada e estoque restaurado com sucesso',
      estoqueRestaurado
    });

  } catch (error) {
    console.error('[Cancelar Venda] Erro:', error);
    return NextResponse.json(
      { error: 'Erro interno ao cancelar venda', details: String(error) },
      { status: 500 }
    );
  }
}
