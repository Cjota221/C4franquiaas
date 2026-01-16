import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// API para fazer reserva de produto (debitar da carteira)
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const body = await request.json()
    const { produto_id, variacao_id, quantidade, preco_unitario, metadata } = body
    
    if (!produto_id || !quantidade || !preco_unitario) {
      return NextResponse.json({ 
        error: 'produto_id, quantidade e preco_unitario são obrigatórios' 
      }, { status: 400 })
    }
    
    if (quantidade < 1) {
      return NextResponse.json({ error: 'Quantidade deve ser pelo menos 1' }, { status: 400 })
    }
    
    if (preco_unitario <= 0) {
      return NextResponse.json({ error: 'Preço inválido' }, { status: 400 })
    }
    
    // Chamar função atômica do banco
    const { data, error } = await supabase.rpc('fazer_reserva', {
      p_revendedora_id: user.id,
      p_produto_id: produto_id,
      p_variacao_id: variacao_id || null,
      p_quantidade: quantidade,
      p_preco_unitario: preco_unitario,
      p_metadata: metadata || {}
    })
    
    if (error) {
      console.error('Erro na função fazer_reserva:', error)
      return NextResponse.json({ error: 'Erro ao processar reserva' }, { status: 500 })
    }
    
    // O retorno da função é um JSONB
    const resultado = data
    
    if (!resultado.success) {
      return NextResponse.json({ 
        error: resultado.error,
        saldo_atual: resultado.saldo_atual,
        valor_necessario: resultado.valor_necessario,
        estoque_disponivel: resultado.estoque_disponivel
      }, { status: 400 })
    }
    
    return NextResponse.json({
      success: true,
      reserva_id: resultado.reserva_id,
      transaction_id: resultado.transaction_id,
      valor_debitado: resultado.valor_debitado,
      novo_saldo: resultado.novo_saldo
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
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    let query = supabase
      .from('reservas')
      .select(`
        *,
        produto:produtos(id, nome, imagem, preco),
        variacao:produto_variacoes(id, tamanho, cor, sku)
      `)
      .eq('revendedora_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (status) {
      const statusList = status.split(',')
      query = query.in('status', statusList)
    }
    
    const { data: reservas, error } = await query
    
    if (error) {
      console.error('Erro ao buscar reservas:', error)
      return NextResponse.json({ error: 'Erro ao buscar reservas' }, { status: 500 })
    }
    
    // Calcular totais
    const totais = {
      quantidade: reservas?.reduce((acc, r) => acc + r.quantidade, 0) || 0,
      valor: reservas?.reduce((acc, r) => acc + r.preco_total, 0) || 0
    }
    
    return NextResponse.json({ 
      reservas,
      totais
    })
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('Erro ao buscar reservas:', error)
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
