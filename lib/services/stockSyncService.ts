/**
 * 🔄 Stock Sync Service - Sincronização de Estoque via Polling
 * 
 * Serviço robusto para buscar estoque da API FácilZap respeitando rate limits.
 * 
 * Limites da API FácilZap:
 * - 2 requisições/segundo
 * - 172.800 requisições/dia
 * - Retorna 429 Too Many Requests se exceder
 * 
 * @author C4 Franquias
 * @version 1.0.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============ CONFIGURAÇÃO ============

const CONFIG = {
  // API FácilZap (URL fixa - mesmo padrão do sync manual)
  API_BASE_URL: 'https://api.facilzap.app.br',
  API_TOKEN: process.env.FACILZAP_TOKEN || '',
  
  // Rate Limiting (conservador para segurança)
  DELAY_BETWEEN_REQUESTS_MS: 1000, // 1 segundo entre requisições (max 2 req/s permitido)
  DELAY_BETWEEN_PAGES_MS: 1200,    // 1.2 segundos entre páginas (margem de segurança)
  MAX_RETRIES_ON_429: 3,           // Máximo de tentativas após 429
  BACKOFF_MULTIPLIER: 2,           // Multiplicador de backoff exponencial
  INITIAL_BACKOFF_MS: 5000,        // 5 segundos de backoff inicial
  
  // Paginação
  PAGE_SIZE: 50,                   // Produtos por página
  MAX_PAGES: 100,                  // Limite de segurança (5000 produtos máx)
  
  // Timeouts
  REQUEST_TIMEOUT_MS: 15000,       // 15 segundos timeout por requisição
};

// ============ TIPOS ============

interface FacilZapProduct {
  id: string | number;
  codigo?: string;
  nome: string;
  preco?: number;
  estoque: number | string | { disponivel?: number; quantidade?: number };
  ativo?: boolean;
  imagem?: string;
}

interface FacilZapResponse {
  data: FacilZapProduct[];
  meta?: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  pagination?: {
    page: number;
    totalPages: number;
    total: number;
  };
}

interface SyncResult {
  success: boolean;
  processed: number;
  updated: number;
  unchanged: number;
  errors: number;
  duration_ms: number;
  rate_limit_hits: number;
  pages_fetched: number;
  timestamp: string;
  error?: string;
}

interface LocalProduct {
  id: string;
  id_externo: string | null;
  facilzap_id: string | null;
  estoque: number;
  nome: string;
}

interface RateLimitInfo {
  limit: number | null;
  remaining: number | null;
  resetAt: Date | null;
}

// ============ CLIENTE SUPABASE ============

const supabaseAdmin: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============ FUNÇÕES AUXILIARES ============

/**
 * Sleep assíncrono com log opcional
 */
async function sleep(ms: number, reason?: string): Promise<void> {
  if (reason) {
    console.log(`⏳ [StockSync] Aguardando ${ms}ms - ${reason}`);
  }
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Normaliza estoque para número (trata strings, objetos, etc.)
 */
function normalizeEstoque(estoqueField: unknown): number {
  if (typeof estoqueField === 'number' && Number.isFinite(estoqueField)) {
    return Math.max(0, Math.floor(estoqueField));
  }
  if (typeof estoqueField === 'string') {
    const parsed = parseFloat(estoqueField.replace(/[^0-9.-]/g, ''));
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0;
  }
  if (estoqueField && typeof estoqueField === 'object' && !Array.isArray(estoqueField)) {
    const obj = estoqueField as Record<string, unknown>;
    const valor = obj.disponivel ?? obj.estoque ?? obj.quantidade ?? obj.qty ?? obj.stock;
    return normalizeEstoque(valor);
  }
  return 0;
}

/**
 * Extrai informações de rate limit dos headers da resposta
 */
function extractRateLimitInfo(headers: Headers): RateLimitInfo {
  return {
    limit: headers.get('x-ratelimit-limit') ? parseInt(headers.get('x-ratelimit-limit')!) : null,
    remaining: headers.get('x-ratelimit-remaining') ? parseInt(headers.get('x-ratelimit-remaining')!) : null,
    resetAt: headers.get('x-ratelimit-reset') 
      ? new Date(parseInt(headers.get('x-ratelimit-reset')!) * 1000) 
      : null,
  };
}

/**
 * Calcula delay de backoff exponencial
 */
function calculateBackoff(attempt: number): number {
  return CONFIG.INITIAL_BACKOFF_MS * Math.pow(CONFIG.BACKOFF_MULTIPLIER, attempt);
}

// ============ CLASSE PRINCIPAL ============

class StockSyncService {
  private rateLimitHits = 0;
  private isRunning = false;
  private abortController: AbortController | null = null;

  /**
   * Busca uma página de produtos da API FácilZap
   */
  private async fetchPage(page: number, retryCount = 0): Promise<{ products: FacilZapProduct[]; hasMore: boolean; rateLimitInfo: RateLimitInfo }> {
    const url = `${CONFIG.API_BASE_URL}/produtos?page=${page}&per_page=${CONFIG.PAGE_SIZE}`;
    
    console.log(`📡 [StockSync] Buscando página ${page}...`);
    console.log(`📡 [StockSync] URL: ${url}`);
    console.log(`📡 [StockSync] Token configurado: ${CONFIG.API_TOKEN ? 'SIM (' + CONFIG.API_TOKEN.substring(0, 10) + '...)' : 'NÃO'}`);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CONFIG.API_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: this.abortController?.signal,
      });

      const rateLimitInfo = extractRateLimitInfo(response.headers);

      // Log de rate limit para monitoramento
      if (rateLimitInfo.remaining !== null) {
        console.log(`📊 [StockSync] Rate Limit: ${rateLimitInfo.remaining}/${rateLimitInfo.limit} restantes`);
      }

      // ⚠️ TRATAMENTO DE RATE LIMIT (429)
      if (response.status === 429) {
        this.rateLimitHits++;
        console.warn(`⚠️ [StockSync] Rate limit atingido! (429) - Tentativa ${retryCount + 1}/${CONFIG.MAX_RETRIES_ON_429}`);

        if (retryCount >= CONFIG.MAX_RETRIES_ON_429) {
          throw new Error('Rate limit excedido após múltiplas tentativas. Abortando sincronização.');
        }

        // Backoff exponencial
        const backoffMs = calculateBackoff(retryCount);
        await sleep(backoffMs, `Backoff após 429 (tentativa ${retryCount + 1})`);
        
        // Retry recursivo
        return this.fetchPage(page, retryCount + 1);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: FacilZapResponse = await response.json();
      
      // Extrai array de produtos (suporta diferentes formatos de resposta)
      const products = Array.isArray(data) ? data : (data.data || []);
      
      // Determina se há mais páginas
      let hasMore = false;
      if (data.meta) {
        hasMore = data.meta.current_page < data.meta.last_page;
      } else if (data.pagination) {
        hasMore = data.pagination.page < data.pagination.totalPages;
      } else {
        // Fallback: se retornou PAGE_SIZE produtos, assume que há mais
        hasMore = products.length >= CONFIG.PAGE_SIZE;
      }

      console.log(`✅ [StockSync] Página ${page}: ${products.length} produtos`);

      return { products, hasMore, rateLimitInfo };

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Sincronização cancelada pelo usuário');
      }
      throw error;
    }
  }

  /**
   * Busca todos os produtos com paginação e throttling
   */
  private async fetchAllProducts(): Promise<FacilZapProduct[]> {
    const allProducts: FacilZapProduct[] = [];
    let currentPage = 1;
    let hasMore = true;

    console.log('🚀 [StockSync] Iniciando busca de todos os produtos...');

    while (hasMore && currentPage <= CONFIG.MAX_PAGES) {
      const { products, hasMore: morePages } = await this.fetchPage(currentPage);
      
      allProducts.push(...products);
      hasMore = morePages;

      if (hasMore) {
        // 🔑 THROTTLING CRÍTICO: Delay entre páginas para respeitar rate limit
        await sleep(CONFIG.DELAY_BETWEEN_PAGES_MS, `Throttling entre páginas (${currentPage} → ${currentPage + 1})`);
        currentPage++;
      }
    }

    if (currentPage > CONFIG.MAX_PAGES) {
      console.warn(`⚠️ [StockSync] Limite de páginas atingido (${CONFIG.MAX_PAGES}). Alguns produtos podem não ter sido sincronizados.`);
    }

    console.log(`📦 [StockSync] Total de produtos buscados: ${allProducts.length}`);
    return allProducts;
  }

  /**
   * Busca produtos locais do banco de dados
   */
  private async fetchLocalProducts(): Promise<Map<string, LocalProduct>> {
    const { data, error } = await supabaseAdmin
      .from('produtos')
      .select('id, id_externo, facilzap_id, estoque, nome')
      .not('id_externo', 'is', null);

    if (error) {
      throw new Error(`Erro ao buscar produtos locais: ${error.message}`);
    }

    // Cria mapa indexado por id_externo E facilzap_id para busca rápida
    const productMap = new Map<string, LocalProduct>();
    
    for (const product of (data || [])) {
      if (product.id_externo) {
        productMap.set(String(product.id_externo), product);
      }
      if (product.facilzap_id && product.facilzap_id !== product.id_externo) {
        productMap.set(String(product.facilzap_id), product);
      }
    }

    console.log(`💾 [StockSync] ${productMap.size} produtos locais indexados`);
    return productMap;
  }

  /**
   * Atualiza estoque de um único produto (apenas se diferente)
   */
  private async updateProductStock(
    localProduct: LocalProduct,
    newStock: number
  ): Promise<boolean> {
    // 🔑 IDEMPOTÊNCIA: Só atualiza se o valor for diferente
    if (localProduct.estoque === newStock) {
      return false; // Sem alteração
    }

    const { error } = await supabaseAdmin
      .from('produtos')
      .update({
        estoque: newStock,
        ultima_sincronizacao: new Date().toISOString(),
        sincronizado_facilzap: true,
      })
      .eq('id', localProduct.id);

    if (error) {
      console.error(`❌ [StockSync] Erro ao atualizar ${localProduct.nome}: ${error.message}`);
      return false;
    }

    console.log(`🔄 [StockSync] Atualizado: ${localProduct.nome} | ${localProduct.estoque} → ${newStock}`);
    return true;
  }

  /**
   * Desativa produto nas franquias se estoque zerou
   */
  private async handleZeroStock(productId: string, productName: string): Promise<void> {
    try {
      // Buscar vinculações com franqueadas
      const { data: franqueadas } = await supabaseAdmin
        .from('produtos_franqueadas')
        .select('id')
        .eq('produto_id', productId);

      if (franqueadas && franqueadas.length > 0) {
        const franqueadaIds = franqueadas.map(f => f.id);

        await supabaseAdmin
          .from('produtos_franqueadas_precos')
          .update({ ativo_no_site: false })
          .in('produto_franqueada_id', franqueadaIds);
      }

      // Desativar em reseller_products
      await supabaseAdmin
        .from('reseller_products')
        .update({ is_active: false })
        .eq('product_id', productId);

      console.log(`🚫 [StockSync] Produto desativado (estoque zerado): ${productName}`);
    } catch (error) {
      console.error(`❌ [StockSync] Erro ao desativar produto: ${error}`);
    }
  }

  /**
   * Executa a sincronização completa
   */
  async run(): Promise<SyncResult> {
    // Evita execuções paralelas
    if (this.isRunning) {
      console.warn('⚠️ [StockSync] Sincronização já em andamento. Ignorando...');
      return {
        success: false,
        processed: 0,
        updated: 0,
        unchanged: 0,
        errors: 0,
        duration_ms: 0,
        rate_limit_hits: 0,
        pages_fetched: 0,
        timestamp: new Date().toISOString(),
        error: 'Sincronização já em andamento',
      };
    }

    this.isRunning = true;
    this.rateLimitHits = 0;
    this.abortController = new AbortController();
    
    const startTime = Date.now();
    const result: SyncResult = {
      success: false,
      processed: 0,
      updated: 0,
      unchanged: 0,
      errors: 0,
      duration_ms: 0,
      rate_limit_hits: 0,
      pages_fetched: 0,
      timestamp: new Date().toISOString(),
    };

    console.log('\n' + '='.repeat(60));
    console.log('🔄 [StockSync] INICIANDO SINCRONIZAÇÃO DE ESTOQUE');
    console.log('='.repeat(60) + '\n');

    try {
      // 1. Buscar produtos da API (com paginação e throttling)
      const apiProducts = await this.fetchAllProducts();
      
      // 2. Buscar produtos locais
      const localProductsMap = await this.fetchLocalProducts();
      
      // 3. Processar cada produto
      console.log('\n📊 [StockSync] Comparando e atualizando estoques...\n');

      for (const apiProduct of apiProducts) {
        result.processed++;
        
        const externalId = String(apiProduct.id || apiProduct.codigo);
        const localProduct = localProductsMap.get(externalId);
        
        if (!localProduct) {
          // Produto não existe localmente - pode ser novo
          // O sync manual/webhook cuida de criar novos produtos
          continue;
        }

        const newStock = normalizeEstoque(apiProduct.estoque);
        
        try {
          const wasUpdated = await this.updateProductStock(localProduct, newStock);
          
          if (wasUpdated) {
            result.updated++;
            
            // Se estoque zerou, desativa nas franquias
            if (newStock === 0) {
              await this.handleZeroStock(localProduct.id, localProduct.nome);
            }
          } else {
            result.unchanged++;
          }
        } catch (error) {
          result.errors++;
          console.error(`❌ [StockSync] Erro ao processar ${apiProduct.nome}: ${error}`);
        }

        // Pequeno delay entre operações de banco (evita sobrecarga)
        if (result.processed % 50 === 0) {
          await sleep(100);
        }
      }

      result.success = true;
      result.rate_limit_hits = this.rateLimitHits;

    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      console.error(`❌ [StockSync] Erro fatal: ${result.error}`);
    } finally {
      this.isRunning = false;
      this.abortController = null;
      result.duration_ms = Date.now() - startTime;

      // Log de resultado
      console.log('\n' + '='.repeat(60));
      console.log('📊 [StockSync] RESULTADO DA SINCRONIZAÇÃO');
      console.log('='.repeat(60));
      console.log(`   Sucesso: ${result.success ? '✅' : '❌'}`);
      console.log(`   Processados: ${result.processed}`);
      console.log(`   Atualizados: ${result.updated}`);
      console.log(`   Inalterados: ${result.unchanged}`);
      console.log(`   Erros: ${result.errors}`);
      console.log(`   Rate Limit Hits: ${result.rate_limit_hits}`);
      console.log(`   Duração: ${(result.duration_ms / 1000).toFixed(2)}s`);
      console.log('='.repeat(60) + '\n');

      // Registrar log no banco
      await this.logSync(result);
    }

    return result;
  }

  /**
   * Cancela a sincronização em andamento
   */
  abort(): void {
    if (this.abortController) {
      console.log('🛑 [StockSync] Cancelando sincronização...');
      this.abortController.abort();
    }
  }

  /**
   * Registra log da sincronização no banco
   */
  private async logSync(result: SyncResult): Promise<void> {
    try {
      await supabaseAdmin.from('logs_sincronizacao').insert({
        tipo: 'polling_estoque',
        descricao: `Sync Polling: ${result.updated} atualizados de ${result.processed} processados`,
        payload: result,
        sucesso: result.success,
        erro: result.error || null,
      });
    } catch (error) {
      console.error('[StockSync] Erro ao registrar log:', error);
    }
  }

  /**
   * Retorna se está em execução
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

// ============ INSTÂNCIA SINGLETON ============

export const stockSyncService = new StockSyncService();

// ============ FUNÇÕES DE CONVENIÊNCIA ============

/**
 * Executa sincronização de estoque (função simples para uso externo)
 */
export async function syncEstoque(): Promise<SyncResult> {
  return stockSyncService.run();
}

/**
 * Cancela sincronização em andamento
 */
export function cancelSyncEstoque(): void {
  stockSyncService.abort();
}

/**
 * Verifica se sincronização está em andamento
 */
export function isSyncRunning(): boolean {
  return stockSyncService.isActive();
}

export default stockSyncService;
