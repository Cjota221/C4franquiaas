import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// API para fazer reserva de produto (Modo Caixinha)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const { user, error: authError } = await getAuthUser(authHeader)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { produto_id, quantidade = 1, preco_unitario } = body
    
    if (!produto_id || !preco_unitario) {
      return NextResponse.json({ error: 'produto_id e preco_unitario são obrigatórios' }, { status: 400 })
    }
    
    // Buscar reseller pelo email
    const { data: reseller } = await supabaseAdmin
      .from('resellers')
      .select('id')
      .eq('email', user.email)
      .single()
    
    if (!reseller) {
      return NextResponse.json({ error: 'Revendedora não encontrada' }, { status: 404 })
    }
    
    // Buscar carteira do usuário
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('revendedora_id', reseller.id)
      .single()
    
    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Carteira não encontrada' }, { status: 404 })
    }
    
    if (wallet.status !== 'ativo') {
      return NextResponse.json({ error: 'Carteira bloqueada' }, { status: 400 })
    }
    
    const precoTotal = preco_unitario * quantidade
    const saldoDisponivel = wallet.saldo - wallet.saldo_bloqueado
    
    if (saldoDisponivel < precoTotal) {
      return NextResponse.json({ 
        error: 'Saldo insuficiente',
        saldo_disponivel: saldoDisponivel,
        valor_necessario: precoTotal
      }, { status: 400 })
    }
    
    // Criar reserva
    const { data: reserva, error: reservaError } = await supabaseAdmin
      .from('reservas')
      .insert({
        wallet_id: wallet.id,
        produto_id,
        quantidade,
        preco_unitario,
        preco_total: precoTotal,
        status: 'RESERVADO'
      })
      .select()
      .single()
    
    if (reservaError) {
      console.error('Erro ao criar reserva:', reservaError)
      return NextResponse.json({ error: 'Erro ao criar reserva' }, { status: 500 })
    }
    
    // Bloquear saldo
    const { error: bloqueioError } = await supabaseAdmin
      .from('wallets')
      .update({ saldo_bloqueado: wallet.saldo_bloqueado + precoTotal })
      .eq('id', wallet.id)
    
    if (bloqueioError) {
      // Reverter reserva
      await supabaseAdmin.from('reservas').delete().eq('id', reserva.id)
      return NextResponse.json({ error: 'Erro ao bloquear saldo' }, { status: 500 })
    }
    
    // Registrar transação
    await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        tipo: 'BLOQUEIO_RESERVA',
        valor: precoTotal,
        descricao: `Reserva do produto ${produto_id}`,
        referencia_tipo: 'reserva',
        referencia_id: reserva.id
      })
    
    return NextResponse.json({
      success: true,
      reserva,
      saldo_atualizado: wallet.saldo - wallet.saldo_bloqueado - precoTotal
    })
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro na API de reserva:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// GET - Buscar reservas do usuário
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const { user, error: authError } = await getAuthUser(authHeader)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    // Buscar reseller pelo email
    const { data: reseller } = await supabaseAdmin
      .from('resellers')
      .select('id')
      .eq('email', user.email)
      .single()
    
    if (!reseller) {
      return NextResponse.json({ reservas: [] })
    }
    
    // Buscar carteira do usuário
    const { data: wallet } = await supabaseAdmin
      .from('wallets')
      .select('id')
      .eq('revendedora_id', reseller.id)
      .single()
    
    if (!wallet) {
      // Se não tem carteira, retorna lista vazia (não é erro)
      return NextResponse.json({ reservas: [] })
    }
    
    // Buscar reservas (sem JOIN para evitar erros)
    let query = supabaseAdmin
      .from('reservas')
      .select('*')
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
    
    if (status) {
      const statusArray = status.split(',')
      query = query.in('status', statusArray)
    }
    
    const { data: reservas, error } = await query
    
    if (error) {
      console.error('Erro ao buscar reservas:', error)
      // Retorna lista vazia em vez de erro
      return NextResponse.json({ reservas: [] })
    }
    
    return NextResponse.json({ reservas: reservas || [] })
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro ao buscar reservas:', error)
    return NextResponse.json({ reservas: [] })
  }
}
