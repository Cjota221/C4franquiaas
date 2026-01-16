import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// API para cancelar reserva e estornar valor
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { reserva_id, motivo } = body
    
    if (!reserva_id) {
      return NextResponse.json({ error: 'reserva_id é obrigatório' }, { status: 400 })
    }
    
    // Verificar se a reserva pertence ao usuário
    const { data: reserva, error: reservaError } = await supabase
      .from('reservas')
      .select('*')
      .eq('id', reserva_id)
      .eq('revendedora_id', user.id)
      .single()
    
    if (reservaError || !reserva) {
      return NextResponse.json({ error: 'Reserva não encontrada' }, { status: 404 })
    }
    
    // Verificar se pode ser cancelada
    if (!['RESERVADO', 'EM_SEPARACAO'].includes(reserva.status)) {
      return NextResponse.json({ 
        error: 'Reserva não pode ser cancelada neste status',
        status_atual: reserva.status
      }, { status: 400 })
    }
    
    // Chamar função atômica de cancelamento
    const { data, error } = await supabase.rpc('cancelar_reserva', {
      p_reserva_id: reserva_id,
      p_motivo: motivo || 'Cancelamento solicitado pela revendedora'
    })
    
    if (error) {
      console.error('Erro na função cancelar_reserva:', error)
      return NextResponse.json({ error: 'Erro ao cancelar reserva' }, { status: 500 })
    }
    
    const resultado = data
    
    if (!resultado.success) {
      return NextResponse.json({ error: resultado.error }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      valor_estornado: resultado.valor_estornado,
      novo_saldo: resultado.novo_saldo
    })
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro na API de cancelamento:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
