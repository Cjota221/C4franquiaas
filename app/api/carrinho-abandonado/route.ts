import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Buscar carrinhos abandonados de uma revendedora
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const resellerId = searchParams.get('reseller_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    if (!resellerId) {
      return NextResponse.json(
        { error: 'reseller_id é obrigatório' },
        { status: 400 }
      )
    }
    
    let query = supabase
      .from('abandoned_carts')
      .select(`
        *,
        items:abandoned_cart_items(*)
      `)
      .eq('reseller_id', resellerId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: carts, error } = await query
    
    if (error) {
      console.error('Erro ao buscar carrinhos:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar carrinhos abandonados' },
        { status: 500 }
      )
    }
    
    // Contar total para paginação
    const { count } = await supabase
      .from('abandoned_carts')
      .select('*', { count: 'exact', head: true })
      .eq('reseller_id', resellerId)
    
    return NextResponse.json({
      carts,
      total: count || 0,
      limit,
      offset
    })
    
  } catch (error) {
    console.error('Erro na API de carrinhos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Criar ou atualizar carrinho abandonado
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const {
      reseller_id,
      customer_name,
      customer_phone,
      customer_email,
      product_id,
      product_name,
      product_image,
      product_price,
      quantity = 1,
      variation_id,
      variation_name
    } = body
    
    if (!reseller_id || !customer_phone) {
      return NextResponse.json(
        { error: 'reseller_id e customer_phone são obrigatórios' },
        { status: 400 }
      )
    }
    
    // Verificar se já existe um carrinho para este cliente
    const { data: existingCart } = await supabase
      .from('abandoned_carts')
      .select('id')
      .eq('reseller_id', reseller_id)
      .eq('customer_phone', customer_phone)
      .eq('status', 'abandoned')
      .single()
    
    let cartId: string
    
    if (existingCart) {
      // Atualizar carrinho existente
      cartId = existingCart.id
      
      await supabase
        .from('abandoned_carts')
        .update({
          customer_name: customer_name || undefined,
          customer_email: customer_email || undefined,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', cartId)
        
    } else {
      // Criar novo carrinho
      const { data: newCart, error: cartError } = await supabase
        .from('abandoned_carts')
        .insert({
          reseller_id,
          customer_name,
          customer_phone,
          customer_email,
          status: 'abandoned'
        })
        .select('id')
        .single()
      
      if (cartError || !newCart) {
        console.error('Erro ao criar carrinho:', cartError)
        return NextResponse.json(
          { error: 'Erro ao criar carrinho' },
          { status: 500 }
        )
      }
      
      cartId = newCart.id
    }
    
    // Se tem produto, adicionar ao carrinho
    if (product_id && product_name && product_price !== undefined) {
      // Verificar se o produto já está no carrinho
      const { data: existingItem } = await supabase
        .from('abandoned_cart_items')
        .select('id, quantity')
        .eq('cart_id', cartId)
        .eq('product_id', product_id)
        .eq('variation_id', variation_id || '')
        .single()
      
      if (existingItem) {
        // Atualizar quantidade
        await supabase
          .from('abandoned_cart_items')
          .update({ 
            quantity: existingItem.quantity + quantity,
            product_price // Atualizar preço caso tenha mudado
          })
          .eq('id', existingItem.id)
      } else {
        // Adicionar novo item
        await supabase
          .from('abandoned_cart_items')
          .insert({
            cart_id: cartId,
            product_id,
            product_name,
            product_image,
            product_price,
            quantity,
            variation_id,
            variation_name
          })
      }
    }
    
    // Buscar carrinho atualizado com itens
    const { data: cart } = await supabase
      .from('abandoned_carts')
      .select(`
        *,
        items:abandoned_cart_items(*)
      `)
      .eq('id', cartId)
      .single()
    
    return NextResponse.json({
      success: true,
      cart
    })
    
  } catch (error) {
    console.error('Erro ao salvar carrinho:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// PATCH - Atualizar status do carrinho
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { cart_id, status, contacted, notes } = body
    
    if (!cart_id) {
      return NextResponse.json(
        { error: 'cart_id é obrigatório' },
        { status: 400 }
      )
    }
    
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    }
    
    if (status) {
      updates.status = status
      if (status === 'recovered') {
        updates.recovered_at = new Date().toISOString()
      }
    }
    
    if (contacted !== undefined) {
      updates.contacted = contacted
      if (contacted) {
        updates.contacted_at = new Date().toISOString()
      }
    }
    
    if (notes !== undefined) {
      updates.notes = notes
    }
    
    const { data: cart, error } = await supabase
      .from('abandoned_carts')
      .update(updates)
      .eq('id', cart_id)
      .select(`
        *,
        items:abandoned_cart_items(*)
      `)
      .single()
    
    if (error) {
      console.error('Erro ao atualizar carrinho:', error)
      return NextResponse.json(
        { error: 'Erro ao atualizar carrinho' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      cart
    })
    
  } catch (error) {
    console.error('Erro ao atualizar carrinho:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover item ou carrinho inteiro
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    
    const cartId = searchParams.get('cart_id')
    const itemId = searchParams.get('item_id')
    
    if (itemId) {
      // Remover apenas um item
      const { error } = await supabase
        .from('abandoned_cart_items')
        .delete()
        .eq('id', itemId)
      
      if (error) {
        return NextResponse.json(
          { error: 'Erro ao remover item' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ success: true, message: 'Item removido' })
      
    } else if (cartId) {
      // Remover carrinho inteiro
      const { error } = await supabase
        .from('abandoned_carts')
        .delete()
        .eq('id', cartId)
      
      if (error) {
        return NextResponse.json(
          { error: 'Erro ao remover carrinho' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({ success: true, message: 'Carrinho removido' })
    }
    
    return NextResponse.json(
      { error: 'cart_id ou item_id é obrigatório' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Erro ao deletar:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
