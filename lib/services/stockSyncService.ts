/**
 * 🔄 Stock Sync Service - Sincronização de Estoque via Polling
 * 
 * Versão simplificada que reutiliza o facilzapClient existente.
 * 
 * @author C4 Franquias
 * @version 2.0.0
 */

import { createClient } from '@supabase/supabase-js';
import { fetchAllProdutosFacilZap } from '@/lib/facilzapClient';

// ============ TIPOS ============

interface SyncResult {
  success: boolean;
  processed: number;
  updated: number;
  unchanged: number;
  errors: number;
  duration_ms: number;
  timestamp: string;
  error?: string;
}

interface LocalProduct {
  id: string;
  id_externo: string | null;
  estoque: number;
  nome: string;
}

// ============ ESTADO ============

let isRunning = false;

// ============ CLIENTE SUPABASE ============

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============ FUNÇÕES AUXILIARES ============

function normalizeEstoque(estoqueField: unknown): number {
  if (typeof estoqueField === 'number' && Number.isFinite(estoqueField)) {
    return Math.max(0, Math.floor(estoqueField));
  }
  if (typeof estoqueField === 'string') {
    const parsed = parseFloat(estoqueField.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
  }
  return 0;
}

// ============ FUNÇÃO PRINCIPAL ============

/**
 * Executa sincronização de estoque usando o facilzapClient existente
 */
export async function syncEstoque(): Promise<SyncResult> {
  // Evita execuções paralelas
  if (isRunning) {
    return {
      success: false,
      processed: 0,
      updated: 0,
      unchanged: 0,
      errors: 0,
      duration_ms: 0,
      timestamp: new Date().toISOString(),
      error: 'Sincronização já em andamento',
    };
  }

  isRunning = true;
  const startTime = Date.now();
  
  const result: SyncResult = {
    success: false,
    processed: 0,
    updated: 0,
    unchanged: 0,
    errors: 0,
    duration_ms: 0,
    timestamp: new Date().toISOString(),
  };

  console.log('\n🔄 [StockSync] Iniciando sincronização de estoque...\n');

  try {
    // 1. Buscar produtos usando o cliente que já funciona
    console.log('📡 [StockSync] Buscando produtos do FácilZap...');
    const { produtos } = await fetchAllProdutosFacilZap();
    
    if (!produtos || produtos.length === 0) {
      console.log('⚠️ [StockSync] Nenhum produto retornado do FácilZap');
      result.success = true;
      return result;
    }

    console.log(`✅ [StockSync] ${produtos.length} produtos recebidos`);

    // 2. Buscar produtos locais
    const { data: localProducts, error: localError } = await supabaseAdmin
      .from('produtos')
      .select('id, id_externo, estoque, nome')
      .not('id_externo', 'is', null);

    if (localError) {
      throw new Error(`Erro ao buscar produtos locais: ${localError.message}`);
    }

    // Criar mapa para busca rápida
    const localMap = new Map<string, LocalProduct>();
    for (const p of (localProducts || [])) {
      if (p.id_externo) {
        localMap.set(String(p.id_externo), p);
      }
    }

    console.log(`💾 [StockSync] ${localMap.size} produtos locais encontrados`);

    // 3. Comparar e atualizar apenas estoques diferentes
    for (const apiProduct of produtos) {
      result.processed++;
      
      const externalId = String(apiProduct.id_externo);
      const local = localMap.get(externalId);
      
      if (!local) continue; // Produto não existe localmente

      const newStock = normalizeEstoque(apiProduct.estoque);
      const currentStock = local.estoque || 0;

      // Só atualiza se diferente (idempotência)
      if (currentStock === newStock) {
        result.unchanged++;
        continue;
      }

      // Atualizar estoque
      const { error: updateError } = await supabaseAdmin
        .from('produtos')
        .update({
          estoque: newStock,
          ultima_sincronizacao: new Date().toISOString(),
        })
        .eq('id', local.id);

      if (updateError) {
        result.errors++;
        console.error(`❌ Erro ao atualizar ${local.nome}: ${updateError.message}`);
      } else {
        result.updated++;
        console.log(`🔄 ${local.nome}: ${currentStock} → ${newStock}`);

        // Se zerou, desativar nas franquias
        if (newStock === 0) {
          await desativarProduto(local.id);
        }
      }
    }

    result.success = true;

  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
    console.error(`❌ [StockSync] Erro: ${result.error}`);
  } finally {
    isRunning = false;
    result.duration_ms = Date.now() - startTime;

    console.log('\n📊 [StockSync] Resultado:');
    console.log(`   Processados: ${result.processed}`);
    console.log(`   Atualizados: ${result.updated}`);
    console.log(`   Inalterados: ${result.unchanged}`);
    console.log(`   Erros: ${result.errors}`);
    console.log(`   Tempo: ${(result.duration_ms / 1000).toFixed(2)}s\n`);

    // Registrar log
    try {
      await supabaseAdmin.from('logs_sincronizacao').insert({
        tipo: 'polling_estoque',
        descricao: `Polling: ${result.updated}/${result.processed} atualizados`,
        payload: result,
        sucesso: result.success,
        erro: result.error || null,
      });
    } catch {
      // Ignora erro de log
    }
  }

  return result;
}

/**
 * Desativa produto nas franquias quando estoque zera
 */
async function desativarProduto(produtoId: string): Promise<void> {
  try {
    const { data: franqueadas } = await supabaseAdmin
      .from('produtos_franqueadas')
      .select('id')
      .eq('produto_id', produtoId);

    if (franqueadas && franqueadas.length > 0) {
      await supabaseAdmin
        .from('produtos_franqueadas_precos')
        .update({ ativo_no_site: false })
        .in('produto_franqueada_id', franqueadas.map(f => f.id));
    }

    await supabaseAdmin
      .from('reseller_products')
      .update({ is_active: false })
      .eq('product_id', produtoId);

  } catch (error) {
    console.error(`❌ Erro ao desativar produto: ${error}`);
  }
}

/**
 * Verifica se sincronização está rodando
 */
export function isSyncRunning(): boolean {
  return isRunning;
}

const stockSyncService = { syncEstoque, isSyncRunning };
export default stockSyncService;