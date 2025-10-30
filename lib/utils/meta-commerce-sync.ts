/**
 * Meta Commerce Sync - Sincronização de Estoque com Facebook/Instagram
 * 
 * Este módulo gerencia a sincronização de estoque de produtos com o
 * catálogo de produtos da Meta (Facebook/Instagram Shopping).
 */

interface MetaBatchRequest {
  method: 'UPDATE';
  retailer_id: string; // SKU do produto
  data: {
    inventory: number;
    availability: 'in stock' | 'out of stock';
  };
}

interface MetaBatchResponse {
  data?: {
    handles: string[];
  };
  error?: {
    message: string;
    type: string;
    code: number;
  };
}

/**
 * Sincroniza o estoque de um produto com a Meta Commerce API
 * @param sku - SKU do produto
 * @param novoEstoque - Quantidade em estoque
 */
export async function sincronizarEstoqueMeta(
  sku: string,
  novoEstoque: number
): Promise<{ success: boolean; error?: string }> {
  const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
  const META_CATALOG_ID = process.env.META_CATALOG_ID;

  // Validação de credenciais
  if (!META_ACCESS_TOKEN || !META_CATALOG_ID) {
    console.warn('⚠️ [Meta Sync] Credenciais da Meta não configuradas. Pulando sincronização.');
    return { success: false, error: 'Credenciais não configuradas' };
  }

  // Endpoint da Meta Graph API (v18.0)
  const endpoint = `https://graph.facebook.com/v18.0/${META_CATALOG_ID}/items_batch`;

  // Payload do Batch API
  const payload: { requests: MetaBatchRequest[] } = {
    requests: [
      {
        method: 'UPDATE',
        retailer_id: sku,
        data: {
          inventory: novoEstoque,
          availability: novoEstoque > 0 ? 'in stock' : 'out of stock',
        },
      },
    ],
  };

  try {
    console.log(`📦 [Meta Sync] Sincronizando SKU ${sku} com estoque ${novoEstoque}...`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        access_token: META_ACCESS_TOKEN,
        ...payload,
      }),
    });

    const result: MetaBatchResponse = await response.json();

    if (!response.ok || result.error) {
      console.error('❌ [Meta Sync] Erro na resposta da API:', result.error);
      return {
        success: false,
        error: result.error?.message || 'Erro desconhecido na Meta API',
      };
    }

    console.log('✅ [Meta Sync] Estoque sincronizado com sucesso!', result.data);
    return { success: true };
  } catch (error) {
    console.error('❌ [Meta Sync] Erro ao sincronizar com Meta:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Notifica todas as franqueadas sobre mudança de estoque
 * @param sku - SKU do produto
 * @param novoEstoque - Quantidade em estoque
 */
export async function notificarFranqueadas(
  sku: string,
  novoEstoque: number
): Promise<void> {
  console.log(`📢 [Franqueadas] Notificando lojas sobre SKU ${sku} - Estoque: ${novoEstoque}`);

  // TODO: Implementar lógica de notificação para franqueadas
  // Opções:
  // 1. WebSocket (tempo real)
  // 2. Webhook para endpoint de cada loja
  // 3. Server-Sent Events (SSE)
  // 4. Polling via API

  // Por enquanto, apenas log
  console.log('⏭️ [Franqueadas] Notificação via WebSocket/Webhook será implementada.');
}

/**
 * Função principal: Notifica todos os sistemas integrados
 * @param sku - SKU do produto
 * @param novoEstoque - Quantidade em estoque
 */
export async function notificarSistemasIntegrados(
  sku: string,
  novoEstoque: number
): Promise<void> {
  console.log(`🔄 [Sync] Iniciando sincronização para SKU ${sku}...`);

  // Executa sincronizações de forma assíncrona (não bloqueia o webhook)
  // Não usamos await para evitar timeout no webhook
  Promise.all([
    sincronizarEstoqueMeta(sku, novoEstoque),
    notificarFranqueadas(sku, novoEstoque),
  ])
    .then(() => {
      console.log('✅ [Sync] Todas as sincronizações completadas!');
    })
    .catch((error) => {
      console.error('❌ [Sync] Erro em alguma sincronização:', error);
    });

  console.log('⚡ [Sync] Sincronizações disparadas em background.');
}
