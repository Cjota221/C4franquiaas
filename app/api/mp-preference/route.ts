/**
 * API Route: Criar Preferência de Pagamento no Mercado Pago
 * 
 * Endpoint: POST /api/mp-preference
 * 
 * Cria uma preferência de pagamento no Mercado Pago e retorna
 * o init_point (link de checkout) para o frontend.
 * 
 * SEGURANÇA: Access Token é usado apenas no servidor.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMercadoPagoCredentials } from '@/lib/utils/mp-credentials';

interface PreferenceItem {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  currency_id: string;
  picture_url?: string;
}

interface PreferencePayload {
  lojaId: string;
  items: PreferenceItem[];
  payer: {
    email: string;
    name?: string;
    identification?: {
      type: string;
      number: string;
    };
  };
  external_reference?: string; // ID do pedido no seu sistema
  notification_url?: string;
  back_urls?: {
    success: string;
    failure: string;
    pending: string;
  };
}

/**
 * POST /api/mp-preference
 * Cria uma preferência de pagamento
 */
export async function POST(request: NextRequest) {
  try {
    const payload: PreferencePayload = await request.json();
    const { lojaId, items, payer, external_reference, back_urls } = payload;

    console.log(`💳 [MP Preference] Criando preferência para loja ${lojaId}...`);

    // 1. Obter credenciais seguras
    const { accessToken, isProduction } = await getMercadoPagoCredentials(lojaId);

    // 2. Validar dados
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Nenhum item fornecido' },
        { status: 400 }
      );
    }

    if (!payer?.email) {
      return NextResponse.json(
        { error: 'E-mail do pagador é obrigatório' },
        { status: 400 }
      );
    }

    // 3. Montar payload da preferência
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const preferenceData = {
      items: items.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: item.currency_id || 'BRL',
        picture_url: item.picture_url,
      })),
      payer: {
        email: payer.email,
        name: payer.name,
        identification: payer.identification,
      },
      external_reference: external_reference || `PEDIDO-${Date.now()}`,
      notification_url: `${baseUrl}/api/mp-webhook`,
      back_urls: back_urls || {
        success: `${baseUrl}/pedido/sucesso`,
        failure: `${baseUrl}/pedido/falha`,
        pending: `${baseUrl}/pedido/pendente`,
      },
      auto_return: 'approved' as const,
      statement_descriptor: 'C4 FRANQUIAS',
      binary_mode: false,
      payment_methods: {
        excluded_payment_types: [],
        installments: 12, // Até 12 parcelas
      },
    };

    console.log('📦 [MP Preference] Payload:', JSON.stringify(preferenceData, null, 2));

    // 4. Chamar API do Mercado Pago
    const mpApiUrl = 'https://api.mercadopago.com/checkout/preferences';
    
    const response = await fetch(mpApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(preferenceData),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ [MP Preference] Erro na API do MP:', result);
      return NextResponse.json(
        {
          error: 'Erro ao criar preferência no Mercado Pago',
          details: result.message || result.error,
        },
        { status: response.status }
      );
    }

    console.log('✅ [MP Preference] Preferência criada:', result.id);

    // 5. Retornar dados da preferência
    return NextResponse.json({
      success: true,
      preference_id: result.id,
      init_point: result.init_point, // Link do checkout
      sandbox_init_point: result.sandbox_init_point,
      is_production: isProduction,
      external_reference: result.external_reference,
    });

  } catch (error) {
    console.error('❌ [MP Preference] Erro fatal:', error);
    
    return NextResponse.json(
      {
        error: 'Erro interno ao criar preferência',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/mp-preference
 * Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Mercado Pago - Preference API',
    version: '1.0.0',
  });
}
