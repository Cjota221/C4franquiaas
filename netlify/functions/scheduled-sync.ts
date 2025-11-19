import type { Config } from '@netlify/functions';

const handler = async () => {
  console.log('🔄 [Cron] Iniciando sincronização automática de produtos...');
  
  try {
    const baseUrl = process.env.URL || process.env.DEPLOY_URL || 'https://c4franquiaas.netlify.app';
    
    console.log(`📡 [Cron] Chamando: ${baseUrl}/api/sync-produtos`);
    
    const response = await fetch(`${baseUrl}/api/sync-produtos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ [Cron] Sincronização concluída!`);
      console.log(`📦 [Cron] Produtos: ${data.imported || 0}`);
      
      return new Response(JSON.stringify({
        success: true,
        imported: data.imported || 0,
        timestamp: new Date().toISOString(),
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      console.error('❌ [Cron] Erro:', data);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao sincronizar',
        details: data,
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('❌ [Cron] Erro fatal:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export default handler;

export const config: Config = {
  schedule: '*/5 * * * *',
};
