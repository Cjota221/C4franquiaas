import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Buscar promoções
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const resellerId = searchParams.get('reseller_id')
    const activeOnly = searchParams.get('active') === 'true'
    const type = searchParams.get('type')
    const couponCode = searchParams.get('coupon')
    
    // Se buscar por cupom específico
    if (couponCode) {
      const { data: promo, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('coupon_code', couponCode.toUpperCase())
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .or(`ends_at.is.null,ends_at.gte.${new Date().toISOString()}`)
        .single()
      
      if (error || !promo) {
        return NextResponse.json(
          { error: 'Cupom inválido ou expirado' },
          { status: 404 }
        )
      }
      
      // Verificar limite de usos
      if (promo.max_uses && promo.uses_count >= promo.max_uses) {
        return NextResponse.json(
          { error: 'Este cupom atingiu o limite de usos' },
          { status: 400 }
        )
      }
      
      return NextResponse.json({ promotion: promo })
    }
    
    if (!resellerId) {
      return NextResponse.json(
        { error: 'reseller_id é obrigatório' },
        { status: 400 }
      )
    }
    
    let query = supabase
      .from('promotions')
      .select('*')
      .eq('reseller_id', resellerId)
      .order('created_at', { ascending: false })
    
    if (activeOnly) {
      const now = new Date().toISOString()
      query = query
        .eq('is_active', true)
        .lte('starts_at', now)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
    }
    
    if (type) {
      query = query.eq('type', type)
    }
    
    const { data: promotions, error } = await query
    
    if (error) {
      console.error('Erro ao buscar promoções:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar promoções' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ promotions })
    
  } catch (error) {
    console.error('Erro na API de promoções:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar promoção
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const {
      reseller_id,
      name,
      description,
      type,
      discount_type,
      discount_value,
      buy_quantity,
      pay_quantity,
      free_shipping,
      min_value_free_shipping,
      coupon_code,
      min_purchase_value,
      max_discount_value,
      max_uses,
      applies_to,
      product_ids,
      category_ids,
      starts_at,
      ends_at,
      is_active = true
    } = body
    
    if (!reseller_id || !name || !type) {
      return NextResponse.json(
        { error: 'reseller_id, name e type são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Validar tipo
    const validTypes = ['frete_gratis', 'cupom_desconto', 'leve_pague', 'desconto_percentual', 'desconto_valor']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Tipo inválido. Use: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }
    
    // Se for cupom, validar código único POR REVENDEDORA (não globalmente)
    if (coupon_code) {
      const { data: existing } = await supabase
        .from('promotions')
        .select('id')
        .eq('coupon_code', coupon_code.toUpperCase())
        .eq('reseller_id', reseller_id) // ✅ Verifica apenas no painel da mesma revendedora
        .single()
      
      if (existing) {
        return NextResponse.json(
          { error: 'Você já tem um cupom com este código. Escolha outro código.' },
          { status: 400 }
        )
      }
    }
    
    const { data: promotion, error } = await supabase
      .from('promotions')
      .insert({
        reseller_id,
        name,
        description,
        type,
        discount_type,
        discount_value,
        buy_quantity,
        pay_quantity,
        free_shipping: free_shipping || type === 'frete_gratis',
        min_value_free_shipping,
        coupon_code: coupon_code?.toUpperCase(),
        min_purchase_value,
        max_discount_value,
        max_uses,
        applies_to: applies_to || 'all',
        product_ids,
        category_ids,
        starts_at: starts_at || new Date().toISOString(),
        ends_at,
        is_active
      })
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao criar promoção:', error)
      return NextResponse.json(
        { error: 'Erro ao criar promoção' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      promotion
    })
    
  } catch (error) {
    console.error('Erro ao criar promoção:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar promoção
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { id, ...updates } = body
    
    if (!id) {
      return NextResponse.json(
        { error: 'id é obrigatório' },
        { status: 400 }
      )
    }
    
    // Se estiver atualizando cupom, verificar unicidade POR REVENDEDORA
    if (updates.coupon_code) {
      // Primeiro, buscar a promoção atual para pegar o reseller_id
      const { data: currentPromo } = await supabase
        .from('promotions')
        .select('reseller_id')
        .eq('id', id)
        .single()
      
      if (currentPromo) {
        const { data: existing } = await supabase
          .from('promotions')
          .select('id')
          .eq('coupon_code', updates.coupon_code.toUpperCase())
          .eq('reseller_id', currentPromo.reseller_id) // ✅ Verifica apenas no painel da mesma revendedora
          .neq('id', id)
          .single()
        
        if (existing) {
          return NextResponse.json(
            { error: 'Você já tem outro cupom com este código. Escolha um código diferente.' },
            { status: 400 }
          )
        }
      }
      
      updates.coupon_code = updates.coupon_code.toUpperCase()
    }
    
    updates.updated_at = new Date().toISOString()
    
    const { data: promotion, error } = await supabase
      .from('promotions')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Erro ao atualizar promoção:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar promoção' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      promotion
    })
    
  } catch (error) {
    console.error('Erro ao atualizar promoção:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover promoção
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'id é obrigatório' },
        { status: 400 }
      )
    }
    
    const { error } = await supabase
      .from('promotions')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Erro ao deletar promoção:', error)
      return NextResponse.json(
        { error: 'Erro ao deletar promoção' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Promoção removida'
    })
    
  } catch (error) {
    console.error('Erro ao deletar promoção:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
