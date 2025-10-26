import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint público para e-commerce das franqueadas receberem
 * atualizações de estoque do C4 Admin
 * 
 * As franqueadas devem configurar este endpoint no painel de webhook
 * do seu e-commerce (WooCommerce, Shopify, etc)
 */

type EstoqueWebhookPayload = {
  event: 'product.stock.updated';
  data: {
    id_externo: string;
    nome: string;
    estoque: number;
    variacoes_meta: Array<{
      id: string;
      nome: string;
      sku?: string | null;
      estoque: number;
      codigo_barras?: string | null;
    }>;
    imagem: string | null;
  };
  timestamp: string;
};

/**
 * Endpoint que as franqueadas devem integrar no e-commerce
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar secret key (segurança)
    const secretKey = request.headers.get('X-Webhook-Secret');
    const expectedSecret = process.env.FRANQUEADA_WEBHOOK_SECRET;

    if (expectedSecret && secretKey !== expectedSecret) {
      return NextResponse.json(
        { error: 'Secret key inválida' },
        { status: 401 }
      );
    }

    const payload: EstoqueWebhookPayload = await request.json();

    console.log('[Webhook Franqueada] Recebido:', {
      event: payload.event,
      produto: payload.data.nome,
      id_externo: payload.data.id_externo,
      estoque: payload.data.estoque,
    });

    // Validar payload
    if (!payload.event || !payload.data) {
      return NextResponse.json(
        { error: 'Payload inválido' },
        { status: 400 }
      );
    }

    // ✅ INTEGRAÇÃO COM E-COMMERCE DA FRANQUEADA
    // 
    // Aqui você deve implementar a integração com o e-commerce específico:
    //
    // 1. WooCommerce:
    //    - Usar API REST do WooCommerce para atualizar produto
    //    - Endpoint: PUT /wp-json/wc/v3/products/{id}
    //    - Atualizar stock_quantity e manage_stock
    //
    // 2. Shopify:
    //    - Usar Shopify Admin API
    //    - Endpoint: PUT /admin/api/2024-01/inventory_levels/set.json
    //
    // 3. Outros:
    //    - Implementar lógica específica para cada plataforma

    // Exemplo de integração com WooCommerce:
    const woocommerceUrl = process.env.WOOCOMMERCE_API_URL;
    const woocommerceKey = process.env.WOOCOMMERCE_CONSUMER_KEY;
    const woocommerceSecret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

    if (woocommerceUrl && woocommerceKey && woocommerceSecret) {
      try {
        // Buscar produto no WooCommerce pelo SKU (id_externo)
        const searchUrl = `${woocommerceUrl}/wp-json/wc/v3/products?sku=${payload.data.id_externo}`;
        const authHeader = `Basic ${Buffer.from(`${woocommerceKey}:${woocommerceSecret}`).toString('base64')}`;

        const searchResponse = await fetch(searchUrl, {
          headers: {
            'Authorization': authHeader,
          },
        });

        const products = await searchResponse.json();
        
        if (products.length === 0) {
          console.warn('[Webhook Franqueada] Produto não encontrado no WooCommerce:', payload.data.id_externo);
          return NextResponse.json({
            success: false,
            message: 'Produto não encontrado no e-commerce',
          });
        }

        const wooProduct = products[0];

        // Atualizar estoque no WooCommerce
        const updateUrl = `${woocommerceUrl}/wp-json/wc/v3/products/${wooProduct.id}`;
        const updateData = {
          stock_quantity: payload.data.estoque,
          manage_stock: true,
          stock_status: payload.data.estoque > 0 ? 'instock' : 'outofstock',
        };

        const updateResponse = await fetch(updateUrl, {
          method: 'PUT',
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!updateResponse.ok) {
          throw new Error(`WooCommerce API erro: ${updateResponse.statusText}`);
        }

        console.log('[Webhook Franqueada] ✅ Produto atualizado no WooCommerce:', wooProduct.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error('[Webhook Franqueada] Erro ao atualizar WooCommerce:', errorMessage);
        // Não retornar erro para não bloquear outros webhooks
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Estoque atualizado com sucesso',
      produto: payload.data.nome,
      estoque: payload.data.estoque,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Webhook Franqueada] Erro ao processar:', errorMessage);
    return NextResponse.json(
      { error: 'Erro interno ao processar webhook', details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Endpoint GET para verificar status
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/franqueada-estoque',
    description: 'Endpoint para e-commerce da franqueada receber atualizações de estoque',
    supported_platforms: ['WooCommerce', 'Shopify', 'Custom'],
  });
}
