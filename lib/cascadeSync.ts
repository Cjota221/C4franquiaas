import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

type ProdutoUpdate = {
  id_externo: string;
  nome: string;
  estoque: number;
  variacoes_meta: Array<{
    id: string;
    nome: string;
    sku?: string | null;
    estoque: number;
    codigo_barras?: string | null;
  }>;
};

type WebhookFranqueadaConfig = {
  id: string;
  franqueada_id: string;
  franqueada_nome: string;
  webhook_url: string;
  ativo: boolean;
  secret_key?: string;
};

/**
 * Dispara webhook para todas as franqueadas cadastradas
 * informando sobre mudança de estoque
 */
export async function dispararWebhookFranqueadas(
  id_externo: string,
  update: Omit<ProdutoUpdate, 'id_externo' | 'nome'>
) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1️⃣ Buscar produto completo
    const { data: produto, error: produtoError } = await supabase
      .from('produtos')
      .select('id, id_externo, nome, estoque, variacoes_meta, imagem')
      .eq('id_externo', id_externo)
      .single();

    if (produtoError || !produto) {
      console.error('[Cascade] Produto não encontrado:', id_externo);
      return { success: false, error: 'Produto não encontrado' };
    }

    // 2️⃣ Buscar configurações de webhook das franqueadas
    // TODO: Criar tabela 'franqueadas_webhook_config' no banco
    // Por enquanto, vamos usar configuração fixa de exemplo
    const webhooksConfig: WebhookFranqueadaConfig[] = [
      // Exemplo de configuração (depois virá do banco)
      // {
      //   id: '1',
      //   franqueada_id: 'franqueada-123',
      //   franqueada_nome: 'Franquia Exemplo',
      //   webhook_url: 'https://franquia-exemplo.com/api/webhooks/estoque',
      //   ativo: true,
      //   secret_key: 'secret_123'
      // }
    ];

    if (webhooksConfig.length === 0) {
      console.log('[Cascade] Nenhuma franqueada configurada para receber webhooks');
      return { success: true, dispatched: 0 };
    }

    // 3️⃣ Preparar payload do webhook
    const payload = {
      event: 'product.stock.updated',
      data: {
        id_externo: produto.id_externo,
        nome: produto.nome,
        estoque: update.estoque,
        variacoes_meta: update.variacoes_meta,
        imagem: produto.imagem,
      },
      timestamp: new Date().toISOString(),
    };

    // 4️⃣ Disparar webhooks em paralelo
    const results = await Promise.allSettled(
      webhooksConfig
        .filter((config) => config.ativo)
        .map(async (config) => {
          try {
            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
            };

            // Adicionar secret key se configurado
            if (config.secret_key) {
              headers['X-Webhook-Secret'] = config.secret_key;
            }

            const response = await fetch(config.webhook_url, {
              method: 'POST',
              headers,
              body: JSON.stringify(payload),
              signal: AbortSignal.timeout(5000), // Timeout de 5s
            });

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log(
              `[Cascade] ✅ Webhook enviado para ${config.franqueada_nome}:`,
              config.webhook_url
            );

            return { success: true, franqueada: config.franqueada_nome };
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
            console.error(
              `[Cascade] ❌ Erro ao enviar webhook para ${config.franqueada_nome}:`,
              errorMessage
            );
            return { success: false, franqueada: config.franqueada_nome, error: errorMessage };
          }
        })
    );

    // 5️⃣ Contar sucessos e falhas
    const succeeded = results.filter((r) => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - succeeded;

    console.log(
      `[Cascade] Webhooks disparados: ${succeeded} sucesso, ${failed} falhas`
    );

    return {
      success: true,
      dispatched: results.length,
      succeeded,
      failed,
      results,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Cascade] Erro ao disparar webhooks:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Atualiza produto no C4 Admin e dispara webhook para franqueadas
 */
export async function syncProdutoEmCascata(
  id_externo: string,
  update: ProdutoUpdate
) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1️⃣ Atualizar no C4 Admin
    const { error: updateError } = await supabase
      .from('produtos')
      .update({
        estoque: update.estoque,
        variacoes_meta: update.variacoes_meta,
        updated_at: new Date().toISOString(),
      })
      .eq('id_externo', id_externo);

    if (updateError) {
      console.error('[Cascade] Erro ao atualizar C4 Admin:', updateError);
      return { success: false, error: updateError.message };
    }

    console.log('[Cascade] ✅ C4 Admin atualizado:', update.nome);

    // 2️⃣ Disparar webhook para franqueadas
    const webhookResult = await dispararWebhookFranqueadas(id_externo, update);

    return {
      success: true,
      c4_updated: true,
      webhook_result: webhookResult,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Cascade] Erro na sincronização em cascata:', errorMessage);
    return { success: false, error: errorMessage };
  }
}
