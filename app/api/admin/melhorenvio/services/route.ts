import { NextResponse } from 'next/server';
import { MelhorEnvioService } from '@/lib/melhor-envio-service';

/**
 * GET /api/admin/melhorenvio/services
 * Retorna lista de serviços de envio disponíveis
 */
export async function GET() {
  try {
    const services = await MelhorEnvioService.getServices();
    
    return NextResponse.json({
      success: true,
      services
    });
  } catch (error) {
    console.error('[Services API] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar serviços'
      },
      { status: 500 }
    );
  }
}
