/**
 * 🔔 Serviço de Webhooks - C4 Admin
 * 
 * Responsável por enviar notificações de mudanças de produtos
 * para os e-commerces das franqueadas.
 * 
 * @module webhookService
 */

import { createClient } from '@supabase/supabase-js';

// ============ TIPOS ============

type WebhookEvent = 'PRODUCT_CREATED' | 'PRODUCT_UPDATED' | 'PRODUCT_DELETED' | 'STOCK_UPDATED';

interface WebhookPayload {
  eventType: WebhookEvent;
  timestamp: string;
  produto: {
    id: string;
    id_externo?: string | null;
    sku?: string | null;
    nome: string;
    preco_base: number;
    estoque: number;
    ativo: boolean;
    imagem?: string | null;
    imagens?: string[] | null;
    categoria_id?: string | null;
    variacoes_meta?: unknown[] | null;
    codigo_barras?: string | null;
  };
}

interface Loja {
  id: string;
  franqueada_id: string;
  nome: string;
  webhook_product_url: string | null;
  webhook_secret: string | null;
  auto_sync_enabled: boolean;
}

// ============ CONFIGURAÇÃO ============

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('[webhookService] ⚠️ Variáveis de ambiente ausentes');
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ============ FUNÇÕES PRINCIPAIS ============

/**
 * Envia webhook para uma loja específica
 */
async function sendWebhookToLoja(
  loja: Loja, 
  payload: WebhookPayload
): Promise<{ success: boolean; error?: string }> {
  
  if (!loja.webhook_product_url) {
    console.log(`[webhookService] ⚠️ Loja ${loja.nome} não tem webhook_product_url configurada`);
    return { success: false, error: 'webhook_url_not_configured' };
  }

  if (!loja.webhook_secret) {
    console.log(`[webhookService] ⚠️ Loja ${loja.nome} não tem webhook_secret configurada`);
    return { success: false, error: 'webhook_secret_not_configured' };
  }

  try {
    console.log(`[webhookService] 📤 Enviando webhook para ${loja.nome}...`);
    console.log(`[webhookService]   Evento: ${payload.eventType}`);
    console.log(`[webhookService]   Produto: ${payload.produto.nome} (${payload.produto.sku || payload.produto.id})`);
    console.log(`[webhookService]   URL: ${loja.webhook_product_url}`);

    const response = await fetch(loja.webhook_product_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': loja.webhook_secret,
        'X-Webhook-Event': payload.eventType,
        'X-Webhook-Source': 'c4-admin',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[webhookService] ❌ Webhook falhou (${response.status}):`, errorText);
      return { 
        success: false, 
        error: `HTTP ${response.status}: ${errorText}` 
      };
    }

    console.log(`[webhookService] ✅ Webhook enviado com sucesso para ${loja.nome}`);
    
    // Atualizar timestamp da última sincronização
    await supabase
      .from('lojas')
      .update({ last_product_sync_at: new Date().toISOString() })
      .eq('id', loja.id);

    return { success: true };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[webhookService] ❌ Erro ao enviar webhook:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Busca todas as lojas com webhook habilitado
 */
async function getLojasComWebhook(): Promise<Loja[]> {
  const { data, error } = await supabase
    .from('lojas')
    .select('id, franqueada_id, nome, webhook_product_url, webhook_secret, auto_sync_enabled')
    .eq('auto_sync_enabled', true)
    .eq('ativo', true)
    .not('webhook_product_url', 'is', null);

  if (error) {
    console.error('[webhookService] ❌ Erro ao buscar lojas:', error);
    return [];
  }

  return data || [];
}

/**
 * Envia webhook para TODAS as lojas habilitadas
 */
export async function notifyProductChange(
  eventType: WebhookEvent,
  produtoId: string
): Promise<void> {
  
  console.log(`\n[webhookService] 🔔 Notificação de mudança de produto`);
  console.log(`[webhookService]   Evento: ${eventType}`);
  console.log(`[webhookService]   Produto ID: ${produtoId}`);

  // 1. Buscar dados completos do produto
  const { data: produto, error: produtoError } = await supabase
    .from('produtos')
    .select('*')
    .eq('id', produtoId)
    .single();

  if (produtoError || !produto) {
    console.error('[webhookService] ❌ Produto não encontrado:', produtoError);
    return;
  }

  // 2. Montar payload
  const payload: WebhookPayload = {
    eventType,
    timestamp: new Date().toISOString(),
    produto: {
      id: produto.id,
      id_externo: produto.id_externo,
      sku: produto.codigo_barras || produto.id_externo || produto.id,
      nome: produto.nome,
      preco_base: produto.preco_base,
      estoque: produto.estoque,
      ativo: produto.ativo,
      imagem: produto.imagem,
      imagens: produto.imagens,
      categoria_id: produto.categoria_id,
      variacoes_meta: produto.variacoes_meta,
      codigo_barras: produto.codigo_barras,
    }
  };

  // 3. Buscar lojas com webhook habilitado
  const lojas = await getLojasComWebhook();

  if (lojas.length === 0) {
    console.log('[webhookService] ℹ️ Nenhuma loja com webhook habilitado');
    return;
  }

  console.log(`[webhookService] 📋 Enviando para ${lojas.length} loja(s)...`);

  // 4. Enviar webhook para cada loja (em paralelo)
  const results = await Promise.allSettled(
    lojas.map(loja => sendWebhookToLoja(loja, payload))
  );

  // 5. Resumo de resultados
  const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
  const failed = results.length - successful;

  console.log(`\n[webhookService] 📊 RESUMO:`);
  console.log(`[webhookService]   ✅ Sucesso: ${successful}`);
  console.log(`[webhookService]   ❌ Falhas: ${failed}`);
  console.log(`[webhookService]   Total: ${results.length}\n`);
}

/**
 * Envia webhook para uma loja específica (por domínio)
 */
export async function notifyProductChangeToLoja(
  eventType: WebhookEvent,
  produtoId: string,
  dominio: string
): Promise<{ success: boolean; error?: string }> {
  
  console.log(`\n[webhookService] 🔔 Notificação de mudança para loja específica`);
  console.log(`[webhookService]   Domínio: ${dominio}`);
  
  // 1. Buscar loja pelo domínio
  const { data: loja, error: lojaError } = await supabase
    .from('lojas')
    .select('id, franqueada_id, nome, webhook_product_url, webhook_secret, auto_sync_enabled')
    .eq('dominio', dominio)
    .eq('ativo', true)
    .single();

  if (lojaError || !loja) {
    console.error('[webhookService] ❌ Loja não encontrada:', lojaError);
    return { success: false, error: 'loja_not_found' };
  }

  // 2. Buscar dados completos do produto
  const { data: produto, error: produtoError } = await supabase
    .from('produtos')
    .select('*')
    .eq('id', produtoId)
    .single();

  if (produtoError || !produto) {
    console.error('[webhookService] ❌ Produto não encontrado:', produtoError);
    return { success: false, error: 'produto_not_found' };
  }

  // 3. Montar payload
  const payload: WebhookPayload = {
    eventType,
    timestamp: new Date().toISOString(),
    produto: {
      id: produto.id,
      id_externo: produto.id_externo,
      sku: produto.codigo_barras || produto.id_externo || produto.id,
      nome: produto.nome,
      preco_base: produto.preco_base,
      estoque: produto.estoque,
      ativo: produto.ativo,
      imagem: produto.imagem,
      imagens: produto.imagens,
      categoria_id: produto.categoria_id,
      variacoes_meta: produto.variacoes_meta,
      codigo_barras: produto.codigo_barras,
    }
  };

  // 4. Enviar webhook
  return sendWebhookToLoja(loja, payload);
}

// ============ EXPORTAÇÕES ============

const webhookService = {
  notifyProductChange,
  notifyProductChangeToLoja,
};

export default webhookService;

