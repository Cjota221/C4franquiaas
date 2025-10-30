/**
 * API Route: Verificar Status de Pagamento
 * 
 * Endpoint: GET /api/mp-payment-status?paymentId=xxx
 * 
 * Consulta o status de um pagamento no Mercado Pago
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMercadoPagoCredentials } from '@/lib/utils/mp-credentials';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId é obrigatório' },
        { status: 400 }
      );
    }

    // Obter credenciais
    const credentials = await getMercadoPagoCredentials();
    const { accessToken } = credentials;

    // Consultar status
    const mpApiUrl = `https://api.mercadopago.com/v1/payments/${paymentId}`;
    
    const response = await fetch(mpApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ [MP Status] Erro ao consultar pagamento:', error);
      return NextResponse.json(
        { error: 'Erro ao consultar pagamento', details: error },
        { status: response.status }
      );
    }

    const payment = await response.json();

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.status_detail,
      paymentMethod: payment.payment_method_id,
      amount: payment.transaction_amount,
      dateApproved: payment.date_approved,
      dateCreated: payment.date_created,
    });

  } catch (error) {
    console.error('❌ [MP Status] Erro fatal:', error);
    return NextResponse.json(
      { error: 'Erro interno ao consultar status' },
      { status: 500 }
    );
  }
}
