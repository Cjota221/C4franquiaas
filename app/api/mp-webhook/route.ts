/**
 * API Route: Webhook de Notificação do Mercado Pago
 * 
 * Endpoint: POST /api/mp-webhook
 * 
 * Recebe notificações do Mercado Pago sobre mudanças de status
 * de pagamento e atualiza o pedido no banco de dados.
 * 
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getMercadoPagoCredentials } from '@/lib/utils/mp-credentials';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Valida a assinatura do webhook (x-signature)
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks#validar-origem
 */
function _validateSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  secret: string
): boolean {
  try {
    // Extrair ts e hash do header x-signature
    const parts = xSignature.split(',');
    const tsMatch = parts[0]?.match(/ts=(\d+)/);
    const hashMatch = parts[1]?.match(/v1=([a-f0-9]+)/);

    if (!tsMatch || !hashMatch) {
      console.error('❌ [MP Webhook] Formato de assinatura inválido');
      return false;
    }

    const ts = tsMatch[1];
    const hash = hashMatch[1];

    // Montar template de validação conforme doc do MP
    const template = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
    
    // Gerar HMAC SHA256
    const hmac = crypto
      .createHmac('sha256', secret)
      .update(template)
      .digest('hex');

    // Comparar hashes
    const isValid = hmac === hash;
    
    if (!isValid) {
      console.error('❌ [MP Webhook] Assinatura inválida');
      console.error('Expected:', hmac);
      console.error('Received:', hash);
    }

    return isValid;
  } catch (error) {
    console.error('❌ [MP Webhook] Erro ao validar assinatura:', error);
    return false;
  }
}

/**
 * Busca detalhes do pagamento na API do MP
 */
async function getPaymentDetails(paymentId: string, accessToken: string) {
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Erro ao buscar pagamento: ${response.status}`);
  }

  return response.json();
}

/**
 * POST /api/mp-webhook
 * Processa notificações do Mercado Pago
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔔 [MP Webhook] Notificação recebida:', JSON.stringify(body, null, 2));

    // Headers de validação
    const _xSignature = request.headers.get('x-signature');
    const _xRequestId = request.headers.get('x-request-id');

    // 1. Extrair dados da notificação
    const { action, data, type } = body;

    // Ignorar notificações que não sejam de pagamento
    if (type !== 'payment' && action !== 'payment.created' && action !== 'payment.updated') {
      console.log('⏭️ [MP Webhook] Tipo de notificação ignorado:', type, action);
      return NextResponse.json({ received: true });
    }

    const paymentId = data?.id;

    if (!paymentId) {
      console.error('❌ [MP Webhook] Payment ID não encontrado');
      return NextResponse.json({ error: 'Payment ID ausente' }, { status: 400 });
    }

    // 2. Validar assinatura (IMPORTANTE para segurança)
    // Nota: O secret para validação pode ser obtido no painel do MP ou usar o Access Token
    // Por ora, vamos pular validação em ambiente de teste
    // if (xSignature && xRequestId) {
    //   const secret = 'SEU_SECRET_DO_MP'; // Obter do painel do MP
    //   const isValid = validateSignature(xSignature, xRequestId, paymentId, secret);
    //   
    //   if (!isValid) {
    //     return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    //   }
    // }

    console.log(`💳 [MP Webhook] Processando pagamento: ${paymentId}`);

    // 3. Buscar detalhes do pagamento na API do MP
    const credentials = await getMercadoPagoCredentials();
    const payment = await getPaymentDetails(paymentId, credentials.accessToken);

    console.log(`📊 [MP Webhook] Status do pagamento: ${payment.status}`);
    console.log(`📝 [MP Webhook] External Reference: ${payment.external_reference}`);

    // 4. Buscar pedido no banco de dados
    const { data: pedido, error: pedidoError } = await supabase
      .from('pedidos')
      .select('*')
      .eq('mp_payment_id', paymentId)
      .or(`mp_preference_id.eq.${payment.preference_id},id.eq.${payment.external_reference}`)
      .single();

    if (pedidoError || !pedido) {
      console.warn('⚠️ [MP Webhook] Pedido não encontrado para payment:', paymentId);
      // Mesmo assim retorna 200 para não reprocessar
      return NextResponse.json({ received: true });
    }

    console.log(`📦 [MP Webhook] Pedido encontrado: ${pedido.id}`);

    // 5. Atualizar status do pedido baseado no status do pagamento
    let novoStatus = pedido.status;
    let pagoEm = pedido.pago_em;

    switch (payment.status) {
      case 'approved':
        novoStatus = 'PAGO';
        pagoEm = new Date().toISOString();
        console.log('✅ [MP Webhook] Pagamento APROVADO!');
        break;
      
      case 'pending':
      case 'in_process':
        novoStatus = 'AGUARDANDO_PAGAMENTO';
        console.log('⏳ [MP Webhook] Pagamento PENDENTE');
        break;
      
      case 'rejected':
      case 'cancelled':
        novoStatus = 'CANCELADO';
        console.log('❌ [MP Webhook] Pagamento RECUSADO/CANCELADO');
        break;
      
      case 'refunded':
      case 'charged_back':
        novoStatus = 'CANCELADO';
        console.log('🔄 [MP Webhook] Pagamento REEMBOLSADO');
        break;
    }

    // 6. Atualizar pedido no banco
    const { error: updateError } = await supabase
      .from('pedidos')
      .update({
        status: novoStatus,
        mp_payment_id: paymentId,
        mp_status: payment.status,
        metodo_pagamento: payment.payment_type_id,
        pago_em: pagoEm,
        updated_at: new Date().toISOString(),
      })
      .eq('id', pedido.id);

    if (updateError) {
      console.error('❌ [MP Webhook] Erro ao atualizar pedido:', updateError);
      return NextResponse.json({ error: 'Erro ao atualizar pedido' }, { status: 500 });
    }

    console.log('✅ [MP Webhook] Pedido atualizado com sucesso!');

    // 7. Se pagamento aprovado, pode gerar etiqueta Melhor Envio (futuro)
    if (payment.status === 'approved') {
      console.log('📦 [MP Webhook] TODO: Gerar etiqueta Melhor Envio quando implementado');
      
      // TODO: Implementar geração de etiqueta Melhor Envio
      // await gerarEtiquetaMelhorEnvio(pedido.id);
      
      // Por enquanto, atualiza status para PROCESSANDO_ENVIO
      await supabase
        .from('pedidos')
        .update({ status: 'PROCESSANDO_ENVIO' })
        .eq('id', pedido.id);
    }

    // 8. Retornar sucesso (importante para o MP não reenviar)
    return NextResponse.json({
      success: true,
      payment_id: paymentId,
      status: payment.status,
      pedido_id: pedido.id,
    });

  } catch (error) {
    console.error('❌ [MP Webhook] Erro fatal:', error);
    
    // Retorna 200 mesmo com erro para evitar retry infinito do MP
    return NextResponse.json({
      error: 'Erro processado',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
    });
  }
}

/**
 * GET /api/mp-webhook
 * Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Mercado Pago - Webhook Receiver',
    version: '1.0.0',
  });
}
