import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// API para cancelar reserva e devolver saldo (Modo Caixinha)
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const { user, error: authError } = await getAuthUser(authHeader)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { reserva_id, motivo } = body
    
    if (!reserva_id) {
      return NextResponse.json({ error: 'reserva_id é obrigatório' }, { status: 400 })
    }
    
    // Buscar carteira do usuário
    const { data: wallet, error: walletError } = await supabaseAdmin
      .from('wallets')
      .select('*')
      .eq('revendedora_id', user.id)
      .single()
    
    if (walletError || !wallet) {
      return NextResponse.json({ error: 'Carteira não encontrada' }, { status: 404 })
    }
    
    // Buscar reserva
    const { data: reserva, error: reservaError } = await supabaseAdmin
      .from('reservas')
      .select('*')
      .eq('id', reserva_id)
      .eq('wallet_id', wallet.id)
      .single()
    
    if (reservaError || !reserva) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 })
    }
    
    // Verificar se pode cancelar
    if (reserva.status !== 'RESERVADO') {
      return NextResponse.json({ 
        error: `Reserva não pode ser cancelada. Status atual: ${reserva.status}` 
      }, { status: 400 })
    }
    
    // Atualizar status da reserva
    const { error: updateReservaError } = await supabaseAdmin
      .from('reservas')
      .update({ 
        status: 'CANCELADO',
        cancelado_em: new Date().toISOString(),
        motivo_cancelamento: motivo || 'Cancelado pelo usuário'
      })
      .eq('id', reserva_id)
    
    if (updateReservaError) {
      console.error('Erro ao cancelar reserva:', updateReservaError)
      return NextResponse.json({ error: 'Erro ao cancelar reserva' }, { status: 500 })
    }
    
    // Desbloquear saldo
    const novoSaldoBloqueado = Math.max(0, wallet.saldo_bloqueado - reserva.preco_total)
    const { error: desbloqueioError } = await supabaseAdmin
      .from('wallets')
      .update({ saldo_bloqueado: novoSaldoBloqueado })
      .eq('id', wallet.id)
    
    if (desbloqueioError) {
      console.error('Erro ao desbloquear saldo:', desbloqueioError)
      // Reverter cancelamento
      await supabaseAdmin
        .from('reservas')
        .update({ status: 'RESERVADO', cancelado_em: null, motivo_cancelamento: null })
        .eq('id', reserva_id)
      return NextResponse.json({ error: 'Erro ao desbloquear saldo' }, { status: 500 })
    }
    
    // Registrar transação de desbloqueio
    await supabaseAdmin
      .from('wallet_transactions')
      .insert({
        wallet_id: wallet.id,
        tipo: 'DESBLOQUEIO_RESERVA',
        valor: reserva.preco_total,
        descricao: `Cancelamento de reserva ${reserva_id}`,
        referencia_tipo: 'reserva',
        referencia_id: reserva_id
      })
    
    return NextResponse.json({
      success: true,
      message: 'Reserva cancelada com sucesso',
      valor_desbloqueado: reserva.preco_total,
      saldo_disponivel: wallet.saldo - novoSaldoBloqueado
    })
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro ao cancelar reserva:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
