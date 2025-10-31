// Lightweight local types to avoid requiring '@netlify/functions' types in this environment
type NetlifyEvent = {
  httpMethod: string;
  body?: string | null;
  headers?: Record<string, string>;
  // add other fields if you need them (e.g., path, queryStringParameters, etc.)
};

type NetlifyResult = {
  statusCode: number;
  body: string;
};

type Handler = (event: NetlifyEvent) => Promise<NetlifyResult>;

import { createClient } from '@supabase/supabase-js';

// Criar cliente Supabase com service role (bypassa RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Webhook do Mercado Pago para notificações de pagamento
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
export const handler: Handler = async (event) => {
  console.log('🔔 [Webhook MP] Função chamada');
  console.log('📦 [Webhook MP] Method:', event.httpMethod);
  
  // Permitir GET para validação do webhook
  if (event.httpMethod === 'GET') {
    console.log('✅ [Webhook MP] GET request - validação OK');
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'ok',
        message: 'Webhook Mercado Pago endpoint is running'
      })
    };
  }

  // Processar apenas POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Pegar dados do webhook
    const body = JSON.parse(event.body || '{}');
    console.log('📦 [Webhook MP] Body:', JSON.stringify(body, null, 2));

    // Verificar tipo de notificação
    const { type, data } = body;

    // Apenas processar notificações de pagamento
    if (type !== 'payment') {
      console.log('⚠️ [Webhook MP] Tipo ignorado:', type);
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true })
      };
    }

    // Pegar ID do pagamento
    const paymentId = data?.id;
    if (!paymentId) {
      console.error('❌ [Webhook MP] Payment ID não encontrado');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Payment ID missing' })
      };
    }

    console.log('💳 [Webhook MP] Payment ID:', paymentId);

    // Buscar detalhes do pagamento no Mercado Pago
    const paymentDetails = await fetchPaymentDetails(paymentId);
    console.log('📋 [Webhook MP] Detalhes do pagamento:', JSON.stringify(paymentDetails, null, 2));

    // Atualizar venda no banco de dados
    await updateVendaStatus(paymentId, paymentDetails);

    return {
      statusCode: 200,
      body: JSON.stringify({ received: true, processed: true })
    };

  } catch (error) {
    console.error('❌ [Webhook MP] Erro:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

/**
 * Buscar detalhes do pagamento na API do Mercado Pago
 */
async function fetchPaymentDetails(paymentId: string) {
  const accessToken = process.env.MP_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error('MP_ACCESS_TOKEN não configurado');
  }

  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar pagamento: ${response.status}`);
  }

  return await response.json();
}

/**
 * Atualizar status da venda no banco de dados
 */
async function updateVendaStatus(paymentId: string, paymentDetails: Record<string, unknown>) {
  const { status, status_detail, payment_method_id } = paymentDetails;

  console.log('🔄 [Webhook MP] Atualizando venda...');
  console.log('  Payment ID:', paymentId);
  console.log('  Status:', status);
  console.log('  Status Detail:', status_detail);
  console.log('  Payment Method:', payment_method_id);

  // Buscar venda pelo mp_payment_id
  const { data: venda, error: vendaError } = await supabaseAdmin
    .from('vendas')
    .select('*')
    .eq('mp_payment_id', paymentId.toString())
    .single();

  if (vendaError || !venda) {
    console.error('❌ [Webhook MP] Venda não encontrada:', vendaError);
    throw new Error('Venda não encontrada');
  }

  console.log('✅ [Webhook MP] Venda encontrada:', venda.id);

  // Atualizar status da venda
  const { error: updateError } = await supabaseAdmin
    .from('vendas')
    .update({
      status_pagamento: status,
      mp_status_detail: status_detail,
      metodo_pagamento: payment_method_id,
      updated_at: new Date().toISOString()
    })
    .eq('id', venda.id);

  if (updateError) {
    console.error('❌ [Webhook MP] Erro ao atualizar venda:', updateError);
    throw updateError;
  }

  console.log('✅ [Webhook MP] Venda atualizada com sucesso');

  // Se pagamento aprovado, dar baixa no estoque
  if (status === 'approved') {
    console.log('💰 [Webhook MP] Pagamento APROVADO! Dando baixa no estoque...');
    await darBaixaNoEstoque(venda);
  } else if (status === 'rejected' || status === 'cancelled') {
    console.log('❌ [Webhook MP] Pagamento RECUSADO/CANCELADO');
  } else {
    console.log('⏳ [Webhook MP] Pagamento em processamento:', status);
  }
}

/**
 * Dar baixa no estoque dos produtos vendidos
 */
async function darBaixaNoEstoque(venda: Record<string, unknown>) {
  const items = venda.items as Array<{
    id: string;
    nome: string;
    tamanho: string;
    sku: string;
    quantidade: number;
  }>;

  console.log('📦 [Webhook MP] Dando baixa em', items.length, 'itens');

  for (const item of items) {
    console.log(`  - ${item.nome} (Tamanho: ${item.tamanho}, Qtd: ${item.quantidade})`);

    // Buscar variação do produto
    const { data: produto, error: produtoError } = await supabaseAdmin
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

    // Atualizar estoque
    const variacaoAtual = variacoes[variacaoIndex];
    const novoEstoque = Math.max(0, (variacaoAtual.estoque || 0) - item.quantidade);

    variacoes[variacaoIndex] = {
      ...variacaoAtual,
      estoque: novoEstoque,
      disponivel: novoEstoque > 0
    };

    // Salvar no banco
    const { error: updateEstoqueError } = await supabaseAdmin
      .from('produtos')
      .update({ variacoes })
      .eq('id', item.id);

    if (updateEstoqueError) {
      console.error(`❌ Erro ao atualizar estoque do produto ${item.id}:`, updateEstoqueError);
    } else {
      console.log(`✅ Estoque atualizado: ${variacaoAtual.estoque} → ${novoEstoque}`);
    }
  }

  console.log('🎉 [Webhook MP] Baixa no estoque concluída!');
}
