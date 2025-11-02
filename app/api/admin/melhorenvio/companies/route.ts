import { NextResponse } from 'next/server';
import { MelhorEnvioService } from '@/lib/melhor-envio-service';

/**
 * GET /api/admin/melhorenvio/companies
 * Retorna lista de transportadoras disponíveis
 */
export async function GET() {
  try {
    const companies = await MelhorEnvioService.getCompanies();
    
    return NextResponse.json({
      success: true,
      companies
    });
  } catch (error) {
    console.error('[Companies API] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar transportadoras'
      },
      { status: 500 }
    );
  }
}
