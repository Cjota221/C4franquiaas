/**
 * 🔔 API: Receptor de Webhook de Produtos
 * 
 * Endpoint para receber notificações de mudanças de produtos
 * do Painel C4 Admin.
 * 
 * Rota: POST /api/webhooks/product-update
 * 
 * @module webhooks/product-update
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';

// ============ TIPOS ============

type WebhookEvent = 'PRODUCT_CREATED' | 'PRODUCT_UPDATED' | 'PRODUCT_DELETED' | 'STOCK_UPDATED';

interface WebhookPayload {
  eventType: WebhookEvent;
  timestamp: string;
  produto: {
    id: string;
    id_externo?: string | null;
    sku?: string | null;
    nome: string;
    preco_base: number;
    estoque: number;
    ativo: boolean;
    imagem?: string | null;
    imagens?: string[] | null;
    categoria_id?: string | null;
    variacoes_meta?: unknown[] | null;
    codigo_barras?: string | null;
  };
}

// ============ CONFIGURAÇÃO ============

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WEBHOOK_SECRET = process.env.WEBHOOK_PRODUCT_SECRET;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('[webhook/product-update] ⚠️ Variáveis de ambiente ausentes');
}

// ============ HANDLER ============

export async function POST(request: NextRequest) {
  try {
    console.log('\n[webhook/product-update] 📥 Webhook recebido');
    
    // ============ 1. VALIDAÇÃO DE SEGURANÇA ============
    
    const secret = request.headers.get('X-Webhook-Secret');
    const eventType = request.headers.get('X-Webhook-Event');
    const source = request.headers.get('X-Webhook-Source');

    console.log('[webhook/product-update] 🔐 Validando segurança...');
    console.log(`[webhook/product-update]   Source: ${source}`);
    console.log(`[webhook/product-update]   Event: ${eventType}`);
    console.log(`[webhook/product-update]   Secret: ${secret ? '✓ Presente' : '✗ Ausente'}`);

    if (!secret || secret !== WEBHOOK_SECRET) {
      console.error('[webhook/product-update] ❌ Webhook secret inválido');
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid webhook secret' },
        { status: 401 }
      );
    }

    if (source !== 'c4-admin') {
      console.error('[webhook/product-update] ❌ Source inválida:', source);
      return NextResponse.json(
        { error: 'Invalid source' },
        { status: 403 }
      );
    }

    // ============ 2. PARSE DO PAYLOAD ============

    const payload: WebhookPayload = await request.json();

    console.log('[webhook/product-update] 📦 Payload recebido:');
    console.log(`[webhook/product-update]   Evento: ${payload.eventType}`);
    console.log(`[webhook/product-update]   Produto: ${payload.produto.nome}`);
    console.log(`[webhook/product-update]   SKU: ${payload.produto.sku || payload.produto.id}`);
    console.log(`[webhook/product-update]   Estoque: ${payload.produto.estoque}`);
    console.log(`[webhook/product-update]   Preço: R$ ${payload.produto.preco_base}`);
    console.log(`[webhook/product-update]   Ativo: ${payload.produto.ativo ? 'SIM' : 'NÃO'}`);

    // ============ 3. CONEXÃO COM BANCO DE DADOS LOCAL ============

    if (!SUPABASE_URL || !SERVICE_KEY) {
      console.error('[webhook/product-update] ❌ Configuração Supabase ausente');
      return NextResponse.json(
        { error: 'Internal configuration error' },
        { status: 500 }
      );
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // ============ 4. LÓGICA DE UPSERT (UPDATE ou INSERT) ============

    const sku = payload.produto.sku || payload.produto.codigo_barras || payload.produto.id_externo || payload.produto.id;

    console.log(`[webhook/product-update] 🔍 Buscando produto por SKU: ${sku}`);

    // Buscar produto existente pelo SKU/código de barras
    const { data: existingProduct } = await supabase
      .from('produtos')
      .select('id')
      .or(`codigo_barras.eq.${sku},id_externo.eq.${sku},id.eq.${payload.produto.id}`)
      .limit(1)
      .single();

    if (existingProduct) {
      // ✅ PRODUTO JÁ EXISTE - UPDATE
      console.log(`[webhook/product-update] ♻️ Produto encontrado, atualizando...`);
      console.log(`[webhook/product-update]   ID local: ${existingProduct.id}`);

      const { error: updateError } = await supabase
        .from('produtos')
        .update({
          nome: payload.produto.nome,
          preco_base: payload.produto.preco_base,
          estoque: payload.produto.estoque,
          ativo: payload.produto.ativo,
          imagem: payload.produto.imagem,
          imagens: payload.produto.imagens,
          categoria_id: payload.produto.categoria_id,
          variacoes_meta: payload.produto.variacoes_meta,
          last_synced_at: new Date().toISOString(),
        })
        .eq('id', existingProduct.id);

      if (updateError) {
        console.error('[webhook/product-update] ❌ Erro ao atualizar:', updateError);
        return NextResponse.json(
          { error: 'Failed to update product', details: updateError.message },
          { status: 500 }
        );
      }

      console.log('[webhook/product-update] ✅ Produto atualizado com sucesso!');
      
      return NextResponse.json({
        success: true,
        action: 'updated',
        productId: existingProduct.id,
        sku: sku,
      });

    } else {
      // ✨ PRODUTO NOVO - INSERT
      console.log(`[webhook/product-update] ✨ Produto não encontrado, criando novo...`);

      const { data: newProduct, error: insertError } = await supabase
        .from('produtos')
        .insert({
          id_externo: payload.produto.id_externo,
          codigo_barras: payload.produto.codigo_barras,
          nome: payload.produto.nome,
          preco_base: payload.produto.preco_base,
          estoque: payload.produto.estoque,
          ativo: false, // 🔒 Criar desativado por padrão (franqueada precisa aprovar)
          imagem: payload.produto.imagem,
          imagens: payload.produto.imagens,
          categoria_id: payload.produto.categoria_id,
          variacoes_meta: payload.produto.variacoes_meta,
          last_synced_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[webhook/product-update] ❌ Erro ao criar:', insertError);
        return NextResponse.json(
          { error: 'Failed to create product', details: insertError.message },
          { status: 500 }
        );
      }

      console.log('[webhook/product-update] ✅ Produto criado com sucesso!');
      console.log(`[webhook/product-update]   ID: ${newProduct?.id}`);
      console.log(`[webhook/product-update]   Status: Desativado (aguardando aprovação)`);

      return NextResponse.json({
        success: true,
        action: 'created',
        productId: newProduct?.id,
        sku: sku,
        note: 'Product created as inactive, requires manual activation',
      });
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[webhook/product-update] ❌ Erro no processamento:', errorMessage);
    
    return NextResponse.json(
      { error: 'Webhook processing failed', details: errorMessage },
      { status: 500 }
    );
  }
}

// ============ MÉTODOS NÃO PERMITIDOS ============

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed', message: 'This endpoint only accepts POST requests' },
    { status: 405 }
  );
}
