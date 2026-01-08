import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/abandoned-cart/apply-coupon
 * Aplica um cupom a um carrinho abandonado
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cartId, couponCode } = body;

    if (!cartId) {
      return NextResponse.json({ error: 'cartId é obrigatório' }, { status: 400 });
    }

    if (!couponCode) {
      return NextResponse.json({ error: 'couponCode é obrigatório' }, { status: 400 });
    }

    // Buscar o carrinho
    const { data: cart, error: cartError } = await supabaseAdmin
      .from('abandoned_carts')
      .select('id, reseller_id, total_value')
      .eq('id', cartId)
      .single();

    if (cartError || !cart) {
      return NextResponse.json({ error: 'Carrinho não encontrado' }, { status: 404 });
    }

    // Buscar o cupom
    const { data: coupon, error: couponError } = await supabaseAdmin
      .from('promotions')
      .select('*')
      .eq('coupon_code', couponCode)
      .eq('reseller_id', cart.reseller_id)
      .eq('is_active', true)
      .single();

    if (couponError || !coupon) {
      return NextResponse.json({ error: 'Cupom não encontrado ou inativo' }, { status: 404 });
    }

    // Verificar se o cupom ainda é válido
    const now = new Date();
    if (coupon.starts_at && new Date(coupon.starts_at) > now) {
      return NextResponse.json({ error: 'Cupom ainda não está ativo' }, { status: 400 });
    }
    if (coupon.ends_at && new Date(coupon.ends_at) < now) {
      return NextResponse.json({ error: 'Cupom expirado' }, { status: 400 });
    }

    // Verificar valor mínimo
    if (coupon.minimum_value && cart.total_value < coupon.minimum_value) {
      return NextResponse.json({ 
        error: `Valor mínimo para este cupom é R$ ${coupon.minimum_value.toFixed(2)}` 
      }, { status: 400 });
    }

    // Verificar limite de uso
    if (coupon.usage_limit) {
      const { count } = await supabaseAdmin
        .from('promotion_uses')
        .select('*', { count: 'exact', head: true })
        .eq('promotion_id', coupon.id);

      if (count && count >= coupon.usage_limit) {
        return NextResponse.json({ error: 'Cupom atingiu o limite de uso' }, { status: 400 });
      }
    }

    // Calcular desconto
    let discount = 0;
    if (coupon.type === 'desconto_percentual' && coupon.discount_percentage) {
      discount = (cart.total_value * coupon.discount_percentage) / 100;
      // Aplicar limite máximo se existir
      if (coupon.max_discount && discount > coupon.max_discount) {
        discount = coupon.max_discount;
      }
    } else if (coupon.type === 'desconto_valor' || coupon.type === 'cupom_desconto') {
      discount = coupon.discount_value || 0;
    } else if (coupon.type === 'frete_gratis') {
      // Frete grátis - não tem desconto direto
      discount = 0;
    }

    // Atualizar o carrinho com o cupom
    const { error: updateError } = await supabaseAdmin
      .from('abandoned_carts')
      .update({
        recovery_coupon_code: couponCode,
        recovery_coupon_discount: discount,
        updated_at: new Date().toISOString()
      })
      .eq('id', cartId);

    if (updateError) {
      console.error('Erro ao aplicar cupom:', updateError);
      return NextResponse.json({ error: 'Erro ao aplicar cupom' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      coupon: {
        code: couponCode,
        name: coupon.name,
        type: coupon.type,
        discount,
        discountPercentage: coupon.discount_percentage,
        discountValue: coupon.discount_value
      },
      message: `Cupom ${couponCode} aplicado com sucesso!`
    });
  } catch (error) {
    console.error('Erro ao aplicar cupom:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/abandoned-cart/apply-coupon
 * Remove cupom de um carrinho abandonado
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cartId = searchParams.get('cartId');

    if (!cartId) {
      return NextResponse.json({ error: 'cartId é obrigatório' }, { status: 400 });
    }

    const { error: updateError } = await supabaseAdmin
      .from('abandoned_carts')
      .update({
        recovery_coupon_code: null,
        recovery_coupon_discount: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', cartId);

    if (updateError) {
      console.error('Erro ao remover cupom:', updateError);
      return NextResponse.json({ error: 'Erro ao remover cupom' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Cupom removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover cupom:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
