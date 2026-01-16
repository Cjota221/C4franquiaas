import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// API para criar recarga PIX na carteira
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { wallet_id, valor } = body
    
    if (!wallet_id || !valor) {
      return NextResponse.json({ error: 'wallet_id e valor são obrigatórios' }, { status: 400 })
    }
    
    // Buscar configurações
    const { data: configMinima } = await supabase
      .from('wallet_config')
      .select('valor')
      .eq('chave', 'recarga_minima')
      .single()
    
    const { data: configMaxima } = await supabase
      .from('wallet_config')
      .select('valor')
      .eq('chave', 'recarga_maxima')
      .single()
    
    const minimo = parseFloat(configMinima?.valor || '150')
    const maximo = parseFloat(configMaxima?.valor || '5000')
    
    if (valor < minimo) {
      return NextResponse.json({ 
        error: `Valor mínimo de recarga é R$ ${minimo.toFixed(2)}` 
      }, { status: 400 })
    }
    
    if (valor > maximo) {
      return NextResponse.json({ 
        error: `Valor máximo de recarga é R$ ${maximo.toFixed(2)}` 
      }, { status: 400 })
    }
    
    // Verificar se carteira pertence ao usuário
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('id', wallet_id)
      .eq('revendedora_id', user.id)
      .single()
    
    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Carteira não encontrada' }, { status: 404 })
    }
    
    if (wallet.status !== 'ativo') {
      return NextResponse.json({ error: 'Carteira bloqueada' }, { status: 400 })
    }
    
    // Verificar se já existe recarga pendente não expirada
    const { data: recargaPendente } = await supabase
      .from('wallet_recargas')
      .select('*')
      .eq('wallet_id', wallet_id)
      .eq('status', 'PENDENTE')
      .gt('pix_expiracao', new Date().toISOString())
      .single()
    
    if (recargaPendente) {
      return NextResponse.json({
        success: true,
        recarga: recargaPendente,
        message: 'Já existe uma recarga pendente'
      })
    }
    
    // Criar PIX via Mercado Pago (ou mock para desenvolvimento)
    let pixData
    const mpToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN_PROD || process.env.MERCADO_PAGO_ACCESS_TOKEN
    
    if (mpToken) {
      // Integração real com Mercado Pago
      pixData = await criarPixMercadoPago(valor, wallet_id)
    } else {
      // Mock para desenvolvimento
      pixData = {
        pix_id: `DEV_${Date.now()}`,
        pix_qrcode: '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426614174000520400005303986540510.005802BR5925TESTE PIX MOCK6009SAO PAULO62070503***6304ABCD',
        pix_qrcode_base64: null,
        pix_copia_cola: '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-426614174000520400005303986540510.005802BR5925TESTE PIX MOCK6009SAO PAULO62070503***6304ABCD',
        pix_expiracao: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutos
      }
    }
    
    // Criar registro de recarga
    const { data: recarga, error: recargaError } = await supabase
      .from('wallet_recargas')
      .insert({
        wallet_id,
        valor,
        status: 'PENDENTE',
        ...pixData
      })
      .select()
      .single()
    
    if (recargaError) {
      console.error('Erro ao criar recarga:', recargaError)
      return NextResponse.json({ error: 'Erro ao criar recarga' }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      recarga
    })
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro na API de recarga:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// Função auxiliar para criar PIX no Mercado Pago
async function criarPixMercadoPago(valor: number, walletId: string) {
  const accessToken = process.env.MP_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN_PROD || process.env.MERCADO_PAGO_ACCESS_TOKEN
  
  const response = await fetch('https://api.mercadopago.com/v1/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `wallet_${walletId}_${Date.now()}`
    },
    body: JSON.stringify({
      transaction_amount: valor,
      description: 'Recarga C4 Wallet',
      payment_method_id: 'pix',
      payer: {
        email: 'cliente@email.com' // Idealmente pegar do usuário
      },
      metadata: {
        wallet_id: walletId,
        tipo: 'recarga_wallet'
      }
    })
  })
  
  const data = await response.json()
  
  if (!response.ok) {
    throw new Error(data.message || 'Erro ao criar PIX')
  }
  
  return {
    pix_id: data.id.toString(),
    pix_qrcode: data.point_of_interaction?.transaction_data?.qr_code,
    pix_qrcode_base64: data.point_of_interaction?.transaction_data?.qr_code_base64,
    pix_copia_cola: data.point_of_interaction?.transaction_data?.qr_code,
    pix_expiracao: data.date_of_expiration
  }
}

// GET - Buscar recargas do usuário
export async function GET(_request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // Buscar carteira do usuário
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('revendedora_id', user.id)
      .single()
    
    if (!wallet) {
      return NextResponse.json({ error: 'Carteira não encontrada' }, { status: 404 })
    }
    
    // Buscar recargas
    const { data: recargas, error } = await supabase
      .from('wallet_recargas')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) {
      return NextResponse.json({ error: 'Erro ao buscar recargas' }, { status: 500 })
    }
    
    return NextResponse.json({ recargas })
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro ao buscar recargas:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
