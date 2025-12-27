/**
 * API Route: Sincronização de Estoque via Polling
 * 
 * GET  - Retorna status do serviço
 * POST - Executa sincronização manual
 */

import { NextResponse } from 'next/server';
import { syncEstoque, isSyncRunning } from '@/lib/services/stockSyncService';

export const maxDuration = 300; // 5 minutos máximo (Netlify/Vercel)

export async function GET() {
  return NextResponse.json({
    service: 'Stock Sync Service (Polling)',
    status: isSyncRunning() ? 'running' : 'idle',
    description: 'Sincronização de estoque via polling da API FácilZap',
    schedule: 'A cada 2 minutos (Cron)',
    rate_limits: {
      api_limit: '2 req/segundo',
      daily_limit: '172.800 req/dia',
      throttle_delay: '1.2s entre páginas',
    },
    endpoints: {
      manual_trigger: 'POST /api/sync-estoque-polling',
      status: 'GET /api/sync-estoque-polling',
    },
    timestamp: new Date().toISOString(),
  });
}

export async function POST() {
  // Verificar se já está em execução
  if (isSyncRunning()) {
    return NextResponse.json({
      success: false,
      error: 'Sincronização já em andamento',
      message: 'Aguarde a conclusão da sincronização atual',
    }, { status: 409 }); // Conflict
  }

  console.log('🔄 [API] Iniciando sincronização de estoque via polling...');

  try {
    const result = await syncEstoque();

    return NextResponse.json({
      success: result.success,
      message: result.success 
        ? `Sincronização concluída: ${result.updated} produtos atualizados`
        : `Sincronização falhou: ${result.error}`,
      result,
    }, { status: result.success ? 200 : 500 });

  } catch (error) {
    console.error('❌ [API] Erro na sincronização:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }, { status: 500 });
  }
}
