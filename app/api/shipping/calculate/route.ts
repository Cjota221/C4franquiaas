import { NextRequest, NextResponse } from 'next/server';
import { MelhorEnvioService } from '@/lib/melhor-envio-service';

/**
 * POST /api/shipping/calculate
 * Calcula frete para um pedido
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[Shipping Calculate] Body recebido:', JSON.stringify(body, null, 2));
    
    const { to, from, package: pkg } = body;

    // Validações
    if (!to?.postal_code) {
      console.error('[Shipping Calculate] CEP de destino não fornecido');
      return NextResponse.json(
        { success: false, error: 'CEP de destino obrigatório' },
        { status: 400 }
      );
    }

    // Limpar e validar CEPs
    const toCep = to.postal_code.toString().replace(/\D/g, '');
    const fromCep = (from?.postal_code || '13560340').toString().replace(/\D/g, '');
    
    console.log('[Shipping Calculate] CEPs limpos:', {
      to_original: to.postal_code,
      to_clean: toCep,
      from_original: from?.postal_code,
      from_clean: fromCep
    });
    
    // Validar tamanho dos CEPs
    if (toCep.length !== 8) {
      console.error('[Shipping Calculate] CEP de destino inválido:', toCep, 'length:', toCep.length);
      return NextResponse.json(
        { success: false, error: `CEP de destino inválido: "${to.postal_code}". Deve ter 8 dígitos.` },
        { status: 400 }
      );
    }
    
    if (fromCep.length !== 8) {
      console.error('[Shipping Calculate] CEP de origem inválido:', fromCep, 'length:', fromCep.length);
      return NextResponse.json(
        { success: false, error: `CEP de origem inválido: "${from?.postal_code}". Deve ter 8 dígitos.` },
        { status: 400 }
      );
    }

    // Preparar dados para o Melhor Envio
    const input = {
      from: {
        postal_code: fromCep,
      },
      to: {
        postal_code: toCep,
      },
      package: {
        weight: pkg?.weight || 1,
        width: pkg?.width || 20,
        height: pkg?.height || 10,
        length: pkg?.length || 30,
      },
    };

    console.log('[Shipping Calculate] Input preparado:', JSON.stringify(input, null, 2));

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
