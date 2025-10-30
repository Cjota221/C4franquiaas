/**
 * API Route: Obter Public Key do Mercado Pago
 * 
 * Endpoint: GET /api/mp-public-key
 * 
 * Retorna a chave pública apropriada (teste ou produção) para uso no frontend
 */

import { NextResponse } from 'next/server';
import { getMercadoPagoPublicKey } from '@/lib/utils/mp-credentials';

export async function GET() {
  try {
    const publicKey = await getMercadoPagoPublicKey();
    
    return NextResponse.json({
      publicKey,
      success: true,
    });
  } catch (error) {
    console.error('❌ [MP Public Key API] Erro:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao obter Public Key do Mercado Pago',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
