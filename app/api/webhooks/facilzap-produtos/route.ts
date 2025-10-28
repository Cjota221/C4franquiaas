import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Webhook do FacilZap para sincronização automática de produtos
 * 
 * Configure este endpoint no painel do FacilZap:
 * URL: https://seu-site.com/api/webhooks/facilzap-produtos
 * 
 * O FacilZap deve enviar um POST com o seguinte formato:
 * {
 *   "event": "produto.criado" | "produto.atualizado" | "produto.deletado",
 *   "produto": { ...dados do produto... }
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n🔔 [Webhook FacilZap] Recebendo notificação...\n');

    // 1. Verificar secret key (segurança)
    const secretHeader = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.FACILZAP_WEBHOOK_SECRET;

    if (expectedSecret && secretHeader !== expectedSecret) {
      console.warn('⚠️ [Webhook] Secret key inválida');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parsear payload
    const payload = await request.json();
    console.log('📦 [Webhook] Payload recebido:', payload);

    const { event, produto, produtos } = payload;

    // 3. Processar evento
    if (event === 'produto.criado' || event === 'produto.atualizado') {
      // Atualizar produto único
      if (produto) {
        await atualizarProduto(produto);
        console.log(`✅ [Webhook] Produto ${event === 'produto.criado' ? 'criado' : 'atualizado'}:`, produto.id);
      }
      // Atualizar múltiplos produtos
      else if (produtos && Array.isArray(produtos)) {
        for (const p of produtos) {
          await atualizarProduto(p);
        }
        console.log(`✅ [Webhook] ${produtos.length} produtos processados`);
      }
    } else if (event === 'produto.deletado') {
      // Desativar produto ao invés de deletar
      if (produto?.id) {
        const { error } = await supabase
          .from('produtos')
          .update({ ativo: false })
          .eq('id_externo', String(produto.id));

        if (error) {
          console.error('❌ [Webhook] Erro ao desativar produto:', error);
        } else {
          console.log(`✅ [Webhook] Produto desativado:`, produto.id);
        }
      }
    } else if (event === 'sync.full' || !event) {
      // Sincronização completa - triggerar sincronização manual
      console.log('🔄 [Webhook] Triggering full sync...');
      
      const syncResponse = await fetch(new URL('/api/sync-produtos', request.url).toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const syncData = await syncResponse.json();
      console.log(`✅ [Webhook] Full sync complete: ${syncData.imported} produtos`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processado com sucesso' 
    });

  } catch (error) {
    console.error('❌ [Webhook] Erro:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}

/**
 * Helper para atualizar/criar um produto
 */
async function atualizarProduto(produto: Record<string, unknown>) {
  try {
    const produtoData = {
      id_externo: String(produto.id || produto.id_externo),
      nome: produto.nome || produto.name,
      preco_base: Number(produto.preco || produto.preco_base || 0),
      estoque: Number(produto.estoque || produto.stock || 0),
      ativo: produto.ativo !== undefined ? Boolean(produto.ativo) : true,
      imagem: produto.imagem || null,
      imagens: Array.isArray(produto.imagens) 
        ? produto.imagens 
        : (produto.imagens ? [produto.imagens] : []),
      codigo_barras: produto.codigo_barras || produto.barcode || null,
      variacoes_meta: produto.variacoes_meta || produto.variacoes || [],
      last_synced_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('produtos')
      .upsert(produtoData, { onConflict: 'id_externo' });

    if (error) {
      console.error('❌ Erro ao salvar produto:', error);
      throw error;
    }

    console.log(`✅ Produto atualizado: ${produtoData.nome}`);
  } catch (error) {
    console.error('❌ Erro em atualizarProduto:', error);
    throw error;
  }
}

/**
 * GET - Retorna instruções de configuração
 */
export async function GET() {
  return NextResponse.json({
    mensagem: 'Webhook do FacilZap - Endpoint ativo',
    configuracao: {
      url: 'https://seu-site.com/api/webhooks/facilzap-produtos',
      metodo: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': 'SEU_SECRET_KEY (configure em FACILZAP_WEBHOOK_SECRET)',
      },
      eventos_suportados: [
        'produto.criado',
        'produto.atualizado',
        'produto.deletado',
        'sync.full',
      ],
      exemplo_payload: {
        event: 'produto.atualizado',
        produto: {
          id: '12345',
          nome: 'Produto Exemplo',
          preco: 99.90,
          estoque: 10,
          ativo: true,
        },
      },
    },
    variaveis_ambiente: {
      FACILZAP_WEBHOOK_SECRET: process.env.FACILZAP_WEBHOOK_SECRET ? '✅ Configurada' : '❌ Não configurada',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurada' : '❌ Não configurada',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configurada' : '❌ Não configurada',
    },
  });
}
