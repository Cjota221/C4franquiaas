import { NextRequest, NextResponse } from 'next/server';
import { MelhorEnvioService } from '@/lib/melhor-envio-service';

/**
 * POST /api/shipping/calculate
 * Calcula frete para um pedido
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { to, from, package: pkg } = body;

    // Validações
    if (!to?.postal_code) {
      return NextResponse.json(
        { success: false, error: 'CEP de destino obrigatório' },
        { status: 400 }
      );
    }

    // Preparar dados para o Melhor Envio
    const input = {
      from: {
        postal_code: from?.postal_code || '13560340', // CEP padrão (configure o seu)
      },
      to: {
        postal_code: to.postal_code.replace(/\D/g, ''),
      },
      package: {
        weight: pkg?.weight || 1,
        width: pkg?.width || 20,
        height: pkg?.height || 10,
        length: pkg?.length || 30,
      },
    };

    console.log('[Shipping Calculate] Input:', input);

    // Chamar Melhor Envio
    const quotes = await MelhorEnvioService.calcularFrete(input);

    console.log('[Shipping Calculate] Quotes recebidas:', quotes?.length || 0);

    // Se não houver cotações, retornar erro amigável
    if (!quotes || quotes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhuma opção de envio disponível para este CEP',
        quotes: [],
      });
    }

    // Ordenar por preço (mais barato primeiro)
    const sortedQuotes = quotes.sort((a: { price?: string; custom_price?: string }, b: { price?: string; custom_price?: string }) => {
      const priceA = parseFloat(a.price || a.custom_price || '0');
      const priceB = parseFloat(b.price || b.custom_price || '0');
      return priceA - priceB;
    });

    return NextResponse.json({
      success: true,
      quotes: sortedQuotes,
      total: sortedQuotes.length,
    });

  } catch (error) {
    console.error('[Shipping Calculate] Erro:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao calcular frete',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
