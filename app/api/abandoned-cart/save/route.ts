import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/abandoned-cart/save
 * Salva um carrinho abandonado no banco e retorna o token de recuperação
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      resellerId,
      customerName,
      customerPhone,
      customerEmail,
      items // Array de { productId, productName, productImage, productPrice, quantity, variationId, variationName }
    } = body;

    if (!resellerId) {
      return NextResponse.json({ error: 'resellerId é obrigatório' }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Carrinho vazio' }, { status: 400 });
    }

    // Verificar se já existe um carrinho ativo para esse telefone/email nessa loja
    let existingCart = null;
    if (customerPhone || customerEmail) {
      const query = supabaseAdmin
        .from('abandoned_carts')
        .select('id, recovery_token')
        .eq('reseller_id', resellerId)
        .eq('status', 'abandoned');

      if (customerPhone) {
        query.eq('customer_phone', customerPhone);
      } else if (customerEmail) {
        query.eq('customer_email', customerEmail);
      }

      const { data } = await query.single();
      existingCart = data;
    }

    let cartId: string;
    let recoveryToken: string;

    if (existingCart) {
      // Atualizar carrinho existente
      cartId = existingCart.id;
      recoveryToken = existingCart.recovery_token;

      // Limpar itens antigos
      await supabaseAdmin
        .from('abandoned_cart_items')
        .delete()
        .eq('cart_id', cartId);

      // Atualizar dados do cliente
      await supabaseAdmin
        .from('abandoned_carts')
        .update({
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', cartId);
    } else {
      // Criar novo carrinho
      const { data: newCart, error: cartError } = await supabaseAdmin
        .from('abandoned_carts')
        .insert({
          reseller_id: resellerId,
          customer_name: customerName,
          customer_phone: customerPhone || 'sem-telefone',
          customer_email: customerEmail,
          status: 'abandoned'
        })
        .select('id, recovery_token')
        .single();

      if (cartError) {
        console.error('Erro ao criar carrinho:', cartError);
        return NextResponse.json({ error: 'Erro ao criar carrinho' }, { status: 500 });
      }

      cartId = newCart.id;
      recoveryToken = newCart.recovery_token;
    }

    // Inserir itens do carrinho
    const cartItems = items.map((item: {
      productId: string;
      productName: string;
      productImage?: string;
      productPrice: number;
      quantity: number;
      variationId?: string;
      variationName?: string;
    }) => ({
      cart_id: cartId,
      product_id: item.productId,
      product_name: item.productName,
      product_image: item.productImage,
      product_price: item.productPrice,
      quantity: item.quantity,
      variation_id: item.variationId,
      variation_name: item.variationName
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('abandoned_cart_items')
      .insert(cartItems);

    if (itemsError) {
      console.error('Erro ao inserir itens:', itemsError);
      return NextResponse.json({ error: 'Erro ao salvar itens do carrinho' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      cartId,
      recoveryToken,
      message: 'Carrinho salvo com sucesso'
    });
  } catch (error) {
    console.error('Erro ao salvar carrinho:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
