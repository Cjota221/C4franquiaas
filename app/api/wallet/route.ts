import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// API principal da carteira - GET dados, POST criar carteira
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const { user, error: authError } = await getAuthUser(authHeader)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // Buscar reseller pelo email do usuário autenticado
    const { data: reseller, error: resellerError } = await supabaseAdmin
      .from('resellers')
      .select('id')
      .eq('email', user.email)
      .single()
    
    if (resellerError || !reseller) {
      console.error('Reseller não encontrado:', user.email)
      return NextResponse.json({ error: 'Revendedora não encontrada' }, { status: 404 })
    }
    
    const revendedoraId = reseller.id
    
    // Buscar carteira do usuário
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('revendedora_id', revendedoraId)
      .single()
    
    if (walletError && walletError.code !== 'PGRST116') {
      console.error('Erro ao buscar carteira:', walletError)
      return NextResponse.json({ error: 'Erro ao buscar carteira' }, { status: 500 })
    }
    
    // Se não existe, criar automaticamente
    if (!wallet) {
      const { data: novaCarteira, error: criarError } = await supabaseAdmin
        .from('wallets')
        .insert({ revendedora_id: revendedoraId })
        .select()
        .single()
      
      if (criarError) {
        console.error('Erro ao criar carteira:', criarError)
        return NextResponse.json({ error: 'Erro ao criar carteira' }, { status: 500 })
      }
      
      return NextResponse.json({
        wallet: novaCarteira,
        extrato: [],
        reservas: { total: 0, valor: 0 }
      })
    }
    
    // Buscar extrato recente
    const { data: extrato } = await supabaseAdmin
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Buscar resumo de reservas ativas
    const { data: reservasAtivas } = await supabaseAdmin
      .from('reservas')
      .select('id, preco_total')
      .eq('wallet_id', wallet.id)
      .in('status', ['RESERVADO', 'EM_SEPARACAO', 'SEPARADO'])
    
    const reservas = {
      total: reservasAtivas?.length || 0,
      valor: reservasAtivas?.reduce((acc, r) => acc + r.preco_total, 0) || 0
    }
    
    // Buscar configurações
    const { data: configData } = await supabaseAdmin
      .from('wallet_config')
      .select('chave, valor')
      .in('chave', ['recarga_minima', 'recarga_maxima'])
    
    const config = {
      recarga_minima: parseFloat(configData?.find(c => c.chave === 'recarga_minima')?.valor || '25'),
      recarga_maxima: parseFloat(configData?.find(c => c.chave === 'recarga_maxima')?.valor || '5000')
    }
    
    return NextResponse.json({
      wallet,
      extrato: extrato || [],
      reservas,
      config
    })
    
  } catch (error) {
    console.error('Erro na API wallet:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}

// Buscar extrato completo
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const { user, error: authError } = await getAuthUser(authHeader)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { action, ...params } = body
    
    // Buscar carteira
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('id')
      .eq('revendedora_id', user.id)
      .single()
    
    if (!wallet) {
      return NextResponse.json({ error: 'Carteira não encontrada' }, { status: 404 })
    }
    
    if (action === 'extrato') {
      // Buscar extrato com filtros
      let query = supabaseAdmin
        .from('wallet_transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
      
      if (params.tipo) {
        query = query.eq('tipo', params.tipo)
      }
      
      if (params.data_inicio) {
        query = query.gte('created_at', params.data_inicio)
      }
      
      if (params.data_fim) {
        query = query.lte('created_at', params.data_fim)
      }
      
      const limit = params.limit || 50
      const offset = params.offset || 0
      query = query.range(offset, offset + limit - 1)
      
      const { data: extrato, error, count } = await query
      
      if (error) {
        return NextResponse.json({ error: 'Erro ao buscar extrato' }, { status: 500 })
      }
      
      return NextResponse.json({
        extrato,
        total: count,
        has_more: (extrato?.length || 0) >= limit
      })
    }
    
    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro na API wallet:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
