import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// API principal da carteira - GET dados, POST criar carteira
export async function GET(_request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // Buscar carteira do usuário
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('*')
      .eq('revendedora_id', user.id)
      .single()
    
    if (walletError && walletError.code !== 'PGRST116') {
      console.error('Erro ao buscar carteira:', walletError)
      return NextResponse.json({ error: 'Erro ao buscar carteira' }, { status: 500 })
    }
    
    // Se não existe, criar automaticamente
    if (!wallet) {
      const { data: novaCarteira, error: criarError } = await supabase
        .from('wallets')
        .insert({ revendedora_id: user.id })
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
    const { data: extrato } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .limit(10)
    
    // Buscar resumo de reservas ativas
    const { data: reservasAtivas } = await supabase
      .from('reservas')
      .select('id, preco_total')
      .eq('wallet_id', wallet.id)
      .in('status', ['RESERVADO', 'EM_SEPARACAO', 'SEPARADO'])
    
    const reservas = {
      total: reservasAtivas?.length || 0,
      valor: reservasAtivas?.reduce((acc, r) => acc + r.preco_total, 0) || 0
    }
    
    // Buscar configurações
    const { data: configData } = await supabase
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
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { action, ...params } = body
    
    // Buscar carteira
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('revendedora_id', user.id)
      .single()
    
    if (!wallet) {
      return NextResponse.json({ error: 'Carteira não encontrada' }, { status: 404 })
    }
    
    if (action === 'extrato') {
      // Buscar extrato com filtros
      let query = supabase
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
