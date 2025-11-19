import { schedule } from '@netlify/functions';

/**
 * Função Agendada para Sincronização Automática de Produtos
 * 
 * Esta função executa automaticamente a sincronização com FácilZap
 * a cada 15 minutos.
 * 
 * Padrões de cron disponíveis:
 * - "0 *​/15 * * * *" = A cada 15 minutos
 * - "0 *​/30 * * * *" = A cada 30 minutos  
 * - "0 0 * * * *"    = A cada 1 hora
 * - "0 0 *​/6 * * *"  = A cada 6 horas
 */

// Executar a cada 15 minutos
const CRON_PATTERN = '0 */15 * * * *';

export const handler = schedule(CRON_PATTERN, async () => {
  console.log('🔄 [Cron] Iniciando sincronização automática de produtos...');
  
  try {
    // URL base do site (Netlify fornece automaticamente)
    const baseUrl = process.env.URL || process.env.DEPLOY_URL || 'https://c4franquiaas.netlify.app';
    
    console.log(`📡 [Cron] Chamando: ${baseUrl}/api/sync-produtos`);
    
    // Chamar o endpoint de sincronização
    const response = await fetch(`${baseUrl}/api/sync-produtos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ [Cron] Sincronização concluída com sucesso!`);
      console.log(`📦 [Cron] Produtos importados: ${data.imported || 0}`);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Sincronização automática concluída',
          imported: data.imported || 0,
          timestamp: new Date().toISOString(),
        }),
      };
    } else {
      console.error('❌ [Cron] Erro na sincronização:', data);
      
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          error: 'Erro ao sincronizar produtos',
          details: data,
          timestamp: new Date().toISOString(),
        }),
      };
    }
  } catch (error) {
    console.error('❌ [Cron] Erro fatal:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Erro fatal na sincronização',
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      }),
    };
  }
});
