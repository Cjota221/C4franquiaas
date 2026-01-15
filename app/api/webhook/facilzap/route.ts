import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isProdutoExcluido } from '@/lib/produtos-excluidos';

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

  // 🚫 VERIFICAR SE PRODUTO FOI EXCLUÍDO PELO ADMIN
  console.log(`[Webhook] 🛡️  Verificando se produto ${facilzapId} foi excluído...`);
  const foiExcluido = await isProdutoExcluido(supabaseAdmin, facilzapId);
  if (foiExcluido) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`🚫 WEBHOOK BLOQUEADO!`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`   Produto ID: ${facilzapId}`);
    console.log(`   Motivo: Foi excluído pelo admin`);
    console.log(`   Ação: Webhook IGNORADO - produto NÃO será recriado`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    return { 
      message: 'Produto foi excluído pelo admin - webhook ignorado', 
      facilzap_id: facilzapId 
    };
  }
  console.log(`[Webhook] ✅ Produto ${facilzapId} não está na lista de excluídos. Prosseguindo...`);

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

  // 🔑 Upsert do produto usando id_externo (compatível com sync manual)
  const { data: produto, error } = await supabaseAdmin
    .from('produtos')
    .upsert(updateData, { 
      onConflict: 'id_externo', // 🔧 MUDANÇA CRÍTICA: Garante compatibilidade
      ignoreDuplicates: false 
    })
    .select()
    .single();

  if (error) {
    console.error('[Webhook] ❌ Erro ao salvar produto:', error);
    throw error;
  }

  console.log(`[Webhook] ✅ Produto ${produtoExistente ? 'atualizado' : 'criado'}: ${produto.nome}`);

  // 🚫 REMOVIDO: Não desativar/reativar automaticamente
  // Admin tem controle total sobre ativar/desativar produtos
  // O webhook apenas atualiza os DADOS (estoque, preço) mas não muda status

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
async function _desativarProdutoNasFranquias(produtoId: string, facilzapId: string) {
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
async function _reativarProdutoNasFranquias(produtoId: string) {
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
 * 🆕 Processa eventos de pedido - BAIXA OU DEVOLVE ESTOQUE AUTOMATICAMENTE
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleNovoPedido(data: any, eventType: string) {
  const pedidoId = data.id || data.pedido_id || data.numero || data.order_id;
  
  // Detectar se é cancelamento
  const isCancelamento = eventType.toLowerCase().includes('cancelado') || 
                        eventType.toLowerCase().includes('cancel') ||
                        data.status?.toLowerCase() === 'cancelado' ||
                        data.status?.toLowerCase() === 'cancelled';
  
  const acao = isCancelamento ? 'DEVOLVENDO' : 'BAIXANDO';
  console.log(`[Webhook] 💰 Pedido recebido: ${pedidoId} | Evento: ${eventType} | Ação: ${acao}`);
  
  // Extrair itens do pedido (diferentes formatos possíveis)
  const itens = data.itens || data.items || data.produtos || data.products || [];
  
  if (!itens || itens.length === 0) {
    console.warn('[Webhook] ⚠️ Pedido sem itens para processar');
    await supabaseAdmin.from('logs_sincronizacao').insert({
      tipo: 'webhook_pedido_sem_itens',
      descricao: `Pedido ${pedidoId} recebido mas sem itens`,
      payload: { pedido_id: pedidoId, data },
      sucesso: false,
      erro: 'Pedido sem itens',
    });
    return { pedido_id: pedidoId, itens_processados: 0 };
  }

  console.log(`[Webhook] 📦 ${acao} estoque de ${itens.length} itens do pedido...`);
  
  let itensProcessados = 0;
  const erros: string[] = [];

  for (const item of itens) {
    try {
      // Extrair ID do produto (diferentes formatos)
      const produtoId = item.produto_id || item.product_id || item.id_produto || 
                       item.sku || item.codigo || item.id;
      const quantidade = item.quantidade || item.qty || item.quantity || 1;
      const nomeProduto = item.nome || item.name || item.produto || 'Produto';

      if (!produtoId) {
        console.warn(`[Webhook] ⚠️ Item sem ID de produto:`, item);
        continue;
      }

      const operacao = isCancelamento ? '📈 DEVOLVENDO' : '📉 BAIXANDO';
      console.log(`[Webhook] ${operacao} estoque: ${nomeProduto} (${produtoId}) x ${quantidade}`);

      // Buscar produto no banco
      const { data: produto, error: errBusca } = await supabaseAdmin
        .from('produtos')
        .select('id, nome, estoque, facilzap_id, id_externo')
        .or(`facilzap_id.eq.${produtoId},id_externo.eq.${produtoId},id.eq.${produtoId}`)
        .single();

      if (errBusca || !produto) {
        console.warn(`[Webhook] ⚠️ Produto não encontrado: ${produtoId}`);
        erros.push(`Produto ${produtoId} não encontrado`);
        continue;
      }

      // Calcular novo estoque
      const estoqueAtual = produto.estoque || 0;
      const novoEstoque = isCancelamento 
        ? estoqueAtual + quantidade  // DEVOLVE: soma a quantidade de volta
        : Math.max(0, estoqueAtual - quantidade);  // BAIXA: subtrai quantidade

      // Atualizar estoque
      const { error: errUpdate } = await supabaseAdmin
        .from('produtos')
        .update({ 
          estoque: novoEstoque,
          ultima_sincronizacao: new Date().toISOString()
        })
        .eq('id', produto.id);

      if (errUpdate) {
        console.error(`[Webhook] ❌ Erro ao atualizar estoque:`, errUpdate);
        erros.push(`Erro ao atualizar ${produto.nome}`);
        continue;
      }

      const simbolo = isCancelamento ? '📈' : '📉';
      console.log(`[Webhook] ✅ ${simbolo} Estoque atualizado: ${produto.nome} ${estoqueAtual} → ${novoEstoque}`);
      itensProcessados++;

      // 🚫 REMOVIDO: Não desativar/reativar automaticamente
      // Admin tem controle total

    } catch (itemError) {
      console.error(`[Webhook] ❌ Erro ao processar item:`, itemError);
      erros.push(`Erro no item: ${(itemError as Error).message}`);
    }
  }

  // Registrar log do pedido
  const tipoLog = isCancelamento ? 'webhook_pedido_cancelado' : 'webhook_pedido_processado';
  const descricaoLog = isCancelamento 
    ? `Pedido ${pedidoId} CANCELADO: ${itensProcessados}/${itens.length} itens com estoque devolvido`
    : `Pedido ${pedidoId}: ${itensProcessados}/${itens.length} itens com estoque baixado`;
  
  await supabaseAdmin.from('logs_sincronizacao').insert({
    tipo: tipoLog,
    descricao: descricaoLog,
    payload: { 
      pedido_id: pedidoId, 
      evento: eventType,
      acao: isCancelamento ? 'devolver_estoque' : 'baixar_estoque',
      itens_total: itens.length,
      itens_processados: itensProcessados,
      erros: erros.length > 0 ? erros : null
    },
    sucesso: erros.length === 0,
    erro: erros.length > 0 ? erros.join('; ') : null,
  });

  const acaoFinal = isCancelamento ? 'CANCELADO (estoque devolvido)' : 'PROCESSADO (estoque baixado)';
  console.log(`[Webhook] ✅ Pedido ${pedidoId} ${acaoFinal}: ${itensProcessados}/${itens.length} itens`);
  
  return { 
    pedido_id: pedidoId, 
    acao: isCancelamento ? 'cancelamento' : 'criacao',
    itens_processados: itensProcessados,
    itens_total: itens.length,
    erros: erros.length > 0 ? erros : undefined
  };
}

/**
 * 🆕 Processa exclusão de produto do FácilZap
 * DELETA o produto do banco de dados (não apenas desativa)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleProdutoExcluido(data: any, eventType: string) {
  const facilzapId = extractFacilZapId(data);
  
  if (!facilzapId) {
    console.error('[Webhook] ❌ ID do produto não encontrado no payload de exclusão');
    throw new Error('ID do produto é obrigatório para exclusão');
  }

  console.log(`[Webhook] 🗑️ Processando EXCLUSÃO PERMANENTE: ID=${facilzapId} | Evento=${eventType}`);

  // Buscar produto existente
  const { data: produto, error: errBusca } = await supabaseAdmin
    .from('produtos')
    .select('id, nome, facilzap_id, id_externo')
    .or(`facilzap_id.eq.${facilzapId},id_externo.eq.${facilzapId}`)
    .single();

  if (errBusca || !produto) {
    console.warn(`[Webhook] ⚠️ Produto não encontrado para exclusão: ${facilzapId}`);
    return { message: 'Produto não encontrado', facilzap_id: facilzapId };
  }

  console.log(`[Webhook] 🗑️ Produto encontrado: ${produto.nome} (${produto.id})`);

  // 1️⃣ DELETAR vinculações com franqueadas (preços primeiro por FK)
  const { data: franqueadas } = await supabaseAdmin
    .from('produtos_franqueadas')
    .select('id')
    .eq('produto_id', produto.id);

  let franqueadasDeletadas = 0;
  if (franqueadas && franqueadas.length > 0) {
    const franqueadaIds = franqueadas.map((f: { id: string }) => f.id);
    
    // Deletar preços primeiro (FK)
    await supabaseAdmin
      .from('produtos_franqueadas_precos')
      .delete()
      .in('produto_franqueada_id', franqueadaIds);
    
    // Deletar vinculações
    await supabaseAdmin
      .from('produtos_franqueadas')
      .delete()
      .eq('produto_id', produto.id);
    
    franqueadasDeletadas = franqueadaIds.length;
    console.log(`[Webhook] ✅ Deletadas ${franqueadasDeletadas} vinculações com franqueadas`);
  }

  // 2️⃣ DELETAR vinculações com revendedoras
  const { data: revendedorasDeletadas } = await supabaseAdmin
    .from('reseller_products')
    .delete()
    .eq('product_id', produto.id)
    .select('id');

  console.log(`[Webhook] ✅ Deletadas ${revendedorasDeletadas?.length || 0} vinculações com revendedoras`);

  // 3️⃣ DELETAR categorias do produto
  await supabaseAdmin
    .from('produto_categorias')
    .delete()
    .eq('produto_id', produto.id);

  // 4️⃣ DELETAR o produto
  const { error: errDelete } = await supabaseAdmin
    .from('produtos')
    .delete()
    .eq('id', produto.id);

  if (errDelete) {
    console.error('[Webhook] ❌ Erro ao deletar produto:', errDelete);
    // Fallback: desativar se delete falhar
    await supabaseAdmin
      .from('produtos')
      .update({ ativo: false, ultima_sincronizacao: new Date().toISOString() })
      .eq('id', produto.id);
    console.log(`[Webhook] ⚠️ Produto desativado (delete falhou)`);
  } else {
    console.log(`[Webhook] ✅ Produto ${produto.nome} DELETADO PERMANENTEMENTE`);
  }

  // 5️⃣ Registrar log
  await supabaseAdmin.from('logs_sincronizacao').insert({
    tipo: 'webhook_produto_excluido',
    produto_id: null, // Produto foi deletado
    facilzap_id: facilzapId,
    descricao: `Produto "${produto.nome}" DELETADO do banco (excluído do FácilZap)`,
    payload: { 
      event: eventType, 
      data, 
      produto_id_antigo: produto.id,
      nome: produto.nome,
      acao: 'DELETE'
    },
    sucesso: true,
    erro: null,
  });

  return {
    produto_id: produto.id,
    nome: produto.nome,
    facilzap_id: facilzapId,
    acao: 'deletado',
    franqueadas_deletadas: franqueadasDeletadas,
    revendedoras_deletadas: revendedorasDeletadas?.length || 0
  };
}

// ============ ENDPOINT PRINCIPAL ============

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Segurança: Validar assinatura (Header OU Query Parameter)
    // Opção 1: Header (padrão)
    const headerSignature = request.headers.get('x-facilzap-signature') || 
                           request.headers.get('x-webhook-secret');
    
    // Opção 2: Query Parameter (para ERPs que não suportam headers customizados)
    const url = new URL(request.url);
    const querySecret = url.searchParams.get('secret');
    
    // Aceita qualquer uma das duas formas
    const providedSecret = headerSignature || querySecret;
    
    // Log para debug (não expõe o secret real)
    console.log('[Webhook] 🔐 Autenticação:', {
      viaHeader: !!headerSignature,
      viaQuery: !!querySecret,
      secretConfigured: !!FACILZAP_WEBHOOK_SECRET
    });
    
    if (FACILZAP_WEBHOOK_SECRET && providedSecret !== FACILZAP_WEBHOOK_SECRET) {
      console.error('[Webhook] ❌ Assinatura inválida ou ausente');
      return NextResponse.json({ 
        error: 'Unauthorized',
        hint: 'Envie o secret via header X-FacilZap-Signature ou query param ?secret=VALOR'
      }, { status: 401 });
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

    // 🆕 Eventos de EXCLUSÃO de produto (deve vir ANTES do handler genérico de produto)
    if (event.includes('exclu') || event.includes('delet') || event.includes('remov') || event.includes('removed')) {
      result = await handleProdutoExcluido(data, event);
    }
    // Eventos de Produto/Estoque
    else if (event.includes('produto') || event.includes('product') || event.includes('estoque') || event.includes('stock')) {
      result = await handleProdutoEstoque(data, event);
    }
    // Eventos de Pedido (futuro ERP)
    else if (event.includes('pedido') || event.includes('order')) {
      result = await handleNovoPedido(data, event);
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
      'produto_excluido / product.deleted / product.removed', // 🆕 EXCLUSÃO
      'pedido_criado / order.created',
      'pedido_cancelado / order.cancelled',
      'sync.full (trigger sincronização completa)'
    ],
    authentication: {
      enabled: !!FACILZAP_WEBHOOK_SECRET,
      methods: [
        'Header: X-FacilZap-Signature',
        'Header: X-Webhook-Secret', 
        'Query Parameter: ?secret=VALOR'
      ],
      example_url: '/api/webhook/facilzap?secret=SEU_SECRET_AQUI'
    },
    timestamp: new Date().toISOString()
  });
}
