import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Webhook do Melhor Envio
 * POST /api/envios/webhook
 * 
 * Recebe notificações automáticas de mudança de status
 * 
 * Eventos possíveis:
 * - order.created
 * - order.paid
 * - order.generated
 * - order.posted
 * - order.delivered
 * - order.canceled
 * - tracking.update
 */
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    console.log('[Webhook Melhor Envio] Evento recebido:', payload.event);
    console.log('[Webhook Melhor Envio] Dados:', JSON.stringify(payload, null, 2));

    const { event, data } = payload;

    if (!event || !data) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    // Buscar envio pelo order_id do Melhor Envio
    const melhorenvioOrderId = data.id || data.order_id;

    const { data: envio, error: envioError } = await supabase
      .from('pedidos_envio')
      .select(`
        *,
        pedido:pedidos(
          id,
          numero_pedido,
          nome_cliente,
          email,
          telefone
        )
      `)
      .eq('melhorenvio_order_id', melhorenvioOrderId)
      .single();

    if (envioError || !envio) {
      console.warn('[Webhook Melhor Envio] Envio não encontrado:', melhorenvioOrderId);
      return NextResponse.json({ error: 'Envio não encontrado' }, { status: 404 });
    }

    // Processar evento
    switch (event) {
      case 'order.paid':
        await handleOrderPaid(envio);
        break;

      case 'order.generated':
        await handleOrderGenerated(envio, data);
        break;

      case 'order.posted':
        await handleOrderPosted(envio);
        break;

      case 'order.delivered':
        await handleOrderDelivered(envio);
        break;

      case 'order.canceled':
        await handleOrderCanceled(envio);
        break;

      case 'tracking.update':
        await handleTrackingUpdate(envio, data);
        break;

      default:
        console.log('[Webhook Melhor Envio] Evento não tratado:', event);
    }

    return NextResponse.json({ success: true, message: 'Webhook processado' });
  } catch (error: unknown) {
    console.error('[Webhook Melhor Envio] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}

// ========================================
// HANDLERS DE EVENTOS
// ========================================

async function handleOrderPaid(envio: Record<string, unknown>) {
  console.log('[Webhook] Order Paid:', envio.id);

  await supabase
    .from('pedidos_envio')
    .update({ status_envio: 'paid' })
    .eq('id', envio.id);

  await registrarEvento(envio.id as string, 'paid', 'Pagamento confirmado no Melhor Envio');
}

async function handleOrderGenerated(envio: Record<string, unknown>, data: Record<string, unknown>) {
  console.log('[Webhook] Order Generated:', envio.id);

  const updates: Record<string, unknown> = {
    status_envio: 'generated',
    etiqueta_gerada_em: new Date().toISOString(),
  };

  if (data.tracking) {
    updates.codigo_rastreio = data.tracking;
  }

  if (data.protocol) {
    updates.melhorenvio_protocol = data.protocol;
  }

  await supabase
    .from('pedidos_envio')
    .update(updates)
    .eq('id', envio.id);

  await registrarEvento(envio.id as string, 'generated', 'Etiqueta de envio gerada');

  // Notificar cliente
  await enviarNotificacao(envio, 'etiqueta_gerada');
}

async function handleOrderPosted(envio: Record<string, unknown>) {
  console.log('[Webhook] Order Posted:', envio.id);

  await supabase
    .from('pedidos_envio')
    .update({
      status_envio: 'posted',
      data_postagem: new Date().toISOString(),
    })
    .eq('id', envio.id);

  await registrarEvento(envio.id as string, 'posted', 'Pedido postado nos Correios/Transportadora');

  // Atualizar status do pedido principal
  await supabase
    .from('pedidos')
    .update({ status_pagamento: 'enviado' })
    .eq('id', (envio as { pedido_id: string }).pedido_id);

  // Notificar cliente
  await enviarNotificacao(envio, 'enviado');
}

async function handleOrderDelivered(envio: Record<string, unknown>) {
  console.log('[Webhook] Order Delivered:', envio.id);

  await supabase
    .from('pedidos_envio')
    .update({
      status_envio: 'delivered',
      data_entrega: new Date().toISOString(),
    })
    .eq('id', envio.id);

  await registrarEvento(envio.id as string, 'delivered', 'Pedido entregue ao destinatário');

  // Atualizar status do pedido principal
  await supabase
    .from('pedidos')
    .update({ status_pagamento: 'entregue' })
    .eq('id', (envio as { pedido_id: string }).pedido_id);

  // Notificar cliente
  await enviarNotificacao(envio, 'entregue');
}

async function handleOrderCanceled(envio: Record<string, unknown>) {
  console.log('[Webhook] Order Canceled:', envio.id);

  await supabase
    .from('pedidos_envio')
    .update({ status_envio: 'canceled' })
    .eq('id', envio.id);

  await registrarEvento(envio.id as string, 'canceled', 'Envio cancelado');
}

async function handleTrackingUpdate(envio: Record<string, unknown>, data: Record<string, unknown>) {
  console.log('[Webhook] Tracking Update:', envio.id);

  const tracking = data.tracking as { status: string; message: string; location?: string; date: string } | undefined;

  if (tracking) {
    await registrarEvento(
      envio.id as string,
      tracking.status,
      tracking.message,
      tracking.location
    );

    // Notificar cliente se for evento importante
    const eventosImportantes = ['out_for_delivery', 'delivered', 'exception'];
    if (eventosImportantes.includes(tracking.status)) {
      await enviarNotificacao(envio, 'em_transito');
    }
  }
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

async function registrarEvento(
  envioId: string,
  status: string,
  mensagem: string,
  localizacao?: string
) {
  await supabase.from('envio_rastreamento').insert({
    envio_id: envioId,
    status,
    mensagem,
    localizacao: localizacao || '',
    data_evento: new Date().toISOString(),
    origem: 'webhook',
  });
}

async function enviarNotificacao(envio: Record<string, unknown>, evento: string) {
  const pedido = (envio as { pedido: { email: string; telefone: string; nome_cliente: string } }).pedido;

  // TODO: Implementar envio real de email/WhatsApp
  console.log('[Notificação] Enviando para:', pedido.email, pedido.telefone);
  console.log('[Notificação] Evento:', evento);

  // Registrar log de notificação
  await supabase.from('envio_notificacoes').insert([
    {
      envio_id: envio.id,
      tipo: 'email',
      evento,
      destinatario: pedido.email,
      enviado: true,
      enviado_em: new Date().toISOString(),
    },
    {
      envio_id: envio.id,
      tipo: 'whatsapp',
      evento,
      destinatario: pedido.telefone,
      enviado: true,
      enviado_em: new Date().toISOString(),
    },
  ]);
}
