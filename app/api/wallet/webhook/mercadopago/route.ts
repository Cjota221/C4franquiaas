import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Webhook do Mercado Pago para processar pagamentos PIX
// Este endpoint é chamado pelo Mercado Pago quando o PIX é pago

export async function POST(request: NextRequest) {
  try {
    // Criar cliente Supabase com service role (ignora RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )
    
    const body = await request.json()
    
    console.log('Webhook Mercado Pago recebido:', JSON.stringify(body, null, 2))
    
    // Mercado Pago envia notificações em diferentes formatos
    // Tipo: payment - notificação de pagamento
    if (body.type === 'payment' || body.action === 'payment.updated') {
      const paymentId = body.data?.id || body.id
      
      if (!paymentId) {
        console.error('Payment ID não encontrado no webhook')
        return NextResponse.json({ error: 'Payment ID não encontrado' }, { status: 400 })
      }
      
      // Buscar detalhes do pagamento no Mercado Pago
      const paymentDetails = await buscarPagamento(paymentId.toString())
      
      if (!paymentDetails) {
        console.error('Não foi possível buscar detalhes do pagamento')
        return NextResponse.json({ error: 'Erro ao buscar pagamento' }, { status: 500 })
      }
      
      console.log('Detalhes do pagamento:', JSON.stringify(paymentDetails, null, 2))
      
      // Verificar se é um pagamento de recarga de carteira
      const walletId = paymentDetails.metadata?.wallet_id
      
      if (!walletId) {
        // Não é uma recarga de carteira, ignorar
        console.log('Pagamento não é de recarga de carteira, ignorando')
        return NextResponse.json({ status: 'ignored' })
      }
      
      // Buscar recarga pendente
      const { data: recarga, error: recargaError } = await supabase
        .from('wallet_recargas')
        .select('*')
        .eq('pix_id', paymentId.toString())
        .single()
      
      if (recargaError && recargaError.code !== 'PGRST116') {
        console.error('Erro ao buscar recarga:', recargaError)
      }
      
      // Se não encontrou pelo pix_id, tentar pelo wallet_id
      let recargaParaAtualizar = recarga
      if (!recarga) {
        const { data: recargaPorWallet } = await supabase
          .from('wallet_recargas')
          .select('*')
          .eq('wallet_id', walletId)
          .eq('status', 'PENDENTE')
          .eq('valor', paymentDetails.transaction_amount)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        recargaParaAtualizar = recargaPorWallet
      }
      
      if (!recargaParaAtualizar) {
        console.error('Recarga não encontrada para wallet:', walletId)
        return NextResponse.json({ error: 'Recarga não encontrada' }, { status: 404 })
      }
      
      // Verificar status do pagamento
      if (paymentDetails.status === 'approved') {
        // Pagamento aprovado - creditar na carteira
        await processarPagamentoAprovado(supabase, recargaParaAtualizar, paymentDetails, body)
      } else if (['rejected', 'cancelled', 'refunded'].includes(paymentDetails.status)) {
        // Pagamento rejeitado/cancelado
        await supabase
          .from('wallet_recargas')
          .update({
            status: 'CANCELADO',
            webhook_payload: body,
            webhook_recebido_em: new Date().toISOString(),
            erro_mensagem: `Pagamento ${paymentDetails.status}`
          })
          .eq('id', recargaParaAtualizar.id)
      } else if (paymentDetails.status === 'pending') {
        // Ainda pendente, só atualizar webhook
        await supabase
          .from('wallet_recargas')
          .update({
            pix_id: paymentId.toString(),
            webhook_payload: body,
            webhook_recebido_em: new Date().toISOString()
          })
          .eq('id', recargaParaAtualizar.id)
      }
      
      return NextResponse.json({ status: 'processed' })
    }
    
    // Outros tipos de notificação
    return NextResponse.json({ status: 'ignored' })
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro no webhook:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// Buscar detalhes do pagamento no Mercado Pago
async function buscarPagamento(paymentId: string) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN_PROD || process.env.MERCADO_PAGO_ACCESS_TOKEN
    
    if (!accessToken) {
      console.error('MP_ACCESS_TOKEN não configurado')
      return null
    }
    
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    
    if (!response.ok) {
      console.error('Erro ao buscar pagamento:', response.statusText)
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error('Erro ao buscar pagamento:', error)
    return null
  }
}

// Processar pagamento aprovado - creditar na carteira
 
async function processarPagamentoAprovado(
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>,
  recarga: Record<string, unknown>,
  paymentDetails: Record<string, unknown>,
  webhookPayload: Record<string, unknown>
) {
  // Verificar se já foi processado (idempotência)
  if (recarga.processado || recarga.status === 'PAGO') {
    console.log('Recarga já processada, ignorando')
    return
  }
  
  // Iniciar transação atômica usando a função do banco
  const { data, error } = await supabase.rpc('creditar_carteira', {
    p_wallet_id: recarga.wallet_id,
    p_valor: recarga.valor,
    p_tipo: 'CREDITO_PIX',
    p_descricao: `Recarga via PIX - MP#${paymentDetails.id}`,
    p_referencia_tipo: 'pix',
    p_referencia_id: String(paymentDetails.id)
  })
  
  if (error) {
    console.error('Erro ao creditar carteira:', error)
    
    // Marcar recarga como erro
    await supabase
      .from('wallet_recargas')
      .update({
        status: 'ERRO',
        erro_mensagem: error.message,
        tentativas: (recarga.tentativas as number || 0) + 1,
        webhook_payload: webhookPayload,
        webhook_recebido_em: new Date().toISOString()
      })
      .eq('id', recarga.id)
    
    return
  }
  
  const resultado = data
  
  if (!resultado.success) {
    console.error('Erro na função creditar_carteira:', resultado.error)
    return
  }
  
  // Atualizar recarga como paga
  await supabase
    .from('wallet_recargas')
    .update({
      status: 'PAGO',
      pago_em: new Date().toISOString(),
      processado: true,
      transaction_id: resultado.transaction_id,
      webhook_payload: webhookPayload,
      webhook_recebido_em: new Date().toISOString()
    })
    .eq('id', recarga.id)
  
  console.log(`✅ Recarga processada com sucesso! Wallet ${recarga.wallet_id} creditada em R$ ${recarga.valor}`)
}

// GET - Verificar status (para debug)
export async function GET(_request: NextRequest) {
  return NextResponse.json({
    status: 'Webhook ativo',
    endpoint: '/api/wallet/webhook/mercadopago',
    methods: ['POST']
  })
}
