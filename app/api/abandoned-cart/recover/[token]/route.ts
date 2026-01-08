import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/abandoned-cart/recover/[token]
 * Recupera um carrinho abandonado pelo token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token é obrigatório' }, { status: 400 });
    }

    // Buscar carrinho pelo token
    const { data: cart, error: cartError } = await supabaseAdmin
      .from('abandoned_carts')
      .select(`
        id,
        reseller_id,
        customer_name,
        customer_phone,
        customer_email,
        status,
        total_value,
        items_count,
        recovery_coupon_code,
        recovery_coupon_discount,
        created_at
      `)
      .eq('recovery_token', token)
      .single();

    if (cartError || !cart) {
      return NextResponse.json({ error: 'Carrinho não encontrado' }, { status: 404 });
    }

    // Verificar se o carrinho já foi convertido ou expirado
    if (cart.status === 'converted') {
      return NextResponse.json({ 
        error: 'Este carrinho já foi finalizado',
        status: cart.status 
      }, { status: 410 });
    }

    if (cart.status === 'expired') {
      return NextResponse.json({ 
        error: 'Este carrinho expirou',
        status: cart.status 
      }, { status: 410 });
    }

    // Buscar itens do carrinho
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('abandoned_cart_items')
      .select(`
        id,
        product_id,
        product_name,
        product_image,
        product_price,
        quantity,
        variation_id,
        variation_name
      `)
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.error('Erro ao buscar itens:', itemsError);
      return NextResponse.json({ error: 'Erro ao buscar itens do carrinho' }, { status: 500 });
    }

    // Buscar dados da revendedora para montar a URL da loja
    const { data: reseller } = await supabaseAdmin
      .from('resellers')
      .select('slug, nome_loja')
      .eq('id', cart.reseller_id)
      .single();

    // Registrar acesso ao link
    await supabaseAdmin
      .from('abandoned_carts')
      .update({
        link_accessed_at: new Date().toISOString(),
        link_access_count: (cart as { link_access_count?: number }).link_access_count 
          ? (cart as { link_access_count?: number }).link_access_count! + 1 
          : 1,
        status: 'recovered',
        recovered_at: new Date().toISOString()
      })
      .eq('id', cart.id);

    // Verificar cupom se houver
    let couponInfo = null;
    if (cart.recovery_coupon_code) {
      const { data: coupon } = await supabaseAdmin
        .from('promotions')
        .select('id, name, type, discount_value, discount_percentage, minimum_value')
        .eq('coupon_code', cart.recovery_coupon_code)
        .eq('reseller_id', cart.reseller_id)
        .eq('is_active', true)
        .single();

      if (coupon) {
        couponInfo = {
          code: cart.recovery_coupon_code,
          name: coupon.name,
          type: coupon.type,
          discountValue: coupon.discount_value,
          discountPercentage: coupon.discount_percentage,
          minimumValue: coupon.minimum_value
        };
      }
    }

    return NextResponse.json({
      success: true,
      cart: {
        id: cart.id,
        customerName: cart.customer_name,
        customerPhone: cart.customer_phone,
        customerEmail: cart.customer_email,
        totalValue: cart.total_value,
        itemsCount: cart.items_count,
        createdAt: cart.created_at
      },
      items: items?.map(item => ({
        productId: item.product_id,
        productName: item.product_name,
        productImage: item.product_image,
        productPrice: item.product_price,
        quantity: item.quantity,
        variationId: item.variation_id,
        variationName: item.variation_name
      })) || [],
      reseller: reseller ? {
        slug: reseller.slug,
        storeName: reseller.nome_loja
      } : null,
      coupon: couponInfo
    });
  } catch (error) {
    console.error('Erro ao recuperar carrinho:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
