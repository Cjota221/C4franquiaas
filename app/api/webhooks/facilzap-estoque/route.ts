import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Tipo do payload do webhook da FácilZap
type FacilZapWebhookPayload = {
  event: 'product.stock.updated' | 'product.updated' | 'product.created';
  data: {
    id: string | number;
    codigo?: string;
    nome: string;
    estoque: number | { disponivel?: number; estoque?: number };
    variacoes?: Array<{
      id: string | number;
      nome: string;
      sku?: string;
      estoque: number | { estoque?: number };
    }>;
  };
  timestamp: string;
};

// Normalizar estoque (pode vir como number ou objeto)
function normalizeEstoque(estoqueField: unknown): number {
  if (typeof estoqueField === 'number' && Number.isFinite(estoqueField)) {
    return estoqueField;
  }
  if (typeof estoqueField === 'string') {
    const parsed = parseFloat(estoqueField);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (estoqueField && typeof estoqueField === 'object') {
    const obj = estoqueField as Record<string, unknown>;
    const disponivel = obj.disponivel ?? obj.estoque;
    return normalizeEstoque(disponivel);
  }
  return 0;
}

// Criar notificação de mudança de estoque
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function criarNotificacao(supabase: any, params: {
  produto_id: string;
  produto_nome: string;
  id_externo: string;
  variacao_id?: string;
  variacao_nome?: string;
  variacao_sku?: string;
  estoque_anterior: number;
  estoque_atual: number;
  tipo_mudanca: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('estoque_notifications')
    .insert({
      produto_id: params.produto_id,
      produto_nome: params.produto_nome,
      id_externo: params.id_externo,
      variacao_id: params.variacao_id || null,
      variacao_nome: params.variacao_nome || null,
      variacao_sku: params.variacao_sku || null,
      estoque_anterior: params.estoque_anterior,
      estoque_atual: params.estoque_atual,
      tipo_mudanca: params.tipo_mudanca,
      visualizada: false,
    });

  if (error) {
    console.error('[Webhook] Erro ao criar notificação:', error);
  } else {
    const diff = params.estoque_atual - params.estoque_anterior;
    const signal = diff > 0 ? '+' : '';
    console.log(
      `[Webhook] 📢 Notificação criada: ${params.produto_nome}${
        params.variacao_nome ? ` - ${params.variacao_nome}` : ''
      }: ${signal}${diff} unidades`
    );
  }
}

// Processar webhook de atualização de estoque
export async function POST(request: NextRequest) {
  try {
    const payload: FacilZapWebhookPayload = await request.json();

    console.log('[Webhook FácilZap] Recebido:', {
      event: payload.event,
      produto: payload.data.nome,
      id: payload.data.id,
    });

    // Validar evento
    if (!payload.event || !payload.data) {
      return NextResponse.json(
        { error: 'Payload inválido: event e data são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar cliente Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const id_externo = String(payload.data.id || payload.data.codigo);
    const nome = payload.data.nome;
    const estoqueTotal = normalizeEstoque(payload.data.estoque);

    // 1️⃣ Buscar produto no banco
    const { data: produtoAtual, error: fetchError } = await supabase
      .from('produtos')
      .select('id, nome, estoque, variacoes_meta')
      .eq('id_externo', id_externo)
      .single();

    if (fetchError) {
      console.error('[Webhook] Produto não encontrado no banco:', id_externo);
      return NextResponse.json(
        { error: 'Produto não encontrado', id_externo },
        { status: 404 }
      );
    }

    // 2️⃣ Preparar variações atualizadas
    const variacoes = Array.isArray(payload.data.variacoes) ? payload.data.variacoes : [];
    const variacoes_meta = variacoes.map((v) => ({
      id: String(v.id),
      sku: v.sku || null,
      nome: v.nome,
      estoque: normalizeEstoque(v.estoque),
      codigo_barras: null,
    }));

    // 3️⃣ Comparar estoque anterior com atual e criar notificações
    const estoqueAnterior = produtoAtual.estoque || 0;
    const variacoesAnteriores = produtoAtual.variacoes_meta || [];

    // Notificação de estoque total (se mudou)
    if (estoqueAnterior !== estoqueTotal) {
      await criarNotificacao(supabase, {
        produto_id: produtoAtual.id,
        produto_nome: nome,
        id_externo,
        estoque_anterior: estoqueAnterior,
        estoque_atual: estoqueTotal,
        tipo_mudanca: 'sincronizacao',
      });
    }

    // Notificações por variação
    for (const variacaoNova of variacoes_meta) {
      const variacaoAnterior = variacoesAnteriores.find(
        (v: { id: string | number }) => String(v.id) === String(variacaoNova.id)
      );
      
      const estoqueAnteriorVar = variacaoAnterior?.estoque ?? 0;
      const estoqueAtualVar = variacaoNova.estoque;

      if (estoqueAnteriorVar !== estoqueAtualVar) {
        await criarNotificacao(supabase, {
          produto_id: produtoAtual.id,
          produto_nome: nome,
          id_externo,
          variacao_id: variacaoNova.id,
          variacao_nome: variacaoNova.nome,
          variacao_sku: variacaoNova.sku || undefined,
          estoque_anterior: estoqueAnteriorVar,
          estoque_atual: estoqueAtualVar,
          tipo_mudanca: 'venda',
        });
      }
    }

    // 4️⃣ Atualizar produto no banco
    const { error: updateError } = await supabase
      .from('produtos')
      .update({
        estoque: estoqueTotal,
        variacoes_meta,
        updated_at: new Date().toISOString(),
      })
      .eq('id', produtoAtual.id);

    if (updateError) {
      console.error('[Webhook] Erro ao atualizar produto:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar produto', details: updateError.message },
        { status: 500 }
      );
    }

    console.log('[Webhook] ✅ Produto atualizado com sucesso:', nome);

    // 5️⃣ TODO: Disparar webhook para e-commerce das franqueadas
    // await dispararWebhookFranqueadas(id_externo, { estoque: estoqueTotal, variacoes_meta });

    return NextResponse.json({
      success: true,
      message: 'Estoque atualizado com sucesso',
      produto: nome,
      id_externo,
      estoque: estoqueTotal,
      variacoes: variacoes_meta.length,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('[Webhook] Erro ao processar:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar webhook', details: errorMessage },
      { status: 500 }
    );
  }
}

// Método GET para verificar se o endpoint está ativo
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhooks/facilzap-estoque',
    description: 'Endpoint para receber webhooks de atualização de estoque da FácilZap',
    events: ['product.stock.updated', 'product.updated', 'product.created'],
  });
}
