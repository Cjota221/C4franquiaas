import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ============ CONFIGURAÇÃO ============

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FACILZAP_WEBHOOK_SECRET = process.env.FACILZAP_WEBHOOK_SECRET;

// ============ TIPOS ============

interface WebhookPayload {
  event: string;
  data: unknown;
  produto_id?: string;
  timestamp?: string;
}

// ============ FUNÇÕES AUXILIARES ============

/**
 * Normaliza estoque para número (trata strings, objetos, etc.)
 */
function normalizeEstoque(estoqueField: unknown): number {
  if (typeof estoqueField === 'number' && Number.isFinite(estoqueField)) {
    return estoqueField;
  }
  if (typeof estoqueField === 'string') {
    const parsed = parseFloat(estoqueField.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }
  if (estoqueField && typeof estoqueField === 'object' && !Array.isArray(estoqueField)) {
    const obj = estoqueField as Record<string, unknown>;
    const disponivel = obj.disponivel ?? obj.estoque ?? obj.quantidade ?? obj.qty ?? obj.stock;
    return normalizeEstoque(disponivel);
  }
  return 0;
}

/**
 * Extrai ID do FácilZap de diferentes formatos
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractFacilZapId(data: any): string | null {
  const id = data.id || data.produto_id || data.codigo || data.code;
  return id ? String(id) : null;
}

// ============ HANDLERS DE EVENTOS ============

/**
 * Processa eventos de produto (criação, atualização, estoque)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleProdutoEstoque(data: any, eventType: string) {
  const facilzapId = extractFacilZapId(data);
  
  if (!facilzapId) {
    console.error('[Webhook] ❌ ID do produto não encontrado no payload');
    throw new Error('ID do produto é obrigatório');
  }

  const novoEstoque = normalizeEstoque(data.estoque);
  
  console.log(`[Webhook] 📦 Processando: ID=${facilzapId} | Evento=${eventType} | Estoque=${novoEstoque}`);

  // Preparar dados para upsert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = {
    estoque: novoEstoque,
    ultima_sincronizacao: new Date().toISOString(),
    sincronizado_facilzap: true,
    facilzap_id: facilzapId,
    id_externo: facilzapId, // Manter ambos para compatibilidade
  };

  // Adicionar campos opcionais se disponíveis
  if (data.nome) updateData.nome = String(data.nome);
  if (data.preco || data.preco_base) {
    const preco = data.preco_base || data.preco;
    updateData.preco_base = typeof preco === 'number' ? preco : parseFloat(String(preco)) || null;
  }
  if (data.imagem) updateData.imagem = String(data.imagem);
  if (typeof data.ativo === 'boolean') updateData.ativo = data.ativo;
  if (typeof data.ativado === 'boolean') updateData.ativo = data.ativado;

  // Buscar produto existente para comparação
  const { data: produtoExistente } = await supabaseAdmin
    .from('produtos')
    .select('id, estoque, ativo')
    .or(`facilzap_id.eq.${facilzapId},id_externo.eq.${facilzapId}`)
    .single();

  // Upsert do produto
  const { data: produto, error } = await supabaseAdmin
    .from('produtos')
    .upsert(updateData, { 
      onConflict: 'facilzap_id',
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) {
    console.error('[Webhook] ❌ Erro ao salvar produto:', error);
    throw error;
  }

  console.log(`[Webhook] ✅ Produto ${produtoExistente ? 'atualizado' : 'criado'}: ${produto.nome}`);

  // Regra de negócio: Desativar nas franquias se estoque zerou
  if (novoEstoque <= 0) {
    console.log('[Webhook] 🚫 Estoque zerado! Desativando produto nas franquias...');
    await desativarProdutoNasFranquias(produto.id, facilzapId);
  } 
  // Reativar se voltou a ter estoque
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  else if ((produtoExistente as any)?.estoque === 0 && novoEstoque > 0) {
    console.log('[Webhook] ✅ Estoque restaurado! Reativando produto nas franquias...');
    await reativarProdutoNasFranquias(produto.id);
  }

  // Registrar log
  await supabaseAdmin.from('logs_sincronizacao').insert({
    tipo: eventType.includes('criado') || eventType.includes('created') ? 'webhook_produto_criado' : 'webhook_estoque_atualizado',
    produto_id: produto.id,
    facilzap_id: facilzapId,
    descricao: `Webhook: ${eventType} - Estoque: ${novoEstoque}`,
    payload: { event: eventType, data },
    sucesso: true,
    erro: null,
  });

  return {produto_id: produto.id, estoque: novoEstoque};
}

/**
 * Desativa produto em todas franqueadas e revendedoras
 */
async function desativarProdutoNasFranquias(produtoId: string, facilzapId: string) {
  try {
    // Buscar vinculações com franqueadas
    const { data: franqueadas } = await supabaseAdmin
      .from('produtos_franqueadas')
      .select('id')
      .eq('produto_id', produtoId);

    if (franqueadas && franqueadas.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const franqueadaIds = franqueadas.map((f: any) => f.id);

      // Desativar em produtos_franqueadas_precos
      const { error: errPrecos } = await supabaseAdmin
        .from('produtos_franqueadas_precos')
        .update({ ativo_no_site: false })
        .in('produto_franqueada_id', franqueadaIds);

      if (errPrecos) {
        console.error('[Webhook] ❌ Erro ao desativar em franqueadas:', errPrecos);
      } else {
        console.log(`[Webhook] ✅ Desativados ${franqueadaIds.length} produtos em franqueadas`);
      }
    }

    // Desativar em reseller_products
    const { error: errRevendedoras } = await supabaseAdmin
      .from('reseller_products')
      .update({ is_active: false })
      .eq('product_id', produtoId);

    if (errRevendedoras) {
      console.error('[Webhook] ❌ Erro ao desativar em revendedoras:', errRevendedoras);
    } else {
      console.log(`[Webhook] ✅ Produto desativado em revendedoras`);
    }

    // Registrar log específico
    await supabaseAdmin.from('logs_sincronizacao').insert({
      tipo: 'estoque_zerado',
      produto_id: produtoId,
      facilzap_id: facilzapId,
      descricao: `Webhook: Produto desativado automaticamente (estoque = 0)`,
      payload: { produto_id: produtoId, facilzap_id: facilzapId },
      sucesso: true,
      erro: null,
    });

  } catch (error) {
    console.error('[Webhook] ❌ Erro ao desativar produto nas franquias:', error);
  }
}

/**
 * Reativa produto em todas franqueadas e revendedoras
 */
async function reativarProdutoNasFranquias(produtoId: string) {
  try {
    // Buscar vinculações com franqueadas
    const { data: franqueadas } = await supabaseAdmin
      .from('produtos_franqueadas')
      .select('id')
      .eq('produto_id', produtoId);

    if (franqueadas && franqueadas.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const franqueadaIds = franqueadas.map((f: any) => f.id);

      // Reativar em produtos_franqueadas_precos
      const { error: errPrecos } = await supabaseAdmin
        .from('produtos_franqueadas_precos')
        .update({ ativo_no_site: true })
        .in('produto_franqueada_id', franqueadaIds);

      if (errPrecos) {
        console.error('[Webhook] ❌ Erro ao reativar em franqueadas:', errPrecos);
      } else {
        console.log(`[Webhook] ✅ Reativados ${franqueadaIds.length} produtos em franqueadas`);
      }
    }

    // Reativar em reseller_products
    const { error: errRevendedoras } = await supabaseAdmin
      .from('reseller_products')
      .update({ is_active: true })
      .eq('product_id', produtoId);

    if (errRevendedoras) {
      console.error('[Webhook] ❌ Erro ao reativar em revendedoras:', errRevendedoras);
    } else {
      console.log(`[Webhook] ✅ Produto reativado em revendedoras`);
    }

  } catch (error) {
    console.error('[Webhook] ❌ Erro ao reativar produto nas franquias:', error);
  }
}

/**
 * 🆕 Processa eventos de pedido (futuro ERP)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleNovoPedido(data: any) {
  console.log('[Webhook] 💰 Novo pedido recebido:', data.id || data.pedido_id);
  
  // TODO: Implementar lógica de pedidos
  // 1. Criar registro na tabela 'vendas'
  // 2. Baixar estoque local (se FácilZap não baixou automaticamente)
  // 3. Vincular com franqueada/revendedora
  // 4. Enviar notificação
  
  console.warn('[Webhook] ⚠️ Handler de pedidos ainda não implementado');
  
  // Registrar log
  await supabaseAdmin.from('logs_sincronizacao').insert({
    tipo: 'webhook_pedido_recebido',
    descricao: `Webhook: Pedido ${data.id || data.pedido_id} (handler não implementado)`,
    payload: { data },
    sucesso: false,
    erro: 'Handler não implementado',
  });
}

// ============ ENDPOINT PRINCIPAL ============

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Segurança: Validar assinatura
    const signature = request.headers.get('x-facilzap-signature') || 
                     request.headers.get('x-webhook-secret');
    
    if (FACILZAP_WEBHOOK_SECRET && signature !== FACILZAP_WEBHOOK_SECRET) {
      console.error('[Webhook] ❌ Assinatura inválida');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2️⃣ Parse do payload
    const payload: WebhookPayload = await request.json();
    
    console.log('\n[Webhook] 📥 Evento recebido:', {
      event: payload.event,
      id: extractFacilZapId(payload.data || payload),
      timestamp: payload.timestamp || new Date().toISOString()
    });

    // 3️⃣ Validação básica
    if (!payload.event) {
      console.error('[Webhook] ❌ Evento não especificado');
      return NextResponse.json({ error: 'Event type required' }, { status: 400 });
    }

    // 4️⃣ Roteamento de eventos (suporta múltiplos formatos)
    const event = payload.event.toLowerCase();
    const data = payload.data || payload;
    let result;

    // Eventos de Produto/Estoque
    if (event.includes('produto') || event.includes('product') || event.includes('estoque') || event.includes('stock')) {
      result = await handleProdutoEstoque(data, event);
    }
    // Eventos de Pedido (futuro ERP)
    else if (event.includes('pedido') || event.includes('order')) {
      result = await handleNovoPedido(data);
    }
    // Sincronização completa
    else if (event.includes('sync')) {
      console.log('[Webhook] 🔄 Triggering full sync...');
      const syncResponse = await fetch(new URL('/api/sync-produtos', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      result = await syncResponse.json();
    }
    else {
      console.warn('[Webhook] ⚠️ Evento não suportado:', event);
      return NextResponse.json({ error: 'Unsupported event type', event }, { status: 400 });
    }

    // 5️⃣ Retornar sucesso
    return NextResponse.json({
      success: true,
      message: `Evento ${event} processado com sucesso`,
      result
    });

  } catch (error) {
    const err = error as Error;
    console.error('[Webhook] ❌ Erro fatal:', err);
    
    // Registrar erro
    try {
      await supabaseAdmin.from('logs_sincronizacao').insert({
        tipo: 'webhook_erro',
        descricao: `Webhook error: ${err.message}`,
        payload: { error: err.toString() },
        sucesso: false,
        erro: err.message,
      });
    } catch (logError) {
      console.error('[Webhook] ❌ Erro ao registrar log:', logError);
    }

    // Retornar 500 faz FácilZap tentar novamente (bom para erros temporários)
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: err.message 
    }, { status: 500 });
  }
}

// ============ ENDPOINT GET (STATUS) ============

export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhook/facilzap',
    description: 'Webhook unificado do FácilZap',
    supported_events: [
      'produto_criado / product.created',
      'produto_atualizado / product.updated',
      'estoque_atualizado / product.stock.updated',
      'pedido_criado / order.created (em desenvolvimento)',
      'sync.full (trigger sincronização completa)'
    ],
    security: FACILZAP_WEBHOOK_SECRET ? 'Enabled (x-facilzap-signature required)' : 'Disabled (WARNING)',
    timestamp: new Date().toISOString()
  });
}
