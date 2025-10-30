/**
 * API Route: Processar Pagamento Direto (Checkout Transparente)
 * 
 * Endpoint: POST /api/mp-payment
 * 
 * Processa pagamentos diretos via PIX ou Cartão sem redirecionar o cliente.
 * 
 * SEGURANÇA: Access Token usado apenas no servidor.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMercadoPagoCredentials } from '@/lib/utils/mp-credentials';

interface PaymentPayload {
  paymentMethod: 'pix' | 'credit_card';
  amount: number;
  description: string;
  payer: {
    email: string;
    firstName: string;
    lastName: string;
    identification: {
      type: string;
      number: string;
    };
  };
  // Para cartão de crédito
  token?: string; // Token gerado pelo SDK no frontend
  installments?: number;
  // Metadados
  external_reference?: string;
  items?: Array<{
    id: string;
    title: string;
    quantity: number;
    unit_price: number;
  }>;
}

/**
 * POST /api/mp-payment
 * Processa pagamento PIX ou Cartão
 */
export async function POST(request: NextRequest) {
  try {
    const payload: PaymentPayload = await request.json();
    const { paymentMethod, amount, description, payer, token, installments, external_reference, items } = payload;

    console.log(`💳 [MP Payment] Processando pagamento ${paymentMethod.toUpperCase()}...`);
    console.log(`💰 [MP Payment] Valor: R$ ${amount.toFixed(2)}`);

    // 1. Obter credenciais
    const credentials = await getMercadoPagoCredentials();
    const { accessToken, isProduction } = credentials;

    console.log(`🔑 [MP Payment] Modo: ${isProduction ? 'PRODUÇÃO' : 'TESTE'}`);

    // 2. Montar payload base
    const basePayload = {
      transaction_amount: amount,
      description,
      payment_method_id: paymentMethod === 'pix' ? 'pix' : undefined,
      payer: {
        email: payer.email,
        first_name: payer.firstName,
        last_name: payer.lastName,
        identification: {
          type: payer.identification.type,
          number: payer.identification.number,
        },
      },
      external_reference: external_reference || `PAGAMENTO-${Date.now()}`,
      notification_url: `https://c4franquiaas.netlify.app/api/mp-webhook`,
      metadata: {
        items: items || [],
      },
    };

    let paymentPayload;

    // 3. Configurar payload específico por método
    if (paymentMethod === 'pix') {
      paymentPayload = {
        ...basePayload,
        payment_method_id: 'pix',
      };
    } else if (paymentMethod === 'credit_card') {
      if (!token) {
        return NextResponse.json(
          { error: 'Token do cartão é obrigatório' },
          { status: 400 }
        );
      }

      paymentPayload = {
        ...basePayload,
        token, // Token gerado pelo SDK
        installments: installments || 1,
        statement_descriptor: 'C4 FRANQUIAS',
      };
    } else {
      return NextResponse.json(
        { error: 'Método de pagamento inválido' },
        { status: 400 }
      );
    }

    console.log('📦 [MP Payment] Payload:', JSON.stringify(paymentPayload, null, 2));

    // 4. Chamar API do Mercado Pago
    const mpApiUrl = 'https://api.mercadopago.com/v1/payments';
    
    const response = await fetch(mpApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'X-Idempotency-Key': `${external_reference}-${Date.now()}`, // Evita duplicação
      },
      body: JSON.stringify(paymentPayload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('❌ [MP Payment] Erro na API do MP:', result);
      return NextResponse.json(
        {
          error: 'Erro ao processar pagamento',
          details: result.message || result.error,
          status: result.status,
        },
        { status: response.status }
      );
    }

    console.log('✅ [MP Payment] Pagamento criado:', result.id);
    console.log(`📊 [MP Payment] Status: ${result.status}`);

    // 5. Preparar resposta baseada no método
    if (paymentMethod === 'pix') {
      // Para PIX, retornar QR Code e código copia-e-cola
      const pixData = result.point_of_interaction?.transaction_data;
      
      return NextResponse.json({
        success: true,
        paymentId: result.id,
        status: result.status,
        paymentMethod: 'pix',
        pix: {
          qrCode: pixData?.qr_code, // Código para gerar QR Code
          qrCodeBase64: pixData?.qr_code_base64, // Imagem do QR Code
          copyPasteCode: pixData?.qr_code, // Código copia-e-cola
          expirationDate: pixData?.expiration_date,
        },
        external_reference: result.external_reference,
      });
    } else {
      // Para cartão, retornar status do pagamento
      return NextResponse.json({
        success: true,
        paymentId: result.id,
        status: result.status, // approved, pending, rejected, etc
        statusDetail: result.status_detail,
        paymentMethod: 'credit_card',
        card: {
          last4: result.card?.last_four_digits,
          paymentMethodId: result.payment_method_id,
        },
        external_reference: result.external_reference,
        message: getPaymentMessage(result.status, result.status_detail),
      });
    }

  } catch (error) {
    console.error('❌ [MP Payment] Erro fatal:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno ao processar pagamento',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * Retorna mensagem amigável baseada no status
 */
function getPaymentMessage(status: string, statusDetail: string): string {
  if (status === 'approved') {
    return 'Pagamento aprovado! ✅';
  }
  
  if (status === 'pending') {
    return 'Pagamento pendente de aprovação';
  }
  
  if (status === 'rejected') {
    const messages: Record<string, string> = {
      'cc_rejected_insufficient_amount': 'Saldo insuficiente no cartão',
      'cc_rejected_bad_filled_security_code': 'Código de segurança inválido',
      'cc_rejected_bad_filled_date': 'Data de validade inválida',
      'cc_rejected_bad_filled_other': 'Dados do cartão inválidos',
      'cc_rejected_high_risk': 'Pagamento recusado por risco',
      'cc_rejected_duplicated_payment': 'Pagamento duplicado',
      'cc_rejected_card_disabled': 'Cartão desabilitado',
      'cc_rejected_call_for_authorize': 'Entre em contato com o banco',
    };
    
    return messages[statusDetail] || 'Pagamento recusado. Tente outro cartão.';
  }
  
  return 'Status do pagamento: ' + status;
}
