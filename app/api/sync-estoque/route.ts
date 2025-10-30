/**
 * API Route: Webhook de Sincronização de Estoque
 * 
 * Endpoint: POST /api/sync-estoque
 * 
 * Este webhook é acionado após uma venda para sincronizar o estoque
 * no banco de dados central e propagar para sistemas integrados
 * (Meta Commerce - Facebook/Instagram, Franqueadas).
 * 
 * Segurança: Requer WEBHOOK_SECRET no corpo da requisição.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notificarSistemasIntegrados } from '@/lib/utils/meta-commerce-sync';

// Interface do payload esperado
interface WebhookPayload {
  secret: string;
  produto_sku: string;
  quantidade_vendida: number;
  transacao_id: string;
}

// Cliente Supabase (server-side com service role)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST /api/sync-estoque
 * Processa a sincronização de estoque após uma venda
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 1. Parse do corpo da requisição
    const payload: WebhookPayload = await request.json();
    const { secret, produto_sku, quantidade_vendida, transacao_id } = payload;

    console.log(`🔔 [Webhook] Recebido - SKU: ${produto_sku}, Qtd: ${quantidade_vendida}, Transação: ${transacao_id}`);

    // 2. Validação de Segurança
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
    
    if (!WEBHOOK_SECRET) {
      console.error('❌ [Webhook] WEBHOOK_SECRET não configurado no ambiente!');
      return NextResponse.json(
        { error: 'Configuração de segurança ausente' },
        { status: 500 }
      );
    }

    if (secret !== WEBHOOK_SECRET) {
      console.warn('⚠️ [Webhook] Tentativa de acesso não autorizado!');
      return NextResponse.json(
        { error: 'Chave secreta inválida' },
        { status: 401 }
      );
    }

    // 3. Validação de dados
    if (!produto_sku || quantidade_vendida <= 0) {
      return NextResponse.json(
        { error: 'SKU ou quantidade inválida' },
        { status: 400 }
      );
    }

    // 4. Busca o produto no banco de dados
    const { data: produto, error: produtoError } = await supabase
      .from('produtos')
      .select('id, sku, nome, estoque_central, estoque_minimo')
      .eq('sku', produto_sku)
      .single();

    if (produtoError || !produto) {
      console.error(`❌ [Webhook] Produto não encontrado: ${produto_sku}`, produtoError);
      return NextResponse.json(
        { error: 'Produto não encontrado' },
        { status: 404 }
      );
    }

    console.log(`📦 [Webhook] Produto encontrado: ${produto.nome} - Estoque atual: ${produto.estoque_central}`);

    // 5. Calcula o novo estoque
    const novoEstoque = Math.max(0, produto.estoque_central - quantidade_vendida);
    
    console.log(`🔢 [Webhook] Novo estoque calculado: ${novoEstoque}`);

    // 6. Atualiza o estoque no banco de dados
    const { error: updateError } = await supabase
      .from('produtos')
      .update({ 
        estoque_central: novoEstoque,
        updated_at: new Date().toISOString()
      })
      .eq('sku', produto_sku);

    if (updateError) {
      console.error('❌ [Webhook] Erro ao atualizar estoque:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar estoque' },
        { status: 500 }
      );
    }

    console.log(`✅ [Webhook] Estoque atualizado no banco de dados!`);

    // 7. Verifica se atingiu estoque mínimo
    if (novoEstoque <= produto.estoque_minimo && novoEstoque > 0) {
      console.warn(`⚠️ [Webhook] ALERTA: Produto ${produto.nome} atingiu estoque mínimo!`);
      // TODO: Enviar notificação para admin/franqueada
    }

    if (novoEstoque === 0) {
      console.warn(`🚫 [Webhook] CRÍTICO: Produto ${produto.nome} sem estoque!`);
      // TODO: Enviar alerta crítico
    }

    // 8. Registra a movimentação de estoque (log)
    await supabase.from('estoque_movimentacoes').insert({
      produto_id: produto.id,
      tipo: 'VENDA',
      quantidade: quantidade_vendida,
      estoque_anterior: produto.estoque_central,
      estoque_novo: novoEstoque,
      transacao_id: transacao_id,
      observacao: `Venda registrada via webhook - ID: ${transacao_id}`
    });

    // 9. Dispara notificações para sistemas integrados (ASSÍNCRONO)
    // Não usamos await aqui para evitar timeout do webhook
    notificarSistemasIntegrados(produto_sku, novoEstoque);

    const elapsed = Date.now() - startTime;
    console.log(`⚡ [Webhook] Processado em ${elapsed}ms`);

    // 10. Retorna sucesso
    return NextResponse.json(
      {
        success: true,
        message: 'Estoque sincronizado com sucesso',
        data: {
          sku: produto_sku,
          estoque_anterior: produto.estoque_central,
          estoque_novo: novoEstoque,
          quantidade_vendida,
          tempo_processamento_ms: elapsed
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('❌ [Webhook] Erro fatal:', error);
    
    return NextResponse.json(
      {
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync-estoque
 * Endpoint de health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Webhook de Sincronização de Estoque',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}
