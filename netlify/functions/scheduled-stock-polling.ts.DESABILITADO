/**
 * Netlify Scheduled Function: Stock Sync Polling
 * 
 * Executa a cada 2 minutos para sincronizar estoque da API FácilZap.
 * Respeita rate limits (2 req/s) com throttling entre requisições.
 * 
 * Schedule: every 2 minutes
 */

import type { Config } from '@netlify/functions';

const handler = async () => {
  console.log('🕐 [Cron] Iniciando sincronização de estoque (polling)...');
  
  const startTime = Date.now();
  
  try {
    const baseUrl = process.env.URL || process.env.DEPLOY_URL || 'https://c4franquiaas.netlify.app';
    
    console.log(`📡 [Cron] Chamando: ${baseUrl}/api/sync-estoque-polling`);
    
    const response = await fetch(`${baseUrl}/api/sync-estoque-polling`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    if (response.ok && data.success) {
      console.log(`✅ [Cron] Sincronização concluída em ${(duration / 1000).toFixed(2)}s`);
      console.log(`📊 [Cron] Processados: ${data.result?.processed || 0}`);
      console.log(`🔄 [Cron] Atualizados: ${data.result?.updated || 0}`);
      console.log(`⚪ [Cron] Inalterados: ${data.result?.unchanged || 0}`);
      console.log(`⚠️ [Cron] Rate Limit Hits: ${data.result?.rate_limit_hits || 0}`);
      
      return new Response(JSON.stringify({
        success: true,
        ...data.result,
        cron_duration_ms: duration,
        timestamp: new Date().toISOString(),
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      // Pode ser 409 (já em execução) ou 500 (erro)
      console.warn(`⚠️ [Cron] Resposta: ${response.status}`);
      console.warn(`⚠️ [Cron] Mensagem: ${data.message || data.error}`);
      
      return new Response(JSON.stringify({
        success: false,
        status: response.status,
        message: data.message || data.error,
        cron_duration_ms: duration,
      }), {
        status: response.status === 409 ? 200 : 500, // 409 é esperado, não é erro
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ [Cron] Erro fatal:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      cron_duration_ms: duration,
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export default handler;

// ⏰ Cron Schedule: A cada 2 minutos
export const config: Config = {
  schedule: '*/2 * * * *',
};
