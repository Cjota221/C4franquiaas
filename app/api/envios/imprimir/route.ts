import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MelhorEnvioService } from '@/lib/melhor-envio-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API para imprimir etiquetas
 * POST /api/envios/imprimir
 * 
 * Body: {
 *   order_ids: string[] // IDs do Melhor Envio
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { order_ids } = await request.json();

    if (!order_ids || order_ids.length === 0) {
      return NextResponse.json(
        { error: 'order_ids é obrigatório' },
        { status: 400 }
      );
    }

    console.log('[Imprimir Etiquetas] IDs:', order_ids);

    // Gerar URL do PDF com as etiquetas
    const result = await MelhorEnvioService.imprimirEtiqueta(order_ids, 'private');

    // Marcar como impressas no banco
    await supabase
      .from('pedidos_envio')
      .update({
        etiqueta_impressa: true,
        etiqueta_url: result.url,
      })
      .in('melhorenvio_order_id', order_ids);

    return NextResponse.json({
      success: true,
      pdf_url: result.url,
      message: `${order_ids.length} etiqueta(s) gerada(s)`,
    });
  } catch (error: unknown) {
    console.error('[Imprimir Etiquetas] Erro:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao imprimir etiquetas' },
      { status: 500 }
    );
  }
}
