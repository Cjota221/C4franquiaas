import { schedule } from '@netlify/functions';

/**
 * Função Agendada para Sincronização Automática de Produtos
 * 
 * Executa sincronização com FácilZap a cada 1 minuto
 * para manter estoque sempre atualizado em tempo real
 */

// Executar a cada 1 minuto (atualização em tempo real)
const CRON_PATTERN = '0 */1 * * * *';

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
